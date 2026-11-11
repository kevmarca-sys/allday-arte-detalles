import { createContext, useContext, useState } from 'react'
import { api } from './api.js'

const AuthCtx = createContext(null)
const leer = () => {
  try { return JSON.parse(localStorage.getItem('allday_user') || sessionStorage.getItem('allday_user')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leer)
  async function login(email, password, recordar) {
    const { data } = await api.post('/auth/login', { email, password })
    const s = recordar ? localStorage : sessionStorage
    const u = { id: data.id, nombre: data.nombre, email: data.email, rol: data.rol }
    s.setItem('allday_token', data.token); s.setItem('allday_user', JSON.stringify(u))
    setUser(u)
    return u
  }
  function logout() {
    for (const s of [localStorage, sessionStorage]) { s.removeItem('allday_token'); s.removeItem('allday_user') }
    setUser(null)
  }
  return <AuthCtx.Provider value={{ user, login, logout, esAdmin: user?.rol === 'ADMIN' }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)
