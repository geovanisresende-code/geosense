// Início do OAuth do Shopify. O merchant bate aqui (App URL) e é mandado
// para a tela de autorização da loja dele.
import crypto from 'node:crypto'

const SHOP_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/

export default function handler(req, res) {
  const shop = String(req.query.shop || '')
  if (!SHOP_RE.test(shop)) {
    return res.status(400).send('Parâmetro "shop" ausente ou inválido.')
  }

  const apiKey = process.env.SHOPIFY_API_KEY
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products'
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`
  if (!apiKey) return res.status(500).send('SHOPIFY_API_KEY não configurada.')

  // state anti-CSRF: guardado em cookie e conferido no callback
  const state = crypto.randomBytes(16).toString('hex')
  res.setHeader(
    'Set-Cookie',
    `shopify_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  )

  const url =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${encodeURIComponent(apiKey)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(`${appUrl}/api/auth/callback`)}` +
    `&state=${state}`

  res.redirect(302, url)
}
