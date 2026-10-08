import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const MAX_BYTES = 5 * 1024 * 1024 * 1024 // 5GB — teto de sanidade, não é um limite de negócio

// Gera uma URL pré-assinada para o navegador enviar o arquivo DIRETO para o R2,
// sem que a chave secreta do bucket passe pelo cliente em nenhum momento.
// Serve para vídeo de aula e para material da biblioteca (PDF, apostila, etc) —
// o caminho continua /presign-video-upload por compatibilidade.
// Só administradores autenticados (checado via Supabase) recebem a URL.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Não autenticado' })

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY

    // 1) descobre quem é o usuário a partir do token
    const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    })
    if (!userResp.ok) return res.status(401).json({ error: 'Sessão inválida' })
    const user = await userResp.json()

    // 2) confirma que o perfil dele tem role = admin (RLS permite ler o próprio perfil)
    const profResp = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    })
    const profile = (await profResp.json())?.[0]
    if (profile?.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores podem enviar vídeos' })

    // 3) valida a requisição
    const { fileName, contentType, fileSize } = req.body || {}
    if (!fileName || !fileSize) return res.status(400).json({ error: 'Dados do arquivo ausentes' })
    if (fileSize > MAX_BYTES) return res.status(413).json({ error: `Arquivo maior que ${MAX_BYTES / 1024 / 1024 / 1024}GB.` })

    // 4) gera a URL de upload temporária (válida por 15 min)
    const ext = (fileName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
    })
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      // o tipo real importa: é ele que faz o PDF abrir no navegador em vez de baixar
      ContentType: contentType || 'application/octet-stream',
    })
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 })
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return res.status(200).json({ uploadUrl, publicUrl })
  } catch (err) {
    console.error('presign-video-upload error:', err)
    return res.status(500).json({ error: 'Falha ao preparar o envio.' })
  }
}
