import { waInternacional } from './util.js'
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

/** Datos públicos del negocio (horario, WhatsApp, dirección, redes), editables en Configuración. */
const Ctx = createContext({ cfg: {}, categorias: [], recargar: () => {} })
export function ConfigProvider({ children }) {
  const [cfg, setCfg] = useState({})
  const [categorias, setCategorias] = useState([])
  const recargar = () => {
    api.get('/public/configuracion').then((r) => setCfg(r.data)).catch(() => {})
    api.get('/public/categorias').then((r) => setCategorias(r.data)).catch(() => {})
  }
  useEffect(() => { recargar() }, [])
  const whatsapp = waInternacional(cfg.whatsapp || import.meta.env.VITE_WHATSAPP || '')
  const horario = cfg.horario || 'Lun - Sáb: 08:30 - 19:00'
  return <Ctx.Provider value={{ cfg, categorias, whatsapp, horario, recargar }}>{children}</Ctx.Provider>
}
export const useConfig = () => useContext(Ctx)
