import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext()

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

  // O papel vem do banco e só de lá. Decidir isso no navegador (por e-mail, por
  // exemplo) é enfeite: quem edita o próprio JS se promove sozinho.
  const user = session
    ? {
        id: session.user.id,
        email: session.user.email,
        name: profile?.full_name || session.user.email,
        role: profile?.role === 'admin' ? 'admin' : 'student',
      }
    : null

  async function login(identifier, password) {
    const id = (identifier || '').trim()
    const pass = password || ''
    if (!id || !pass) return { ok: false, message: 'Preencha e-mail e senha.' }

    const { error } = await supabase.auth.signInWithPassword({ email: id, password: pass })
    if (error) return { ok: false, message: traduz(error.message) }
    return { ok: true }
  }

  // Login sem senha: o aluno digita o e-mail e recebe um link de acesso.
  // É o que une a compra ao acesso — quem comprou na Shopify entra com o mesmo
  // e-mail e o Supabase cria a conta na hora, disparando o handle_new_user que
  // resgata as compras pendentes. Sem senha, sem cadastro separado.
  async function loginWithMagicLink(email) {
    const mail = (email || '').trim().toLowerCase()
    if (!mail) return { ok: false, message: 'Informe seu e-mail.' }
    const { error } = await supabase.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) return { ok: false, message: traduz(error.message) }
    return { ok: true }
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
    <AuthContext.Provider value={{ user, loading, configured: isSupabaseConfigured, login, loginWithMagicLink, signup, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}

function traduz(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitos envios seguidos. Espere alguns minutos e tente de novo.'
  if (m.includes('already registered')) return 'Este e-mail já está cadastrado.'
  if (m.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('email')) return 'E-mail inválido.'
  return 'Não foi possível concluir. Tente novamente.'
}

export const useAuth = () => useContext(AuthContext)
