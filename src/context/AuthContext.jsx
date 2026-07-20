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
  }

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      if (sess) await loadProfile(sess.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const user = session
    ? {
        id: session.user.id,
        email: session.user.email,
        name: profile?.full_name || session.user.email,
        role: profile?.role || 'student',
      }
    : null

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { ok: false, message: traduz(error.message) }
    return { ok: true }
  }

  async function signup(name, email, password) {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    })
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
