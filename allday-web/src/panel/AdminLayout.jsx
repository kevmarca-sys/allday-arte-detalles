import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useConfig } from '../config.jsx'
import { I } from '../components/ui.jsx'
import Calculadora from '../components/Calculadora.jsx'
import CorteCaja from '../components/CorteCaja.jsx'
import { AreaImpresion } from '../components/Ticket.jsx'
import { diaRelativo, difDias, iniciales } from '../util.js'

const PanelCtx = createContext({})
export const usePanel = () => useContext(PanelCtx)

/** ¿Está abierto el local según el horario configurado? (formato "Lun - Sáb: 08:30 - 19:00") */
export function estadoLocal(horario = '') {
  const h = horario.match(/(\d{1,2}):(\d{2})\s*[-–a]+\s*(\d{1,2}):(\d{2})/)
  if (!h) return null
  const ahora = new Date(), min = ahora.getHours() * 60 + ahora.getMinutes()
  const ini = +h[1] * 60 + +h[2], fin = +h[3] * 60 + +h[4]
  const domingo = ahora.getDay() === 0 && !/dom/i.test(horario)
  return !domingo && min >= ini && min < fin
}

const NAV = [
  ['inicio', 'home', 'Inicio'], ['caja', 'point_of_sale', 'Caja'], ['ventas', 'receipt_long', 'Ventas'], ['pedidos', 'shopping_bag', 'Pedidos'],
  ['productos', 'palette', 'Productos'], ['categorias', 'category', 'Categorías'], ['inventario', 'inventory_2', 'Inventario', true],
  ['clientes', 'groups', 'Clientes'], ['reportes', 'bar_chart', 'Reportes', true], ['configuracion', 'settings', 'Configuración', true],
]

