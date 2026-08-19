// Helpers compartilhados pelas rotas da Shopify. O prefixo "_" faz a Vercel
// tratar este arquivo como módulo comum, e não como uma função/endpoint.

export const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07'
export const SHOP_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/

const supabaseUrl = () => process.env.VITE_SUPABASE_URL
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY

// ── Supabase com a service role key (só no servidor) ────────────────────────
export async function supabaseAdminFetch(path, init = {}) {
  const key = serviceKey()
  if (!supabaseUrl() || !key) throw new Error('Supabase não configurado no servidor (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).')
  return fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

// ── Quem pode chamar: só admin logado na plataforma ─────────────────────────
// Mesmo esquema do /api/presign-video-upload: valida o token do Supabase e
// confere role = admin no perfil. Devolve null e já responde em caso de erro.
export async function requireAdmin(req, res) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) { res.status(401).json({ error: 'Não autenticado' }); return null }

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const userResp = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  })
  if (!userResp.ok) { res.status(401).json({ error: 'Sessão inválida' }); return null }
  const user = await userResp.json()

  const profResp = await fetch(`${supabaseUrl()}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  })
  const profile = (await profResp.json())?.[0]
  if (profile?.role !== 'admin') { res.status(403).json({ error: 'Apenas administradores' }); return null }
  return user
}

// ── Loja + token de acesso ──────────────────────────────────────────────────
// Prioridade: linha gravada pelo OAuth em shopify_shops. Se o app for um
// "custom app" criado direto no admin da loja (sem OAuth), aceita também um
// token fixo em SHOPIFY_ADMIN_TOKEN.
export async function getShopCredentials() {
  const envShop = process.env.SHOPIFY_STORE_DOMAIN
  const envToken = process.env.SHOPIFY_ADMIN_TOKEN

  // Prefere a loja de SHOPIFY_STORE_DOMAIN, mas cai para a instalação mais
  // recente se ela não estiver instalada. Antes, um valor errado nessa variável
  // fazia o app jurar que não havia loja nenhuma com o token gravado na frente.
  const filtros = envShop
    ? [`shop=eq.${encodeURIComponent(envShop)}`, 'order=installed_at.desc']
    : ['order=installed_at.desc']

  for (const filtro of filtros) {
    const resp = await supabaseAdminFetch(`shopify_shops?${filtro}&select=shop,access_token&limit=1`)
    if (!resp.ok) {
      console.error('Consulta a shopify_shops falhou:', resp.status, await resp.text())
      continue
    }
    const row = (await resp.json())?.[0]
    if (row?.access_token) return { shop: row.shop, accessToken: row.access_token }
  }

  if (envShop && envToken) return { shop: envShop, accessToken: envToken }
  throw new Error(
    'Nenhuma loja instalada: a tabela shopify_shops está vazia ou o token não foi gravado. ' +
    'Rode o OAuth em /api/auth?shop=SUALOJA.myshopify.com',
  )
}

// ── Chamada à Admin API da Shopify ──────────────────────────────────────────
export async function shopifyFetch(shop, accessToken, pathOrUrl, init = {}) {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `https://${shop}/admin/api/${API_VERSION}/${pathOrUrl.replace(/^\//, '')}`

  return fetch(url, {
    ...init,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

// A Shopify pagina por cursor no header Link: <...page_info=...>; rel="next"
export function proximaPagina(linkHeader) {
  if (!linkHeader) return null
  const parte = linkHeader.split(',').find((p) => p.includes('rel="next"'))
  const url = parte?.match(/<([^>]+)>/)?.[1]
  return url || null
}
