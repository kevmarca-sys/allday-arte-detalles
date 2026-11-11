import axios from 'axios'

export const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || '') + '/api', timeout: 15000 })

/** "Recordar sesión" guarda el token en localStorage; si no, solo dura mientras la pestaña esté abierta. */
export const almacen = () => (localStorage.getItem('allday_token') ? localStorage : sessionStorage)

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('allday_token') || sessionStorage.getItem('allday_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      for (const s of [localStorage, sessionStorage]) { s.removeItem('allday_token'); s.removeItem('allday_user') }
      if (location.pathname.startsWith('/panel')) location.assign('/admin?expirada=1')
    }
    return Promise.reject(err)
  }
)

/** Mensaje legible a partir de un error de la API. */
export function errorMsg(err) {
  const d = err?.response?.data
  if (d?.campos) return Object.values(d.campos)[0] || d.mensaje
  if (d?.mensaje) return d.mensaje
  if (err?.code === 'ECONNABORTED' || !err?.response) return 'No hay conexión con el servidor. Revise que la API esté encendida.'
  return 'Ocurrió un error inesperado'
}