function Notificaciones() {
  const [abierto, setAbierto] = useState(false)
  const [items, setItems] = useState([])
  const ref = useRef()
  const nav = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    Promise.all([api.get('/inventario/alertas').catch(() => ({ data: [] })), api.get('/pedidos').catch(() => ({ data: [] }))]).then(([a, p]) => {
      const hoy = p.data.filter((x) => x.estado !== 'LISTO' && difDias(x.fechaEntrega) <= 0)
      setItems([
        ...hoy.map((x) => ({ i: 'event', c: 'text-secondary', t: `${x.codigo} · ${difDias(x.fechaEntrega) < 0 ? 'atrasado' : 'entrega hoy'}`, s: `${x.cliente} — ${x.tipo}`, to: '/panel/pedidos' })),
        ...p.data.filter((x) => x.estado === 'LISTO').map((x) => ({ i: 'check_circle', c: 'text-tertiary', t: `${x.codigo} listo para retirar`, s: `Avisar a ${x.cliente}`, to: '/panel/pedidos' })),
        ...a.data.map((x) => ({ i: 'warning', c: 'text-error', t: `Stock bajo: ${x.nombre}`, s: `Quedan ${x.stock} (mínimo ${x.stockMinimo})`, to: '/panel/inventario' })),
      ])
    })
  }, [pathname])
  useEffect(() => { const h = (e) => !ref.current?.contains(e.target) && setAbierto(false); document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label={`Notificaciones (${items.length})`} onClick={() => setAbierto(!abierto)} className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors relative">
        <I n="notifications" className="text-[20px]" />
        {items.length > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold flex items-center justify-center">{items.length > 9 ? '9+' : items.length}</span>}
      </button>
      {abierto && (
        <div className="absolute right-0 mt-2 w-96 max-h-[70vh] overflow-y-auto bg-surface-container-lowest rounded-xl shadow-2xl z-50 p-space-sm">
          <div className="px-space-sm py-space-xs font-label-lg text-label-lg text-on-surface">Avisos del día</div>
          {items.length === 0 ? <p className="px-space-sm py-space-md font-body-md text-body-md text-on-surface-variant">Todo en orden: sin pedidos urgentes ni stock bajo.</p>
            : items.map((n, k) => (
              <button key={k} type="button" onClick={() => { setAbierto(false); nav(n.to) }} className="w-full text-left flex items-start gap-space-sm p-space-sm rounded-lg hover:bg-surface-container-low">
                <I n={n.i} className={`${n.c} text-[20px] mt-0.5`} /><span className="min-w-0"><span className="block font-label-md text-label-md text-on-surface truncate">{n.t}</span><span className="block font-body-sm text-body-sm text-on-surface-variant truncate">{n.s}</span></span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout() {
  const { user, esAdmin, logout } = useAuth()
  const { horario } = useConfig()
  const nav = useNavigate()
  const [calc, setCalc] = useState(false), [corte, setCorte] = useState(false)
  const [q, setQ] = useState('')
  const abierto = estadoLocal(horario)
  const buscar = (e) => {
    e.preventDefault()
    const t = q.trim(); if (!t) return
    if (/^ad-\d+$/i.test(t)) nav(`/panel/pedidos?q=${encodeURIComponent(t.toUpperCase())}`)
    else if (/^\d{3}-\d{3}-\d+$|^\d{9,}$/.test(t)) nav(`/panel/ventas?q=${encodeURIComponent(t)}`)
    else nav(`/panel/productos?q=${encodeURIComponent(t)}`)
    setQ('')
  }
  const link = ({ isActive }) => `flex items-center gap-space-sm px-space-md py-2.5 rounded-xl transition-all font-label-md text-label-md ${isActive ? 'bg-primary-container text-on-primary font-bold shadow-[0_4px_16px_-2px_rgba(30,41,59,0.12)]' : 'text-primary-fixed hover:bg-primary-container hover:text-on-primary'}`

  return (
    <PanelCtx.Provider value={{ abrirCalculadora: () => setCalc(true), abrirCorte: () => setCorte(true) }}>
      <div className="bg-surface font-body-md text-body-md text-on-surface min-w-[1100px]">
        <aside className="fixed left-0 top-0 h-screen w-72 bg-primary flex flex-col z-50 shadow-[0_4px_24px_rgba(30,41,59,0.18)]">
          <Link to="/panel/inicio" className="h-20 px-space-lg flex items-center gap-space-sm">
            <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0"><img src="/logo-mark.png" alt="" className="w-7 h-7 object-contain" /></span>
            <span className="flex flex-col"><span className="font-headline-sm text-headline-sm text-on-primary tracking-tight">ALL DAY Arte</span><span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">Taller &amp; Detalles · Cuenca</span></span>
          </Link>
          <div className="px-space-md py-space-xs">
            <div className="bg-on-primary-fixed px-space-md py-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-xs"><span className={`w-2.5 h-2.5 rounded-full ${abierto === false ? 'bg-outline' : 'bg-secondary-container animate-pulse'}`} /><span className="font-label-sm text-label-sm text-primary-fixed">{abierto === false ? 'Fuera de horario' : 'Caja en servicio'}</span></div>
              <span className="font-label-sm text-label-sm text-inverse-primary">{esAdmin ? 'Admin' : 'Mostrador'}</span>
            </div>
          </div>
          <nav aria-label="Menú del panel" className="flex-1 px-space-md py-space-sm space-y-1 overflow-y-auto">
            {NAV.filter((n) => !n[3] || esAdmin).map(([to, i, t]) => <NavLink key={to} to={`/panel/${to}`} className={link}><I n={i} className="text-[20px]" /><span>{t}</span></NavLink>)}
          </nav>
          <div className="p-space-md mt-auto space-y-space-xs">
            <div className="bg-on-primary-fixed/60 p-space-sm rounded-xl flex items-center gap-space-xs min-w-0">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-md text-label-md font-bold shrink-0">{iniciales(user?.nombre)}</div>
              <div className="flex flex-col min-w-0"><span className="font-label-md text-label-md text-on-primary truncate">{user?.nombre}</span><span className="font-body-sm text-body-sm text-primary-fixed-dim truncate">{esAdmin ? 'Administración' : 'Personal de mostrador'}</span></div>
            </div>
            <button type="button" onClick={() => { logout(); nav('/admin') }} className="flex items-center justify-center gap-space-xs w-full py-2 px-space-md rounded-lg text-primary-fixed hover:bg-error hover:text-on-error transition-all font-label-sm text-label-sm"><I n="logout" className="text-[18px]" /><span>Cerrar sesión</span></button>
          </div>
        </aside>

        <div className="pl-72 w-full min-h-screen flex flex-col">
          <header className="fixed top-0 left-72 right-0 h-20 bg-surface/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-space-lg flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md flex-1 max-w-2xl">
              <form onSubmit={buscar} className="relative w-full" role="search">
                <I n="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" placeholder="Buscar productos, códigos AD-0000 o N.º de comprobante…" className="w-full h-11 pl-10 pr-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-[0_2px_6px_-1px_rgba(30,41,59,0.04)] focus:outline-none focus:ring-2 focus:ring-primary-container/30" />
              </form>
              {abierto !== null && (
                <div className={`hidden xl:flex items-center gap-space-xs px-space-md py-1.5 rounded-full font-label-sm text-label-sm shrink-0 ${abierto ? 'bg-tertiary-fixed/40 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  <span className={`w-2 h-2 rounded-full ${abierto ? 'bg-tertiary-container' : 'bg-outline'}`} /><span>{abierto ? 'Local abierto' : 'Local cerrado'} · {horario.replace(/^[^:]*:\s*/, '')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-space-sm">
              <button type="button" aria-label="Calculadora" title="Calculadora" onClick={() => setCalc(true)} className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"><I n="calculate" className="text-[20px]" /></button>
              <button type="button" onClick={() => setCorte(true)} className="hidden 2xl:flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-low text-primary font-label-md text-label-md hover:bg-surface-container-high"><I n="lock_clock" className="text-[18px]" />Corte de Caja</button>
              <Link to="/panel/pedidos?nuevo=1" className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm hover:bg-primary-container transition-all shadow-sm"><I n="add" className="text-[18px]" /><span>Nuevo Pedido</span></Link>
              <Notificaciones />
              <Link to="/" target="_blank" title="Ver catálogo público" className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-label-md text-label-md font-bold">{iniciales(user?.nombre)}</Link>
            </div>
          </header>
          <main className="w-full pt-20 flex-1 bg-surface"><Outlet /></main>
        </div>
        {calc && <Calculadora onClose={() => setCalc(false)} />}
        {corte && <CorteCaja onClose={() => setCorte(false)} />}
        <AreaImpresion />
      </div>
    </PanelCtx.Provider>
  )
}

/** Encabezado de página del panel (migas, título, subtítulo y acciones). */
export function Cabecera({ miga, titulo, subtitulo, children, icono }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
      <div className="flex flex-col gap-1 min-w-0">
        {miga && <div className="flex items-center gap-space-xs font-label-sm text-label-sm"><span className="text-primary-container uppercase tracking-wider font-bold">{miga}</span><span className="w-1.5 h-1.5 rounded-full bg-secondary-container" /><span className="text-on-surface-variant">ALL DAY · Cuenca</span></div>}
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight flex items-center gap-space-sm">{icono && <span className="w-1.5 h-8 rounded-full bg-primary-container" />}{titulo}</h1>
        {subtitulo && <p className="font-body-md text-body-md text-on-surface-variant">{subtitulo}</p>}
      </div>
      {children && <div className="flex items-center gap-space-sm flex-wrap shrink-0">{children}</div>}
    </div>
  )
}
export const Pagina = ({ children }) => <div className="px-margin-desktop py-space-lg space-y-space-lg max-w-[1600px]">{children}</div>
