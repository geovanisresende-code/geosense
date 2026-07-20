import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()
const STORAGE_KEY = 'geosense:auth:v1'

// Autenticação de PROTÓTIPO (client-side).
// admin / 123  → administrador (painel de controle)
// qualquer outro usuário + senha → aluno (dashboard)
// Na integração com o Shopify, o login/pagamento passará a ser do Shopify.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  function login(username, password) {
    const u = (username || '').trim()
    const p = password || ''
    if (!u || !p) return { ok: false, message: 'Preencha usuário e senha.' }

    if (u.toLowerCase() === 'admin' && p === '123') {
      const next = { name: 'Administrador', role: 'admin' }
      setUser(next)
      return { ok: true, role: 'admin' }
    }

    // Prototype: aceita qualquer outro usuário como aluno
    const next = { name: u, role: 'student' }
    setUser(next)
    return { ok: true, role: 'student' }
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
