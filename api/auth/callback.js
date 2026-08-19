// Callback do OAuth do Shopify.
// Registrar em Partner Dashboard → App setup → Allowed redirection URL(s):
//   https://geosense-app.vercel.app/api/auth/callback
import crypto from 'node:crypto'

const SHOP_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/

// HMAC do Shopify: tira o próprio hmac, ordena o resto, refaz a query e compara.
function hmacValido(query, secret) {
  const { hmac, signature, ...rest } = query
  if (!hmac) return false

  const message = Object.keys(rest)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(rest[k])}`)
    .join('&')

  const digest = crypto.createHmac('sha256', secret).update(message).digest()
  const recebido = Buffer.from(String(hmac), 'hex')
  return digest.length === recebido.length && crypto.timingSafeEqual(digest, recebido)
}

function lerCookie(req, nome) {
  const raw = req.headers.cookie || ''
  const achado = raw.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${nome}=`))
  return achado ? achado.slice(nome.length + 1) : null
}

export default async function handler(req, res) {
  const { code, shop, state } = req.query

  const apiKey = process.env.SHOPIFY_API_KEY
  const apiSecret = process.env.SHOPIFY_API_SECRET
  if (!apiKey || !apiSecret) {
    return res.status(500).send('SHOPIFY_API_KEY / SHOPIFY_API_SECRET não configuradas.')
  }

  if (!code || !SHOP_RE.test(String(shop || ''))) {
    return res.status(400).send('Requisição inválida: "code" ou "shop" ausente.')
  }

  if (!hmacValido(req.query, apiSecret)) {
    return res.status(401).send('HMAC inválido.')
  }

  const stateCookie = lerCookie(req, 'shopify_state')
  if (!stateCookie || stateCookie !== state) {
    return res.status(401).send('State inválido.')
  }

  // Troca o code pelo access token permanente
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: apiKey, client_secret: apiSecret, code }),
  })

  if (!tokenRes.ok) {
    return res.status(502).send(`Shopify recusou a troca do code (${tokenRes.status}).`)
  }

  const { access_token: accessToken, scope } = await tokenRes.json()

  // Grava no Supabase (tabela shopify_shops — ver supabase/schema.sql).
  // Usa a service role key: nunca vai para o navegador, só roda aqui no servidor.
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && serviceKey) {
    const gravou = await fetch(`${supabaseUrl}/rest/v1/shopify_shops?on_conflict=shop`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        shop,
        access_token: accessToken,
        scope,
        installed_at: new Date().toISOString(),
      }),
    })
    if (!gravou.ok) {
      console.error('Falha ao gravar shopify_shops:', gravou.status, await gravou.text())
      return res.status(500).send('Token obtido, mas falhou ao salvar no banco.')
    }
  } else {
    console.warn('Supabase não configurado no servidor — token NÃO foi salvo.')
  }

  // Limpa o state e devolve o merchant para o app embedado
  res.setHeader('Set-Cookie', 'shopify_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
  res.redirect(302, `/?shop=${encodeURIComponent(shop)}`)
}
