import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { useConfig } from '../config.jsx'
import { I } from '../components/ui.jsx'
import { iconoCat, linkWhatsApp, money } from '../util.js'
import ProductoCard from './ProductoCard.jsx'

/** Títulos y textos de cada línea del negocio (según la entrevista). */
const TEXTOS = {
  note: ['Útiles Escolares y Papelería Creativa', 'Materiales para estudiantes de escuela, colegio y universidad. Consulta y reserva tu pedido para retiro en tienda.'],
  print: ['Copias e Impresiones', 'Copias, impresiones a color y en blanco y negro, anillados y plastificados en nuestro mostrador.'],
  camera: ['Fotos e Impresión Fotográfica', 'Fotos tamaño carnet, revelado e impresiones para tus recuerdos y trámites.'],
  gift: ['Detalles y Regalos', 'Cajas sorpresa, arreglos y detalles para cumpleaños, aniversarios y fechas especiales.'],
  lips: ['Cosméticos', 'Productos de belleza y cuidado personal disponibles en nuestro local.'],
  balloon: ['Artículos para Fiestas', 'Globos, velas y decoración para celebrar cumpleaños y eventos.'],
  basket: ['Bazar', 'Artículos de bazar y accesorios para el hogar, la oficina y el día a día.'],
  toy: ['Juguetes y Juegos', 'Juegos de mesa, juguetes y pelotas para regalar y compartir en familia.'],
  ring: ['Accesorios', 'Billeteras, bisutería y relojes para complementar tu estilo o sorprender a alguien.'],
  book: ['Libros Infantiles', 'Cuentos y libros didácticos para los más pequeños de la casa.'],
}
const ORDEN = { destacados: 'Destacados', menor: 'Precio: menor a mayor', mayor: 'Precio: mayor a menor', nombre: 'Nombre A–Z' }

