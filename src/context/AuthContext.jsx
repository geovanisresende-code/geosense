import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext()

// Atalho de administrador: quem digitar  admin / 123  entra nesta conta,
// que é criada automaticamente na 1ª vez e recebe papel de admin.
const ADMIN_EMAIL = 'admin@geosense.app'
const ADMIN_PASSWORD = 'GeoSense@Admin123'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('full_name, role').eq('id', userId).single()
    setProfile(data || null)
    return data
  }

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      setSession(sess)
      if (sess) await loadProfile(sess.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const isAdminAccount = session?.user?.email === ADMIN_EMAIL
  const user = session
    ? {
        id: session.user.id,
        email: session.user.email,
        name: isAdminAccount ? 'Administrador' : (profile?.full_name || session.user.email),
        role: isAdminAccount || profile?.role === 'admin' ? 'admin' : 'student',
      }
    : null

  async function login(identifier, password) {
    const id = (identifier || '').trim()
    const pass = password || ''
    if (!id || !pass) return { ok: false, message: 'Preencha usuário e senha.' }

    // ── Atalho do administrador: admin / 123 ──
    if (id.toLowerCase() === 'admin' && pass === '123') {
      let res = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      if (res.error) {
        // primeira vez: cria a conta de admin
        const up = await supabase.auth.signUp({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, options: { data: { full_name: 'Administrador' } } })
        if (up.error) return { ok: false, message: traduz(up.error.message) }
        res = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        if (res.error) return { ok: false, message: traduz(res.error.message) }
      }
      // garante papel admin no banco (RLS permite editar o próprio perfil)
      const uid = res.data?.user?.id
      if (uid) { await supabase.from('profiles').update({ role: 'admin' }).eq('id', uid); await loadProfile(uid) }
      return { ok: true, role: 'admin' }
    }

    // ── Login normal (aluno) por e-mail ──
    const { error } = await supabase.auth.signInWithPassword({ email: id, password: pass })
    if (error) return { ok: false, message: traduz(error.message) }
    return { ok: true, role: 'student' }
  }

  async function signup(name, email, password) {
    const { error } = await supabase.auth.signUp({ email: (email || '').trim(), password, options: { data: { full_name: (name || '').trim() } } })
    if (error) return { ok: false, message: traduz(error.message) }
    return { ok: true }
  }

  async function logout() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function updateName(full_name) {
    if (!user) return
    await supabase.from('profiles').update({ full_name }).eq('id', user.id)
    await loadProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, loading, configured: isSupabaseConfigured, login, signup, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}

function traduz(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (m.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('email')) return 'E-mail inválido.'
  return 'Não foi possível concluir. Tente novamente.'
}

export const useAuth = () => useContext(AuthContext)
