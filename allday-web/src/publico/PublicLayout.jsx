import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useConfig } from '../config.jsx'
import { I } from '../components/ui.jsx'
import { LinkPrivacidad } from '../components/Privacidad.jsx'
import { linkWhatsApp } from '../util.js'

export const Marca = ({ movil }) => (
  <Link to="/" className="flex items-center gap-space-sm min-w-0" aria-label="ALL DAY Arte – Detalles, inicio">
    <span className="relative shrink-0 w-9 h-9 rounded-full bg-surface-container-lowest shadow-[0_2px_8px_rgba(123,44,191,0.15)] flex items-center justify-center">
      <img src="/logo-mark.png" alt="" className="w-6 h-6 object-contain" />
      {movil && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary-container rounded-full" />}
    </span>
    <span className="flex flex-col">
      <span className="font-headline-sm text-headline-sm text-primary-container leading-tight">ALL DAY</span>
      <span className={movil ? 'font-label-sm text-[10px] text-tertiary font-bold tracking-wider uppercase leading-tight' : 'font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase'}>
        {movil ? 'Arte • Detalles' : 'Arte – Detalles · Cuenca'}
      </span>
    </span>
  </Link>
)

function Buscador({ movil }) {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') || '')
  useEffect(() => { setQ(sp.get('q') || '') }, [sp])
  const enviar = (e) => { e.preventDefault(); nav(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : '/catalogo') }
  return movil ? (
    <form onSubmit={enviar} role="search" className="relative flex items-center">
      <I n="search" className="absolute left-3 text-outline text-[18px]" />
      <input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Buscar en el catálogo" placeholder="Buscar en catálogo..."
        className="w-full h-11 pl-10 pr-space-md rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md font-body-md shadow-[0_2px_10px_rgba(30,41,59,0.03)] focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all" />
    </form>
  ) : (
    <form onSubmit={enviar} role="search" className="relative flex items-center bg-surface-container-low rounded-xl px-space-md py-space-xs focus-within:ring-2 focus-within:ring-primary-container transition-all">
      <I n="search" className="text-outline mr-space-sm text-[20px]" />
      <input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Buscar en el catálogo" placeholder="Buscar cuadernos, impresiones, cosméticos, regalos..."
        className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline py-1" />
    </form>
  )
}

export default function PublicLayout() {
  const { categorias, whatsapp, horario, cfg } = useConfig()
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const wa = linkWhatsApp(whatsapp, 'Hola ALL DAY, quisiera hacer una consulta.')
  const lugar = cfg.direccion || 'Cuenca, Ecuador'
  const navCls = ({ isActive }) => `px-space-md py-space-sm font-label-md text-label-md whitespace-nowrap transition-colors rounded-lg ${isActive ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`
  const chipCls = ({ isActive }) => `shrink-0 px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${isActive ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-on-surface hover:bg-primary-container hover:text-on-primary'}`
  const tabCls = ({ isActive }) => `flex flex-col items-center justify-center h-14 rounded-xl transition-all ${isActive ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary-container'}`

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:z-[90] focus:top-2 focus:left-2 btn-pri">Saltar al contenido</a>

      {/* ---------- Encabezado escritorio ---------- */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="bg-primary-container text-on-primary py-space-xs">
          <div className="max-w-7xl mx-auto px-margin-desktop flex items-center justify-between text-body-sm">
            <div className="flex items-center gap-space-sm font-label-md text-label-md">
              <span>📍 {lugar} · 🏪 Atención en el local · ⏰ {horario}</span>
            </div>
            {whatsapp && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-space-xs bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 text-on-primary px-space-sm py-space-xs rounded-full font-label-sm text-label-sm transition-colors">
                <I n="chat" className="text-[16px]" /><span>WhatsApp Directo</span>
              </a>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-margin-desktop py-space-sm flex items-center justify-between gap-gutter-desktop">
          <Marca />
          <div className="flex-1 max-w-xl"><Buscador /></div>
          <Link to="/pedido" className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-xl font-label-md text-label-md transition-colors">
            <I n="receipt_long" className="text-primary-container text-[20px]" /><span>Mi pedido</span>
          </Link>
        </div>
        <div className="bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-margin-desktop">
            <nav aria-label="Categorías" className="flex items-center gap-space-xs py-space-xs overflow-x-auto no-scrollbar">
              {categorias.map((c) => <NavLink key={c.id} to={`/categoria/${c.id}`} className={navCls}>{c.nombre}</NavLink>)}
              <NavLink to="/pedido" className={navCls}>Consultar Pedido</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* ---------- Encabezado móvil ---------- */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(30,41,59,0.05)]">
        <div className="h-7 bg-primary-container text-on-primary px-margin flex items-center justify-between text-label-sm font-label-sm">
          <div className="flex items-center gap-space-xs min-w-0"><I n="location_on" className="text-[14px] text-secondary-container" /><span className="truncate">Cuenca, Ecuador • Retiro en tienda</span></div>
          <div className="flex items-center gap-space-xs text-on-primary-container shrink-0"><I n="schedule" className="text-[14px]" /><span>{horario.replace(/:\s/, ' ')}</span></div>
        </div>
        <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
          <Marca movil />
          <Link to="/pedido" className="relative h-11 px-space-sm rounded-xl bg-surface-container-low text-primary-container hover:bg-surface-variant flex items-center gap-space-xs font-label-md text-label-md transition-colors">
            <I n="inventory_2" className="text-[20px]" /><span className="font-bold">Mi Pedido</span>
          </Link>
        </div>
        <div className="px-margin pb-space-xs"><Buscador movil /></div>
        <nav aria-label="Categorías" className="px-margin pb-2 overflow-x-auto no-scrollbar flex items-center gap-space-xs">
          {categorias.map((c) => <NavLink key={c.id} to={`/categoria/${c.id}`} className={chipCls}>{c.nombre}</NavLink>)}
        </nav>
      </header>

      <main id="contenido" className="flex-1 w-full pt-[178px] lg:pt-36 pb-28 lg:pb-0 bg-surface">
        <Outlet />
      </main>

      {/* ---------- Pie escritorio ---------- */}
      <footer className="hidden lg:block w-full bg-surface-container-lowest mt-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="bg-surface-container-low py-space-sm">
          <div className="max-w-7xl mx-auto px-margin-desktop text-center text-on-surface-variant font-label-sm text-label-sm flex items-center justify-center gap-space-xs">
            <I n="storefront" className="text-[18px] text-primary-container" />
            <span>Catálogo informativo. Ventas y retiro únicamente en tienda física o consulta vía WhatsApp</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-margin-desktop py-space-xl grid grid-cols-1 md:grid-cols-3 gap-space-xl">
          <div className="flex flex-col gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-primary-container">{cfg.nombre || 'ALL DAY Arte – Detalles'}</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Tu papelería, impresiones y bazar creativo de confianza en Cuenca. Acércate a nuestro local o coordina tus encargos de forma directa.</p>
          </div>
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface">Ubicación y Horarios</span>
            <span className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant"><I n="location_on" className="text-[18px]" />{lugar}</span>
            <span className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant"><I n="schedule" className="text-[18px]" />{horario}</span>
            <span className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant"><I n="shopping_bag" className="text-[18px]" />Retiro inmediato en mostrador</span>
          </div>
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface">Atención Personalizada</span>
            {whatsapp && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-space-xs font-body-md text-body-md text-on-surface-variant hover:text-primary-container"><I n="chat" className="text-[18px]" />WhatsApp: +{whatsapp}</a>}
            <p className="font-body-sm text-body-sm text-on-surface-variant">No procesamos pagos en línea. Consulta disponibilidad y reserva sin recargos.</p>
            <div className="flex gap-space-sm">
              {cfg.facebook && <a href={cfg.facebook} target="_blank" rel="noopener noreferrer" className="font-label-md text-label-md text-primary-container hover:underline">Facebook</a>}
              {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noopener noreferrer" className="font-label-md text-label-md text-primary-container hover:underline">Instagram</a>}
              {cfg.tiktok && <a href={cfg.tiktok} target="_blank" rel="noopener noreferrer" className="font-label-md text-label-md text-primary-container hover:underline">TikTok</a>}
            </div>
          </div>
        </div>
        <div className="bg-surface-container py-space-md">
          <div className="max-w-7xl mx-auto px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-md text-body-sm font-body-sm text-on-surface-variant">
            <span>© {new Date().getFullYear()} ALL DAY Arte – Detalles. Todos los derechos reservados.</span>
            <div className="flex items-center gap-space-lg">
              <LinkPrivacidad className="hover:text-on-surface transition-colors font-label-md text-label-md" />
              <Link to="/pedido" className="hover:text-on-surface transition-colors font-label-md text-label-md">Consultar Pedido</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ---------- Pie móvil ---------- */}
      <footer className="lg:hidden mt-space-xl mx-margin mb-28 px-margin pb-space-lg text-center bg-surface-container-low rounded-xl">
        <div className="pt-space-md pb-space-sm">
          <div className="font-headline-sm text-headline-sm text-primary-container font-bold">ALL DAY Arte • Detalles</div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Tu bazar creativo y papelería en Cuenca, Ecuador.</p>
          <div className="flex items-center justify-center gap-space-sm mt-3 text-label-sm font-label-sm text-outline flex-wrap">
            <span className="flex items-center gap-1"><I n="storefront" className="text-[15px] text-tertiary" />{lugar}</span>•<span>{horario}</span>
          </div>
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-center gap-space-md text-label-sm font-label-sm text-outline">
            <LinkPrivacidad className="hover:text-primary transition-colors" />
            <Link to="/pedido" className="hover:text-primary transition-colors">Consultar Pedido</Link>
          </div>
          <p className="mt-3 text-[10px] text-outline font-label-sm">© {new Date().getFullYear()} ALL DAY Arte. Catálogo informativo sin cobro en línea.</p>
        </div>
      </footer>

      {/* ---------- Barra inferior móvil ---------- */}
      <nav aria-label="Navegación principal" className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(30,41,59,0.06)]">
        <div className="h-16 px-space-xs grid grid-cols-4 items-center">
          <NavLink to="/" end className={tabCls}><I n="storefront" className="text-[24px]" /><span className="font-label-sm text-[11px] leading-tight mt-0.5">Inicio</span></NavLink>
          <NavLink to="/catalogo" className={tabCls}><I n="grid_view" className="text-[24px]" /><span className="font-label-sm text-[11px] leading-tight mt-0.5">Categorías</span></NavLink>
          <NavLink to="/pedido" className={tabCls}><I n="receipt_long" className="text-[24px]" /><span className="font-label-sm text-[11px] leading-tight mt-0.5">Mi Pedido</span></NavLink>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-14 rounded-xl text-tertiary transition-all">
            <span className="w-7 h-7 rounded-full bg-[#E6F6F6] flex items-center justify-center text-tertiary"><I n="chat" className="text-[18px]" /></span>
            <span className="font-label-sm text-[11px] font-bold text-tertiary leading-tight mt-0.5">WhatsApp</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
