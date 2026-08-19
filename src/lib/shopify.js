// Domínio público da loja — só monta links de vitrine, não é segredo.
export const STORE_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'geosense.myshopify.com'

export const storeProductUrl = (handle) =>
  handle ? `https://${STORE_DOMAIN}/products/${handle}` : `https://${STORE_DOMAIN}`
