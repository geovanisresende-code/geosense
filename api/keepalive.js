// Roda uma vez por dia (via Vercel Cron) só pra fazer uma consulta real no banco.
// O Supabase no plano gratuito pausa o projeto após ~7 dias sem atividade — esse
// ping evita que isso aconteça de novo (já aconteceu 2x neste projeto).
export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY
    const r = await fetch(`${supabaseUrl}/rest/v1/categories?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    return res.status(200).json({ ok: r.ok, supabaseStatus: r.status, at: new Date().toISOString() })
  } catch (err) {
    console.error('keepalive error:', err)
    return res.status(500).json({ ok: false, error: String(err) })
  }
}