export default function Catalogo() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const { categorias, whatsapp } = useConfig()
  const [todos, setTodos] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [orden, setOrden] = useState('destacados')
  const [disp, setDisp] = useState({ DISPONIBLE: true, ULTIMAS: true, SERVICIO: true, AGOTADO: false })
  const [maxPrecio, setMaxPrecio] = useState(null)
  useEffect(() => { api.get('/public/productos').then((r) => setTodos(r.data)).catch(() => setTodos([])) }, [])
  useEffect(() => { setFiltro(''); setMaxPrecio(null) }, [id, q])

  const cat = categorias.find((c) => String(c.id) === id)
  const [titulo, texto] = cat ? (TEXTOS[cat.icono] || [cat.nombre, 'Productos disponibles en nuestro local de Cuenca.']) : q ? [`Resultados para “${q}”`, 'Productos del catálogo que coinciden con tu búsqueda.'] : ['Catálogo de la Tienda', 'Todo lo que encuentras en nuestro local de Cuenca. Consulta disponibilidad y retira en tienda.']
  const conteo = (cid) => (todos || []).filter((p) => p.categoriaId === cid).length

  const base = useMemo(() => (todos || []).filter((p) => (!cat || p.categoriaId === cat.id) &&
    (!q || `${p.nombre} ${p.codigo || ''} ${p.categoria}`.toLowerCase().includes(q.toLowerCase()))), [todos, cat, q])
  const tope = Math.max(1, ...base.map((p) => Number(p.precio)))
  const lista = useMemo(() => {
    const f = filtro.trim().toLowerCase()
    const l = base.filter((p) => disp[p.disponibilidad] && (!f || `${p.nombre} ${p.codigo || ''} ${p.descripcion || ''}`.toLowerCase().includes(f)) &&
      (maxPrecio === null || Number(p.precio) <= maxPrecio))
    const s = { destacados: (a, b) => b.destacado - a.destacado || a.nombre.localeCompare(b.nombre), menor: (a, b) => a.precio - b.precio, mayor: (a, b) => b.precio - a.precio, nombre: (a, b) => a.nombre.localeCompare(b.nombre) }[orden]
    return [...l].sort(s)
  }, [base, filtro, disp, maxPrecio, orden])
  const n = (k) => base.filter((p) => p.disponibilidad === k).length
  const verAgotados = disp.AGOTADO && !disp.DISPONIBLE

  const lista_escolar = cat?.icono === 'note'
  const promo = lista_escolar
    ? { t: '¿Tienes tu lista escolar?', d: 'Evita filas y búsquedas. Tráela a nuestro local en Cuenca o envíanos una foto legible por WhatsApp para cotizártela.', b: 'Cotizar mi lista escolar', m: 'Hola ALL DAY, quiero cotizar mi lista escolar. Te envío la foto.', i: 'checklist' }
    : { t: '¿Buscas algo especial?', d: 'Si no encuentras lo que necesitas, escríbenos. Te confirmamos disponibilidad en el local y lo dejamos listo para retirar.', b: 'Preguntar por WhatsApp', m: 'Hola ALL DAY, estoy buscando un producto.', i: 'support_agent' }

  return (
    <div className="flex flex-col w-full">
      <section className="hidden lg:block w-full bg-primary-fixed/40 px-margin-desktop py-space-sm shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm text-on-primary-fixed"><I n="storefront" className="text-[20px] text-primary-container" /><span className="font-label-md text-label-md">Mostrador Cuenca: Retiro presencial · Sin pagos ni cargos en línea</span></div>
          <div className="flex items-center gap-space-lg text-primary-container font-label-sm text-label-sm">
            <span className="flex items-center gap-space-xs"><I n="verified" className="text-[16px]" />Precios referenciales del local</span>
            <span className="flex items-center gap-space-xs"><I n="chat" className="text-[16px]" />Consultas por WhatsApp</span>
          </div>
        </div>
      </section>
      <div className="lg:hidden px-margin pt-space-sm pb-space-xs">
        <div className="bg-primary-fixed text-on-primary-fixed px-space-md py-space-xs rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-space-xs"><I n="storefront" className="text-[18px] text-primary" /><span className="font-label-sm text-label-sm">Retiro en local • Cuenca</span></div>
          <span className="font-label-sm text-[10px] bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold">Sin recargos</span>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto lg:px-margin-desktop pt-space-xs lg:py-space-xl">
        {/* Encabezado */}
        <div className="flex flex-col gap-space-xs lg:gap-space-md px-margin lg:px-0 mb-space-sm lg:mb-space-xl">
          <nav aria-label="Ruta" className="flex items-center gap-1.5 lg:gap-space-xs text-on-surface-variant font-label-sm text-label-sm lg:font-label-md lg:text-label-md py-space-xs lg:py-0">
            <Link to="/" className="hover:text-primary-container transition-colors flex items-center gap-1"><I n="home" className="lg:hidden text-[14px]" />Inicio</Link>
            <I n="chevron_right" className="text-[14px] text-outline" />
            {cat || q ? <Link to="/catalogo" className="hover:text-primary-container transition-colors">Catálogo</Link> : <span className="text-primary-container font-bold">Catálogo</span>}
            {(cat || q) && <><I n="chevron_right" className="text-[14px] text-outline" /><span className="text-primary-container font-bold lg:font-label-lg lg:text-label-lg truncate">{cat ? cat.nombre : 'Búsqueda'}</span></>}
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm lg:gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm flex-wrap">
                {cat && <span className="bg-secondary-container text-on-secondary-container px-2.5 lg:px-space-sm py-0.5 lg:py-space-xs rounded-full font-label-sm text-[10px] lg:text-label-sm tracking-wide uppercase flex items-center gap-1"><I n={iconoCat(cat.icono)} className="text-[14px]" />{cat.nombre}</span>}
                <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-tertiary-container inline-block" />Inventario sincronizado con el local</span>
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary lg:font-display lg:text-display lg:text-on-surface tracking-tight">{titulo}</h1>
              <p className="font-body-sm text-body-sm lg:font-body-md lg:text-body-md text-on-surface-variant max-w-2xl">{texto}</p>
            </div>
            <div className="hidden md:flex items-center gap-space-md shrink-0">
              <div className="bg-surface-container-low px-space-md py-space-sm rounded-xl text-on-surface-variant font-label-md text-label-md">Mostrando <span className="font-label-lg text-label-lg text-primary-container">{lista.length}</span> artículos en tienda</div>
              <label className="bg-surface-container-lowest rounded-xl shadow-sm flex items-center px-space-md py-space-sm gap-space-xs font-label-md text-label-md">
                <span className="text-on-surface-variant">Ordenar por:</span>
                <select value={orden} onChange={(e) => setOrden(e.target.value)} className="bg-transparent border-none outline-none font-label-lg text-label-lg text-primary-container cursor-pointer pr-space-xs">
                  {Object.entries(ORDEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Chips de categorías (móvil) */}
        <div className="lg:hidden pb-space-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-space-xs px-margin">
            {categorias.map((c) => {
              const act = cat?.id === c.id
              return (
                <Link key={c.id} to={`/categoria/${c.id}`} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label-sm text-label-sm transition-all ${act ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'}`}>
                  <I n={iconoCat(c.icono)} className={`text-[15px] ${act ? '' : 'text-tertiary'}`} /><span>{c.nombre}</span>
                  <span className={`px-1.5 rounded-full text-[10px] ${act ? 'bg-surface/20 text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>{conteo(c.id)}</span>
                </Link>
              )
            })}
          </div>
        </div>
        <div className="lg:hidden py-space-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-space-xs px-margin">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider shrink-0 pr-1">Filtros:</span>
            {[['DISPONIBLE', 'En stock local', 'bg-tertiary'], ['ULTIMAS', 'Últimas unidades', 'bg-secondary'], ['AGOTADO', 'Agotados', 'bg-outline']].map(([k, t, dot]) => (
              <button key={k} type="button" onClick={() => setDisp({ ...disp, [k]: !disp[k] })}
                className={`shrink-0 px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 shadow-sm ${disp[k] ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-lowest text-on-surface'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} /><span>{t}</span>{disp[k] && <I n="check" className="text-[14px]" />}
              </button>
            ))}
          </div>
        </div>
        <section className="lg:hidden px-margin py-space-xs flex items-center justify-between bg-surface-container-low mx-margin rounded-xl">
          <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm"><I n="view_stream" className="text-[16px] text-primary" /><span>Mostrando <strong className="text-on-surface font-bold">{lista.length}</strong> artículos</span></div>
          <label className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-lg shadow-sm">
            <span className="font-label-sm text-[10px] text-outline">Ordenar:</span>
            <select value={orden} onChange={(e) => setOrden(e.target.value)} className="bg-transparent font-label-sm text-label-sm text-on-surface focus:outline-none cursor-pointer">
              {Object.entries(ORDEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </section>

        <div className="flex flex-col lg:flex-row gap-space-md lg:gap-space-xl items-start">
          {/* Barra lateral (escritorio) */}
          <aside className="hidden lg:flex w-[280px] shrink-0 flex-col gap-space-lg">
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md text-on-surface">Búsqueda rápida</span>
              <div className="relative flex items-center bg-surface-container-low rounded-xl px-space-md py-space-xs focus-within:ring-2 focus-within:ring-primary-container">
                <I n="tune" className="text-[18px] text-outline mr-space-xs" />
                <input value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar en esta lista" placeholder="Filtrar dentro de la lista..." className="w-full bg-transparent border-none outline-none font-body-sm text-body-sm text-on-surface placeholder:text-outline py-1" />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between pb-space-xs"><span className="font-label-lg text-label-lg text-on-surface">Categorías</span><I n="category" className="text-[18px] text-outline" /></div>
              <div className="flex flex-col gap-space-xs">
                {categorias.map((c) => {
                  const act = cat?.id === c.id
                  return (
                    <Link key={c.id} to={`/categoria/${c.id}`} className={`flex items-center justify-between px-space-sm py-space-xs rounded-lg font-label-md text-label-md transition-colors ${act ? 'bg-primary-fixed text-primary' : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}>
                      <span className="flex items-center gap-space-xs"><I n={iconoCat(c.icono)} className="text-[16px]" />{c.nombre}</span>
                      <span className={act ? 'bg-primary-container text-on-primary px-space-xs rounded-full font-label-sm text-label-sm' : 'text-outline font-label-sm text-label-sm'}>{conteo(c.id)}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-on-surface">Disponibilidad en Tienda</span>
              {[['DISPONIBLE', 'Disponible', 'bg-tertiary-fixed text-on-tertiary-fixed'], ['ULTIMAS', 'Últimas unidades', 'bg-secondary-fixed text-on-secondary-fixed'], ['SERVICIO', 'Servicios', 'bg-primary-fixed text-primary'], ['AGOTADO', 'Agotado', 'bg-surface-container text-on-surface-variant']].map(([k, t, c]) => (
                <label key={k} className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-space-sm font-body-md text-body-md text-on-surface"><input type="checkbox" checked={disp[k]} onChange={(e) => setDisp({ ...disp, [k]: e.target.checked })} className="w-4 h-4 accent-primary-container" />{t}</span>
                  <span className={`px-1.5 rounded-full font-label-sm text-label-sm ${c}`}>{n(k)}</span>
                </label>
              ))}
            </div>
            {base.length > 0 && (
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center justify-between"><span className="font-label-lg text-label-lg text-on-surface">Rango de Precio</span><span className="font-label-md text-label-md text-primary-container">hasta {money(maxPrecio ?? tope)}</span></div>
                <input type="range" min={0} max={Math.ceil(tope)} step={0.5} value={maxPrecio ?? Math.ceil(tope)} onChange={(e) => setMaxPrecio(Number(e.target.value))} className="w-full accent-primary-container" aria-label="Precio máximo" />
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant"><span>$0</span><span>{money(Math.ceil(tope))}</span></div>
              </div>
            )}
            {whatsapp && (
              <div className="bg-gradient-to-br from-primary-container to-primary text-on-primary p-space-md rounded-2xl shadow-md flex flex-col gap-space-sm relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary-container/20 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-space-xs"><I n={promo.i} className="text-[24px] text-secondary-container" /><span className="font-headline-sm text-headline-sm leading-tight text-white">{promo.t}</span></div>
                <p className="font-body-sm text-body-sm text-on-primary-container">{promo.d}</p>
                <a href={linkWhatsApp(whatsapp, promo.m)} target="_blank" rel="noopener noreferrer" className="mt-space-xs inline-flex items-center justify-center gap-space-xs bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-label-md text-label-md py-space-sm px-space-md rounded-xl transition-all shadow-sm"><I n="send" className="text-[18px]" /><span>{promo.b}</span></a>
              </div>
            )}
          </aside>

          {/* Resultados */}
          <section className="flex-1 w-full flex flex-col gap-space-md lg:gap-space-lg px-margin lg:px-0">
            <div className="hidden lg:flex items-center justify-between flex-wrap gap-space-sm">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mr-space-xs">Filtros activos:</span>
                {cat && <span className="bg-surface-container-high text-on-surface px-space-sm py-space-xs rounded-full font-label-sm text-label-sm flex items-center gap-space-xs">{cat.nombre}<Link to="/catalogo" aria-label="Quitar categoría" className="hover:text-error"><I n="close" className="text-[14px]" /></Link></span>}
                {q && <span className="bg-surface-container-high text-on-surface px-space-sm py-space-xs rounded-full font-label-sm text-label-sm flex items-center gap-space-xs">“{q}”<button type="button" aria-label="Quitar búsqueda" onClick={() => setSp({})} className="hover:text-error"><I n="close" className="text-[14px]" /></button></span>}
                {!disp.AGOTADO && <span className="bg-surface-container-high text-on-surface px-space-sm py-space-xs rounded-full font-label-sm text-label-sm flex items-center gap-space-xs">En stock local<button type="button" aria-label="Incluir agotados" onClick={() => setDisp({ ...disp, AGOTADO: true })} className="hover:text-error"><I n="close" className="text-[14px]" /></button></span>}
                {maxPrecio !== null && <span className="bg-surface-container-high text-on-surface px-space-sm py-space-xs rounded-full font-label-sm text-label-sm flex items-center gap-space-xs">Hasta {money(maxPrecio)}<button type="button" aria-label="Quitar precio" onClick={() => setMaxPrecio(null)} className="hover:text-error"><I n="close" className="text-[14px]" /></button></span>}
                <button type="button" onClick={() => { setFiltro(''); setMaxPrecio(null); setDisp({ DISPONIBLE: true, ULTIMAS: true, SERVICIO: true, AGOTADO: false }) }} className="text-primary-container hover:underline font-label-sm text-label-sm ml-space-xs">Limpiar todo</button>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-xl">
                <button type="button" onClick={() => setDisp({ DISPONIBLE: true, ULTIMAS: true, SERVICIO: true, AGOTADO: false })} className={`px-space-sm py-space-xs rounded-lg font-label-sm text-label-sm flex items-center gap-space-xs ${!verAgotados ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}><I n="grid_view" className="text-[16px]" />Productos en Tienda</button>
                <button type="button" onClick={() => setDisp({ DISPONIBLE: false, ULTIMAS: false, SERVICIO: false, AGOTADO: true })} className={`px-space-sm py-space-xs rounded-lg font-label-sm text-label-sm flex items-center gap-space-xs ${verAgotados ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}><I n="inventory_2" className="text-[16px]" />Ver Agotados</button>
              </div>
            </div>

            {whatsapp && (
              <div className="lg:hidden bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-xl p-space-md shadow-md relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-secondary-container/20 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs"><span className="bg-secondary-container text-on-secondary-container p-1 rounded-lg"><I n={promo.i} className="text-[20px]" /></span><span className="font-label-sm text-[11px] uppercase tracking-wider font-extrabold text-secondary-fixed">Atención directa</span></div>
                  <h2 className="font-headline-sm text-headline-sm text-on-primary">{promo.t}</h2>
                  <p className="font-body-sm text-body-sm text-on-primary-container">{promo.d}</p>
                  <a href={linkWhatsApp(whatsapp, promo.m)} target="_blank" rel="noopener noreferrer" className="mt-space-xs inline-flex w-full items-center justify-center gap-space-xs py-2.5 px-space-md rounded-xl bg-secondary-container text-on-secondary-container font-label-lg text-label-lg shadow-sm"><I n={lista_escolar ? 'photo_camera' : 'chat'} className="text-[18px]" /><span>{promo.b}</span></a>
                </div>
              </div>
            )}

            {todos === null ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-space-sm lg:gap-space-md">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-72 rounded-2xl bg-surface-container-lowest animate-pulse" />)}</div>
            ) : lista.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-space-lg lg:p-space-xl bg-surface-container-lowest rounded-2xl shadow-sm text-center">
                <div className="w-24 h-24 mb-space-md rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary-container"><I n={cat ? iconoCat(cat.icono) : 'inventory_2'} className="text-[48px]" /></div>
                <span className="bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm px-space-sm py-space-xs rounded-full uppercase tracking-wider mb-space-xs">{base.length ? 'Sin coincidencias' : 'Inventario en actualización'}</span>
                <h2 className="font-headline-md text-headline-md text-on-surface max-w-lg mb-space-xs">{base.length ? 'No hay productos con esos filtros' : 'Pronto publicaremos los productos de esta categoría'}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mb-space-lg">{base.length ? 'Prueba quitando algún filtro o incluyendo los agotados.' : 'Estamos actualizando el stock del local de Cuenca. Si necesitas algo específico, escríbenos y te confirmamos disponibilidad.'}</p>
                <div className="flex items-center justify-center gap-space-md flex-wrap">
                  {whatsapp && <a href={linkWhatsApp(whatsapp, `Hola ALL DAY, quisiera consultar por ${cat ? cat.nombre.toLowerCase() : 'un producto'}.`)} target="_blank" rel="noopener noreferrer" className="btn-wa font-label-lg text-label-lg px-space-lg py-space-sm"><I n="chat" className="text-[20px]" /><span>Preguntar por WhatsApp</span></a>}
                  <Link to="/catalogo" onClick={() => setDisp({ DISPONIBLE: true, ULTIMAS: true, SERVICIO: true, AGOTADO: true })} className="btn-sec"><I n="category" className="text-[20px]" /><span>Ver otras categorías</span></Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-space-sm lg:gap-space-md">{lista.map((p) => <ProductoCard key={p.id} p={p} detallada />)}</div>
            )}

            <div className="bg-surface-container-low p-space-md lg:p-space-lg rounded-2xl flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">¿Cómo comprar en ALL DAY?</h2>
                <span className="flex items-center gap-1 text-tertiary font-label-md text-label-md bg-tertiary-fixed/30 px-space-md py-space-xs rounded-full"><I n="verified" className="text-[16px]" />Sin tarjeta ni registro</span>
              </div>
              <ol className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                {[
                  ['touch_app', 'Elige tu artículo', 'Abre el producto que te interesa.'],
                  ['chat', 'Escríbenos por WhatsApp', 'Toca el botón verde: el código ya va escrito.'],
                  ['storefront', 'Retira y paga', 'Te lo apartamos en nuestro local de Cuenca.'],
                ].map(([ic, t, d], k) => (
                  <li key={t} className="bg-surface-container-lowest rounded-xl p-space-md flex items-start gap-space-sm shadow-sm">
                    <span className="relative w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                      <I n={ic} className="text-[24px]" />
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center">{k + 1}</span>
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg text-on-surface">{t}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{d}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
