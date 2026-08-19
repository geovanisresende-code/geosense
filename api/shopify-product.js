// Passo 3 — Empurra a edição feita no painel de volta para a Shopify.
//   PUT /api/shopify-product   (Bearer token de um admin da plataforma)
//   body: { shopifyProductId, variantId?, title?, description?, price?, status? }
//
// Faz PUT https://<loja>/admin/api/<versão>/products/<id>.json e regrava o
// resultado na tabela `products`, para o espelho não ficar desencontrado.
// Exige o escopo write_products na instalação do app.
import {
  requireAdmin, getShopCredentials, shopifyFetch, supabaseAdminFetch,
} from './_shopify.js'

const STATUS_VALIDOS = ['active', 'draft', 'archived']

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método não permitido' })

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const { shopifyProductId, variantId, title, description, price, status } = req.body || {}
    const produtoId = Number(shopifyProductId)
    if (!produtoId) return res.status(400).json({ error: 'shopifyProductId ausente.' })
    if (status && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ error: `status deve ser um de: ${STATUS_VALIDOS.join(', ')}` })
    }

    // monta só o que veio — a Shopify sobrescreve apenas os campos enviados
    const product = { id: produtoId }
    if (title !== undefined) product.title = title
    if (description !== undefined) product.body_html = description
    if (status !== undefined) product.status = status
    if (price !== undefined && price !== '' && variantId) {
      product.variants = [{ id: Number(variantId), price: String(price) }]
    }

    const { shop, accessToken } = await getShopCredentials()
    const resp = await shopifyFetch(shop, accessToken, `products/${produtoId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ product }),
    })

    if (!resp.ok) {
      const corpo = await resp.text()
      console.error('Shopify PUT product falhou:', resp.status, corpo)
      const dica = resp.status === 403
        ? ' Confira se o app foi instalado com o escopo write_products.'
        : ''
      return res.status(502).json({ error: `A Shopify recusou a alteração (${resp.status}).${dica}` })
    }

    const atualizado = (await resp.json())?.product
    const variante = atualizado?.variants?.[0]

    // espelha de volta no Supabase o que a Shopify de fato gravou
    await supabaseAdminFetch('products?on_conflict=shopify_product_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        shopify_product_id: atualizado.id,
        shopify_variant_id: variante?.id ?? null,
        title: atualizado.title || '',
        description: atualizado.body_html || '',
        thumbnail_url: atualizado.image?.src || atualizado.images?.[0]?.src || '',
        price: variante?.price != null && variante.price !== '' ? Number(variante.price) : null,
        status: atualizado.status || 'active',
        handle: atualizado.handle || '',
        synced_at: new Date().toISOString(),
      }),
    })

    return res.status(200).json({ ok: true, product: atualizado })
  } catch (err) {
    console.error('shopify-product error:', err)
    return res.status(500).json({ error: String(err.message || err) })
  }
}
