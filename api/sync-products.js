// Passo 2 — Sincroniza os produtos da Shopify para a tabela `products` do Supabase.
//   GET/POST /api/sync-products   (precisa de Bearer token de um admin da plataforma)
//
// Lê https://<loja>/admin/api/<versão>/products.json (paginado) e faz upsert
// por shopify_product_id. A Shopify continua sendo a fonte da verdade; esta
// tabela é o espelho que o painel lê e edita.
import {
  requireAdmin, getShopCredentials, shopifyFetch, proximaPagina, supabaseAdminFetch, API_VERSION,
} from './_shopify.js'

// Shopify → linha do Supabase
function mapProduto(p) {
  const variante = p.variants?.[0]
  const imagem = p.image?.src || p.images?.[0]?.src || ''
  return {
    shopify_product_id: p.id,
    shopify_variant_id: variante?.id ?? null,
    title: p.title || '',
    description: p.body_html || '',
    thumbnail_url: imagem,
    price: variante?.price != null && variante.price !== '' ? Number(variante.price) : null,
    status: p.status || 'active',
    handle: p.handle || '',
    synced_at: new Date().toISOString(),
  }
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const { shop, accessToken } = await getShopCredentials()

    // 1) busca todas as páginas de produtos
    const produtos = []
    let url = 'products.json?limit=250'
    let paginas = 0

    while (url && paginas < 40) {
      const resp = await shopifyFetch(shop, accessToken, url)
      if (!resp.ok) {
        const corpo = await resp.text()
        console.error('Shopify products.json falhou:', resp.status, corpo)
        // O texto da Shopify é o que diz se é token inválido, escopo faltando ou
        // versão de API inexistente. Sem ele, 401 e 403 viram adivinhação.
        return res.status(502).json({
          error: `A Shopify recusou a consulta (${resp.status}): ${corpo.slice(0, 300)}`,
          apiVersion: API_VERSION,
          shop,
        })
      }
      const { products } = await resp.json()
      produtos.push(...(products || []))
      url = proximaPagina(resp.headers.get('link'))
      paginas++
    }

    // 2) upsert no Supabase (uma chamada só, em lote)
    if (produtos.length > 0) {
      const gravou = await supabaseAdminFetch('products?on_conflict=shopify_product_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(produtos.map(mapProduto)),
      })
      if (!gravou.ok) {
        const corpo = await gravou.text()
        console.error('Falha no upsert de products:', gravou.status, corpo)
        return res.status(500).json({ error: 'Produtos lidos, mas falhou ao gravar no banco.' })
      }
    }

    // 3) tira do espelho o que não existe mais na loja (só quando a leitura
    //    veio inteira — nunca apaga por causa de uma página que falhou)
    let removidos = 0
    const ids = produtos.map((p) => p.id)
    if (ids.length <= 500) {
      const filtro = ids.length ? `shopify_product_id=not.in.(${ids.join(',')})` : 'shopify_product_id=gt.0'
      const apagou = await supabaseAdminFetch(`products?${filtro}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' },
      })
      if (apagou.ok) removidos = (await apagou.json())?.length || 0
    }

    return res.status(200).json({ ok: true, shop, sincronizados: produtos.length, removidos })
  } catch (err) {
    console.error('sync-products error:', err)
    return res.status(500).json({ error: String(err.message || err) })
  }
}
