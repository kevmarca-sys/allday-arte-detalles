import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useConfig } from '../config.jsx'
import { Foto, I } from '../components/ui.jsx'
import { iconoCat, linkWhatsApp } from '../util.js'
import ProductoCard from './ProductoCard.jsx'

export const mapsUrl = (dir) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`ALL DAY Arte Detalles ${dir || 'Cuenca, Ecuador'}`)}`

export function SeguimientoBox({ movil }) {
  const nav = useNavigate()
  const [c, setC] = useState('')
  const ir = (e) => { e.preventDefault(); nav(`/pedido${c.trim() ? `?codigo=${encodeURIComponent(c.trim().toUpperCase())}` : ''}`) }
  return (
    <div className={`max-w-4xl mx-auto bg-surface-container-lowest ${movil ? 'p-space-md' : 'p-space-lg md:p-space-xl'} rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-space-lg md:gap-space-xl`}>
      <div className="flex flex-col gap-space-xs text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-space-xs text-primary-container font-label-sm text-label-sm uppercase tracking-wider font-bold"><I n="pin" className="text-[20px]" /><span>Seguimiento de encargos</span></div>
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">¿Tienes un encargo en proceso?</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">Introduce el código de tu comprobante de mostrador (ej.: AD-1001) para saber si ya está listo para retirar.</p>
      </div>
      <form onSubmit={ir} className="w-full md:w-auto flex flex-col sm:flex-row gap-space-xs items-center">
        <input value={c} onChange={(e) => setC(e.target.value)} aria-label="Código del pedido" placeholder="Ej: AD-1001"
          className="w-full sm:w-56 px-space-md py-space-sm bg-surface-container-low rounded-xl text-body-md font-body-md text-on-surface placeholder:text-outline outline-none focus:bg-surface-container transition-all uppercase" />
        <button className="w-full sm:w-auto px-space-lg py-space-sm bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-md text-label-md transition-all shadow-sm flex items-center justify-center gap-space-xs whitespace-nowrap">
          <I n="search" className="text-[18px]" /><span>Consultar</span>
        </button>
      </form>
    </div>
  )
}

const FEATURES = [
  { i: 'palette', c: 'bg-primary-fixed text-primary-container', t: '🎨 Detalles personalizados', m: 'Detalles a medida', s: 'Cajas y regalos', d: 'Diseños a tu medida para cumpleaños, aniversarios y fechas especiales listos para sorprender.' },
  { i: 'storefront', c: 'bg-secondary-fixed text-secondary', t: '🏪 Compra en el local', m: 'Compra en el local', s: 'Retiro en tienda', d: 'Visítanos en Cuenca y elige personalmente tus productos favoritos en un espacio cálido y creativo.' },
  { i: 'manage_search', c: 'bg-tertiary-fixed text-tertiary', t: '🔎 Consulta tu pedido', m: 'Consulta tu pedido', s: 'Con tu código', d: 'Monitorea el estado de tus encargos fotográficos, anillados y regalos con tu código único.', to: '/pedido' },
  { i: 'forum', c: 'bg-primary-fixed text-primary-container', t: '💬 Atención por WhatsApp', m: 'WhatsApp', s: 'Respuesta directa', d: 'Cotizaciones rápidas, asesoría en regalos y respuesta directo sin intermediarios ni demoras.', wa: true },
]

export default function Inicio() {
  const { categorias, whatsapp, horario, cfg } = useConfig()
  const [destacados, setDestacados] = useState(null)
  const [servicios, setServicios] = useState([])
  useEffect(() => {
    api.get('/public/productos', { params: { destacados: true } }).then(async (r) => {
      let l = r.data
      if (l.length < 5) { const t = await api.get('/public/productos'); l = [...l, ...t.data.filter((x) => !l.some((y) => y.id === x.id))] }
      setDestacados(l.filter((x) => !x.esServicio).slice(0, 10)); setServicios(l.filter((x) => x.esServicio))
    }).catch(() => setDestacados([]))
  }, [])
  const wa = (t) => linkWhatsApp(whatsapp, t)
  const catDe = (ic) => categorias.find((c) => c.icono === ic)
  const SERV = [
    { cat: catDe('print'), i: 'print', t: 'Copias e Impresiones', s: 'Blanco y negro, full color, anillados y plastificados.', d: 'Ideal para tesis, monografías, guías escolares y material de estudio. Envía tus documentos en PDF por WhatsApp para que estén listos cuando llegues.', tags: ['Blanco y negro', 'Color', 'Anillados'], k: 'Atención', v: 'En mostrador', b: 'Enviar archivos', bi: 'upload_file', msg: 'Hola ALL DAY, quiero enviar archivos para imprimir.' },
    { cat: catDe('camera'), i: 'photo_camera', t: 'Impresión de Fotos', s: 'Tamaño carnet, polaroid y ampliaciones fotográficas.', d: 'Inmortaliza tus viajes y recuerdos familiares. Envíanos tus fotos y te confirmamos tamaños y tiempo de entrega.', tags: ['Carnet', 'Tipo polaroid', 'Ampliaciones'], k: 'Precio', v: 'Consulta en local', b: 'Cotizar paquete', bi: 'request_quote', msg: 'Hola ALL DAY, quiero cotizar impresión de fotos.' },
    { cat: catDe('gift'), i: 'redeem', t: 'Pedidos Personalizados', s: 'Cajas sorpresa, arreglos y regalos para cumpleaños y aniversarios.', d: 'Cuéntanos tu idea: colores, dedicatorias y fecha. Al dejar tu encargo te damos un código para seguir su avance desde esta web.', tags: ['Cajas sorpresa', 'Arreglos', 'Detalles'], k: 'Coordinación', v: 'Por WhatsApp', b: 'Armar mi detalle', bi: 'auto_awesome', msg: 'Hola ALL DAY, quiero encargar un detalle personalizado.', ter: true },
  ]

  return (
    <div className="flex flex-col w-full">
      {/* Franja informativa */}
      <div className="hidden lg:block w-full bg-primary-fixed text-on-primary-fixed py-space-xs px-margin-desktop">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-space-sm font-label-md text-label-md"><I n="storefront" className="text-[20px] text-primary-container" /><span>Visítanos en Cuenca · Retiro inmediato sin costo en nuestro local comercial</span></div>
          {whatsapp && <div className="flex items-center gap-space-md text-body-sm font-body-sm"><span className="text-on-primary-fixed-variant">¿Dudas con disponibilidad?</span>
            <a href={wa('Hola ALL DAY, quisiera consultar disponibilidad.')} target="_blank" rel="noopener noreferrer" className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-space-xs"><span>Consulta por WhatsApp</span><I n="arrow_forward" className="text-[14px]" /></a></div>}
        </div>
      </div>
      <div className="lg:hidden px-margin pt-space-sm pb-space-xs">
        <Link to="/pedido" className="bg-primary-fixed/60 rounded-xl p-space-sm flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2 min-w-0"><I n="storefront" className="text-primary-container text-[18px] shrink-0" /><span className="font-label-sm text-label-sm text-on-primary-fixed truncate">Retiro en nuestro local de Cuenca · Sin pagos en línea</span></span>
          <I n="arrow_forward" className="text-primary-container text-[16px] shrink-0" />
        </Link>
      </div>

      {/* Hero */}
      <section className="w-full relative overflow-hidden px-margin pt-space-sm pb-space-md lg:py-space-xl lg:px-margin-desktop">
        <div className="hidden lg:grid max-w-7xl mx-auto grid-cols-12 gap-gutter-desktop items-center">
          <div className="col-span-7 flex flex-col z-10">
            <div className="flex flex-wrap items-center gap-space-xs mb-space-md">
              <span className="bg-secondary-container text-on-secondary-container px-space-md py-space-xs rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-space-xs"><I n="school" className="text-[16px]" /><span>Útiles, copias y fotos</span></span>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-space-md py-space-xs rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-space-xs"><I n="favorite" className="text-[16px]" /><span>Detalles hechos con amor en Cuenca</span></span>
            </div>
            <h1 className="font-display text-display text-on-surface tracking-tight mb-space-md">Todo para tus proyectos,<br /><span className="text-primary-container">momentos especiales</span> y el regreso a clases en Cuenca.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-space-lg leading-relaxed">Explora nuestro catálogo en línea, consulta disponibilidad y retira directamente en nuestro local en Cuenca. Sin pagos en línea ni esperas.</p>
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
              <a href="#catalogo-destacado" className="px-space-xl py-space-md bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl shadow-md hover:bg-primary transition-all duration-200 flex items-center gap-space-sm hover:-translate-y-0.5"><I n="menu_book" className="text-[20px]" /><span>Explorar catálogo</span></a>
              {whatsapp && <a href={wa('Hola ALL DAY, quisiera hacer una consulta.')} target="_blank" rel="noopener noreferrer" className="px-space-xl py-space-md bg-tertiary-container text-on-tertiary font-label-lg text-label-lg rounded-xl shadow-md hover:bg-tertiary transition-all duration-200 flex items-center gap-space-sm hover:-translate-y-0.5"><I n="chat" className="text-[20px]" /><span>Consultar por WhatsApp</span></a>}
            </div>
            <div className="mt-space-xl pt-space-md flex items-center gap-space-lg flex-wrap">
              {[['verified', 'Catálogo de tienda física'], ['schedule', 'Atención ' + horario.replace(/^[^:]*:\s*/, '')], ['storefront', 'Retiro en el local']].map(([i, t]) => (
                <div key={t} className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant"><I n={i} className="text-primary-container text-[18px]" /><span>{t}</span></div>
              ))}
            </div>
          </div>
          <div className="col-span-5 relative">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-xl bg-surface-container-high">
              <img src="/img/hero3.jpg" alt="Mostrador con útiles, cuadernos y detalles" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
              <div className="absolute bottom-space-md left-space-md right-space-md p-space-md bg-surface-container-lowest/90 backdrop-blur-md rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div><p className="font-label-sm text-label-sm text-primary-container uppercase tracking-wider">Mostrador artesanal</p><p className="font-headline-sm text-headline-sm text-on-surface">Materiales &amp; Detalles Únicos</p></div>
                  <span className="bg-secondary-container text-on-secondary-container px-space-sm py-space-xs rounded-full font-label-sm text-label-sm font-bold">100% Cuencano</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Hero móvil */}
        <div className="lg:hidden relative overflow-hidden rounded-xl bg-surface-container-low shadow-sm p-space-md flex flex-col gap-space-md">
          <div className="flex flex-col gap-1 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px] w-fit font-bold uppercase tracking-wide"><I n="palette" className="text-[12px]" />Bazar Creativo y Papelería</span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface leading-tight mt-1">Todo para tus proyectos, momentos especiales y el regreso a clases</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Catálogo de nuestra tienda en Cuenca, Ecuador. Elige lo que te gusta y retíralo en el local.</p>
          </div>
          <div className="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container shadow-inner">
            <img src="/img/hero3.jpg" alt="Mostrador con útiles y detalles" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent flex items-end p-space-sm">
              <span className="font-label-sm text-label-sm text-on-primary flex items-center gap-1"><I n="verified" className="text-[14px] text-secondary-fixed" />Retiro en tienda · Sin pagos en línea</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm z-10">
            <a href="#catalogo-destacado" className="h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center gap-1 font-label-md text-label-md shadow-sm active:scale-95 transition-transform"><I n="menu_book" className="text-[18px]" /><span>Ver catálogo</span></a>
            <a href={wa('Hola ALL DAY, quisiera hacer una consulta.')} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl bg-tertiary-container text-on-primary flex items-center justify-center gap-1 font-label-md text-label-md shadow-sm active:scale-95 transition-transform"><I n="chat" className="text-[18px]" /><span>WhatsApp</span></a>
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <section className="w-full px-margin pb-space-lg lg:py-space-lg lg:px-margin-desktop">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-space-sm lg:gap-gutter-desktop">
          {FEATURES.map((f) => {
            const cont = (<>
              <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 lg:mb-space-xs ${f.c}`}><I n={f.i} className="text-[18px] lg:text-[28px]" /></div>
              <div className="min-w-0">
                <h3 className="hidden lg:block font-headline-sm text-headline-sm text-on-surface">{f.t}</h3>
                <p className="hidden lg:block font-body-md text-body-md text-on-surface-variant mt-space-xs">{f.d}</p>
                <p className="lg:hidden font-label-sm text-label-sm text-on-surface font-bold leading-tight">{f.m}</p>
                <p className="lg:hidden font-body-sm text-[11px] text-on-surface-variant leading-tight mt-0.5">{f.s}</p>
              </div>
            </>)
            const cls = 'p-space-sm lg:p-space-lg rounded-xl bg-surface-container-lowest lg:bg-surface-container-low shadow-sm flex flex-row lg:flex-col items-start gap-space-xs hover:bg-surface-container transition-all'
            return f.to ? <Link key={f.t} to={f.to} className={cls}>{cont}</Link>
              : f.wa ? <a key={f.t} href={wa('Hola ALL DAY, quisiera una cotización.')} target="_blank" rel="noopener noreferrer" className={cls}>{cont}</a>
                : <div key={f.t} className={cls}>{cont}</div>
          })}
        </div>
      </section>

      {/* Categorías */}
      <section className="w-full pb-space-lg lg:py-space-xl lg:px-margin-desktop">
        <div className="max-w-7xl mx-auto">
          <div className="hidden lg:flex flex-row items-end justify-between mb-space-lg gap-space-sm">
            <div><span className="font-label-sm text-label-sm text-primary-container uppercase tracking-wider">Exploración Rápida</span><h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xs">Categorías de la Tienda</h2></div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Descubre nuestra selección de artículos físicos ordenados para que encuentres justo lo que necesitas.</p>
          </div>
          <div className="lg:hidden px-margin flex items-center justify-between mb-space-sm">
            <div><h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Explora por Categoría</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Encuentra tu material favorito</p></div>
            <Link to="/catalogo" className="font-label-sm text-label-sm text-primary-container font-bold flex items-center">Ver todas<I n="chevron_right" className="text-[16px]" /></Link>
          </div>
          <div className="hidden lg:grid grid-cols-4 xl:grid-cols-7 gap-space-md">
            {categorias.map((c) => (
              <Link key={c.id} to={`/categoria/${c.id}`} className="group flex flex-col rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200">
                <Foto id={c.imagenId} alt={c.nombre} icono={iconoCat(c.icono)} className="w-full aspect-square bg-surface-container" imgClass="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="p-space-sm text-center"><span className="font-label-md text-label-md text-on-surface group-hover:text-primary-container transition-colors">{c.nombre}</span></div>
              </Link>
            ))}
          </div>
          <div className="lg:hidden px-margin overflow-x-auto flex gap-space-md pb-2 no-scrollbar">
            {categorias.map((c) => (
              <Link key={c.id} to={`/categoria/${c.id}`} className="flex flex-col items-center gap-1.5 shrink-0 w-20 text-center group">
                <span className="w-16 h-16 rounded-full bg-surface-container-low p-1 shadow-sm flex items-center justify-center group-active:scale-95 transition-transform overflow-hidden">
                  <Foto id={c.imagenId} alt="" icono={iconoCat(c.icono)} className="w-full h-full rounded-full" imgClass="w-full h-full rounded-full object-cover" />
                </span>
                <span className="font-label-sm text-[11px] text-on-surface font-bold leading-tight line-clamp-2">{c.nombre}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section id="catalogo-destacado" className="w-full px-margin pb-space-lg lg:py-space-xl lg:px-margin-desktop lg:bg-surface-container-low scroll-mt-48">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-row items-center justify-between pb-space-sm lg:pb-space-lg gap-space-sm">
            <div>
              <div className="hidden lg:flex items-center gap-space-xs text-primary-container mb-space-xs font-label-sm text-label-sm uppercase tracking-wider"><I n="grade" className="text-[18px]" /><span>Lo más buscado</span></div>
              <h2 className="flex items-center gap-1.5 font-headline-sm text-headline-sm font-bold lg:font-headline-lg lg:text-headline-lg text-on-surface"><I n="star" fill className="lg:hidden text-secondary-container text-[20px]" />Productos destacados</h2>
            </div>
            <div className="hidden lg:flex bg-surface-container-lowest px-space-md py-space-xs rounded-full shadow-sm items-center gap-space-xs text-on-surface-variant font-label-md text-label-md"><I n="info" className="text-secondary text-[18px]" /><span>Precios referenciales para retiro en tienda física</span></div>
            <span className="lg:hidden font-label-sm text-[11px] text-on-surface-variant">Catálogo local</span>
          </div>
          {destacados === null ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm lg:gap-space-md">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-72 rounded-xl bg-surface-container-lowest animate-pulse" />)}</div>
            : destacados.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center text-center p-space-xl gap-space-sm">
                <div className="w-20 h-20 rounded-full bg-primary-fixed/50 text-primary-container flex items-center justify-center"><I n="inventory_2" className="text-[40px]" /></div>
                <span className="bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm px-space-sm py-space-xs rounded-full uppercase tracking-wider">Catálogo en actualización</span>
                <h3 className="font-headline-md text-headline-md text-on-surface max-w-lg">Pronto publicaremos nuestros productos</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">Estamos cargando el inventario del local. Si necesitas algo específico, escríbenos y te confirmamos disponibilidad.</p>
                {whatsapp && <a href={wa('Hola ALL DAY, quisiera consultar si tienen un producto.')} target="_blank" rel="noopener noreferrer" className="btn-wa px-space-lg py-space-sm font-label-lg text-label-lg"><I n="chat" /><span>Preguntar por WhatsApp</span></a>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm lg:gap-space-md">{destacados.map((p) => <ProductoCard key={p.id} p={p} />)}</div>
            )}
        </div>
      </section>

      {/* Servicios */}
      <section className="w-full px-margin pb-space-lg lg:py-space-xl lg:px-margin-desktop">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-md lg:gap-space-lg">
          <div>
            <span className="hidden lg:block font-label-sm text-label-sm text-primary-container uppercase tracking-wider">Atención de Taller &amp; Mostrador</span>
            <h2 className="font-headline-sm text-headline-sm font-bold lg:font-headline-lg lg:text-headline-lg text-on-surface lg:mt-space-xs">Servicios en Tienda Física</h2>
            <p className="font-body-sm text-body-sm lg:font-body-md lg:text-body-md text-on-surface-variant mt-space-xs max-w-2xl">Realizamos trabajos en nuestro establecimiento. Envía tus archivos digitales o acércate en persona para asesorarte con nuestro equipo.</p>
          </div>
          <div className="flex flex-col gap-space-sm lg:gap-space-md">
            {SERV.map((s) => (
              <div key={s.t} className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-sm hover:shadow-md transition-all grid grid-cols-1 lg:grid-cols-12 gap-space-md lg:gap-space-lg items-center">
                <Foto id={s.cat?.imagenId} alt={s.t} icono={s.i} className="hidden lg:flex lg:col-span-4 aspect-[16/10] rounded-lg bg-surface-container" />
                <div className="lg:col-span-5 flex flex-col">
                  <div className="flex items-center gap-space-xs text-primary-container font-headline-sm text-headline-sm"><I n={s.i} className="text-[26px]" /><h3>{s.t}</h3></div>
                  <p className="font-body-md text-body-md lg:font-body-lg lg:text-body-lg text-on-surface font-semibold mt-space-xs">{s.s}</p>
                  <p className="hidden lg:block font-body-md text-body-md text-on-surface-variant mt-space-xs leading-relaxed">{s.d}</p>
                  <div className="flex flex-wrap gap-space-xs mt-space-sm lg:mt-space-md">{s.tags.map((t) => <span key={t} className="bg-surface-container-low px-space-sm py-0.5 rounded-full font-label-sm text-label-sm text-on-surface-variant">{t}</span>)}</div>
                </div>
                <div className="lg:col-span-3 flex flex-col justify-center items-stretch lg:items-end">
                  <div className="p-space-md bg-surface-container-low rounded-xl w-full text-left lg:text-right flex lg:block items-center justify-between gap-space-sm">
                    <div><span className="font-label-sm text-label-sm text-on-surface-variant block">{s.k}</span><span className="font-headline-sm text-headline-sm text-primary-container font-bold">{s.v}</span></div>
                    {whatsapp && <a href={wa(s.msg)} target="_blank" rel="noopener noreferrer" className={`lg:mt-space-sm lg:w-full py-space-xs px-space-sm rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-space-xs transition-colors text-on-primary ${s.ter ? 'bg-tertiary-container hover:bg-tertiary' : 'bg-primary-container hover:bg-primary'}`}><I n={s.bi} className="text-[16px]" /><span>{s.b}</span></a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seguimiento */}
      <section className="w-full px-margin pb-space-lg lg:py-space-xl lg:px-margin-desktop lg:bg-surface-container-low"><SeguimientoBox /></section>

      {/* Te esperamos */}
      <section className="w-full px-margin lg:py-space-xl lg:px-margin-desktop">
        <div className="max-w-7xl mx-auto rounded-xl bg-primary text-on-primary p-space-lg lg:p-space-xl relative overflow-hidden shadow-xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
            <div className="lg:col-span-8 flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider">Atención de Confianza en Cuenca</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile lg:font-headline-lg lg:text-headline-lg text-on-primary">Te esperamos con las puertas abiertas en nuestro local</h2>
              <p className="font-body-md text-body-md lg:font-body-lg lg:text-body-lg text-primary-fixed-dim max-w-2xl mt-space-xs">Sin costos sorpresa ni carrito de compras. Si ves algo que te guste, consúltalo por WhatsApp y retíralo directamente en nuestro horario de atención.</p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-space-sm justify-center lg:items-end">
              <a href={mapsUrl(cfg.direccion)} target="_blank" rel="noopener noreferrer" className="px-space-xl py-space-md bg-secondary-container text-on-secondary-container rounded-xl font-label-lg text-label-lg shadow-md hover:bg-secondary-fixed transition-all flex items-center justify-center gap-space-xs"><I n="near_me" className="text-[20px]" /><span>¿Cómo llegar al local?</span></a>
              <div className="flex items-center gap-space-xs text-primary-fixed font-label-sm text-label-sm self-center lg:self-end"><I n="schedule" className="text-[16px]" /><span>{horario}</span></div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-container/40 blur-3xl pointer-events-none" />
        </div>
      </section>
    </div>
  )
}
