// Passo 4 — Webhook orders/paid da Shopify.
//   POST /api/webhooks/order-paid
//
// Cadastrar em: Shopify Admin → Configurações → Notificações → Webhooks.
// A Shopify assina cada entrega com o segredo mostrado nessa mesma tela; ele
// vai em SHOPIFY_WEBHOOK_SECRET (nunca no repositório).
import crypto from 'node:crypto'
import { supabaseAdminFetch } from '../_shopify.js'

// A Vercel só materializa req.body quando ele é lido; até lá o stream está
// intacto e dá para pegar os bytes originais — que é o que a assinatura cobre.
// (Se algo já tiver consumido o stream, cai no fallback de re-serializar.)
export const config = { api: { bodyParser: false } }

async function corpoCru(req) {
  const partes = []
  for await (const parte of req) partes.push(typeof parte === 'string' ? Buffer.from(parte) : parte)
  if (partes.length) return Buffer.concat(partes)
  return req.body ? Buffer.from(JSON.stringify(req.body)) : Buffer.alloc(0)
}

function assinaturaValida(corpo, assinatura, segredo) {
  if (!assinatura) return false
  const esperado = crypto.createHmac('sha256', segredo).update(corpo).digest()
  const recebido = Buffer.from(String(assinatura), 'base64')
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const segredo = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET
  if (!segredo) {
    console.error('SHOPIFY_WEBHOOK_SECRET não configurada.')
    return res.status(500).json({ error: 'Webhook não configurado.' })
  }

  const corpo = await corpoCru(req)
  if (!assinaturaValida(corpo, req.headers['x-shopify-hmac-sha256'], segredo)) {
    // 401 sem detalhe: quem não assina direito não precisa saber o motivo
    return res.status(401).json({ error: 'Assinatura inválida.' })
  }

  let pedido
  try {
    pedido = JSON.parse(corpo.toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Corpo não é JSON.' })
  }

  const cliente = pedido.customer
  const linha = {
    shopify_order_id: pedido.id,
    shop: req.headers['x-shopify-shop-domain'] || null,
    order_number: String(pedido.order_number ?? pedido.name ?? ''),
    email: pedido.email || pedido.contact_email || cliente?.email || null,
    customer_name: [cliente?.first_name, cliente?.last_name].filter(Boolean).join(' ') || null,
    total_price: pedido.total_price != null ? Number(pedido.total_price) : null,
    currency: pedido.currency || null,
    financial_status: pedido.financial_status || null,
    line_items: (pedido.line_items || []).map((i) => ({
      product_id: i.product_id, variant_id: i.variant_id,
      title: i.title, quantity: i.quantity, price: i.price,
    })),
    raw: pedido,
    paid_at: pedido.processed_at || pedido.created_at || new Date().toISOString(),
  }

  // upsert: a Shopify reentrega o mesmo evento quando não recebe 200 a tempo.
  // Qualquer falha aqui volta 500 de propósito — melhor a Shopify tentar de
  // novo do que responder 200 e perder o pedido.
  try {
    const gravou = await supabaseAdminFetch('shopify_orders?on_conflict=shopify_order_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(linha),
    })
    if (!gravou.ok) {
      console.error('Falha ao gravar shopify_orders:', gravou.status, await gravou.text())
      return res.status(500).json({ error: 'Falha ao gravar o pedido.' })
    }
  } catch (err) {
    console.error('order-paid error:', err)
    return res.status(500).json({ error: 'Falha ao gravar o pedido.' })
  }

  // Libera o acesso de quem comprou. Falha aqui também volta 500: os upserts
  // são idempotentes, então reentrega da Shopify só reexecuta sem estragar nada.
  try {
    const liberado = await liberarAcesso(pedido, linha.email)
    return res.status(200).json({ ok: true, ...liberado })
  } catch (err) {
    console.error('order-paid — falha ao liberar acesso:', err)
    return res.status(500).json({ error: 'Pedido gravado, mas falhou ao liberar o acesso.' })
  }
}

// Um pedido pago vira acesso aos produtos comprados. Se o comprador já tem
// conta na plataforma, entra direto em user_products; se ainda não se
// cadastrou, fica em pending_access e o trigger handle_new_user resgata no
// cadastro.
async function liberarAcesso(pedido, emailBruto) {
  const email = (emailBruto || '').trim().toLowerCase()
  const produtos = [...new Set((pedido.line_items || []).map((i) => i.product_id).filter(Boolean))]
  if (!email || produtos.length === 0) return { liberados: 0, pendentes: 0 }

  const compradoEm = pedido.processed_at || pedido.created_at || new Date().toISOString()

  // profiles espelha o e-mail do auth.users — o auth.users em si não é
  // acessível pelo PostgREST.
  const perfilResp = await supabaseAdminFetch(
    `profiles?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
  )
  if (!perfilResp.ok) throw new Error(`Consulta de perfil falhou (${perfilResp.status}).`)
  const perfil = (await perfilResp.json())?.[0]

  const [tabela, conflito, linhas] = perfil
    ? ['user_products', 'user_id,shopify_product_id',
       produtos.map((pid) => ({ user_id: perfil.id, shopify_product_id: pid, purchased_at: compradoEm }))]
    : ['pending_access', 'email,shopify_product_id',
       produtos.map((pid) => ({ email, shopify_product_id: pid, purchased_at: compradoEm }))]

  const gravou = await supabaseAdminFetch(`${tabela}?on_conflict=${conflito}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(linhas),
  })
  if (!gravou.ok) throw new Error(`Upsert em ${tabela} falhou (${gravou.status}): ${await gravou.text()}`)

  return perfil
    ? { liberados: produtos.length, pendentes: 0 }
    : { liberados: 0, pendentes: produtos.length }
}
