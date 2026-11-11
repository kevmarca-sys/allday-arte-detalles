import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useConfig } from '../config.jsx'
import { Foto, I, WaIcon } from '../components/ui.jsx'
import { DISPONIBILIDAD, iconoCat, linkWhatsApp, money } from '../util.js'
import ProductoCard, { mensajeProducto } from './ProductoCard.jsx'
import { mapsUrl } from './Inicio.jsx'

export default function Producto() {
  const { id } = useParams()
  const { whatsapp, cfg } = useConfig()
  const [p, setP] = useState(null), [error, setError] = useState(false)
  const [rel, setRel] = useState([])
  const [foto, setFoto] = useState(0)
  useEffect(() => {
    setP(null); setError(false); setFoto(0)
    api.get(`/public/productos/${id}`).then((r) => {
      setP(r.data)
      api.get('/public/productos', { params: { categoriaId: r.data.categoriaId } })
        .then((x) => setRel(x.data.filter((o) => o.id !== r.data.id && o.disponibilidad !== 'AGOTADO').slice(0, 4))).catch(() => {})
    }).catch(() => setError(true))
  }, [id])

  if (error) return (
    <div className="max-w-xl mx-auto text-center p-space-xl flex flex-col items-center gap-space-sm">
      <I n="search_off" className="text-[56px] text-primary-container" />
      <h1 className="font-headline-md text-headline-md">Este producto ya no está en el catálogo</h1>
      <p className="text-on-surface-variant">Puede que se haya agotado o retirado. Revisa otros artículos o pregúntanos por WhatsApp.</p>
      <Link to="/catalogo" className="btn-pri mt-space-sm"><I n="grid_view" />Ver catálogo</Link>
    </div>
  )
  if (!p) return <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop py-space-lg grid lg:grid-cols-12 gap-gutter-desktop"><div className="lg:col-span-7 aspect-[4/3] rounded-xl bg-surface-container-low animate-pulse" /><div className="lg:col-span-5 h-96 rounded-xl bg-surface-container-low animate-pulse" /></div>

  const fotos = [p.imagenId, ...(p.galeria || [])].filter(Boolean)
  const d = DISPONIBILIDAD[p.disponibilidad] || DISPONIBILIDAD.DISPONIBLE
  const wa = linkWhatsApp(whatsapp, mensajeProducto(p))
  const textoDisp = { DISPONIBLE: 'Disponible en el local', ULTIMAS: 'Últimas unidades en el local', AGOTADO: 'Agotado por ahora · consulta reposición', SERVICIO: 'Servicio que realizamos en el local' }[p.disponibilidad]

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-7xl mx-auto px-margin lg:px-margin-desktop pt-space-sm lg:py-space-md">
        <div className="hidden lg:flex w-full bg-primary-fixed/60 rounded-xl px-space-md py-space-sm items-center justify-between shadow-sm mb-space-lg">
          <div className="flex items-center gap-space-sm"><I n="store" className="text-primary text-[20px]" /><p className="font-label-md text-label-md text-on-primary-fixed">Visítanos en Cuenca – Catálogo digital para consulta y retiro en el local</p></div>
          <div className="flex items-center gap-space-xs text-primary font-label-sm text-label-sm"><I n="verified" className="text-[16px]" /><span>Atención 100% Cuencana</span></div>
        </div>
        <nav aria-label="Ruta" className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm lg:font-label-md lg:text-label-md mb-space-md lg:mb-space-lg min-w-0">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-space-xs shrink-0"><I n="home" className="text-[16px]" /><span>Inicio</span></Link>
          <I n="chevron_right" className="text-[14px] text-outline" />
          <Link to={`/categoria/${p.categoriaId}`} className="hover:text-primary transition-colors shrink-0">{p.categoria}</Link>
          <I n="chevron_right" className="text-[14px] text-outline" />
          <span className="text-on-surface font-bold truncate">{p.nombre}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md lg:gap-gutter-desktop items-start">
          <div className="lg:col-span-7 flex flex-col gap-space-sm lg:gap-space-md">
            <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-surface-container shadow-md group">
              <Foto id={fotos[foto]} alt={p.nombre} icono={iconoCat(p.icono)} className="w-full h-full" imgClass="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-space-sm left-space-sm lg:top-space-md lg:left-space-md flex flex-col gap-space-xs">
                <span className="bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-space-xs rounded-full font-label-sm text-label-sm text-primary shadow-sm flex items-center gap-space-xs"><I n={iconoCat(p.icono)} className="text-[16px]" />{p.categoria}</span>
                {p.destacado && <span className="bg-secondary-fixed text-on-secondary-fixed px-space-md py-space-xs rounded-full font-label-sm text-label-sm shadow-sm flex items-center gap-space-xs w-fit"><I n="star" className="text-[16px]" />Destacado</span>}
              </div>
              {fotos.length > 1 && <div className="absolute bottom-space-md right-space-md bg-surface-container-lowest/80 backdrop-blur-md text-on-surface px-space-sm py-space-xs rounded-lg font-label-sm text-label-sm shadow-sm flex items-center gap-space-xs"><I n="photo_library" className="text-[16px]" />{foto + 1} / {fotos.length}</div>}
            </div>
            {fotos.length > 1 && (
              <div className="grid grid-cols-4 gap-space-sm">
                {fotos.map((f, i) => (
                  <button key={f} type="button" onClick={() => setFoto(i)} aria-label={`Ver foto ${i + 1}`} className={`relative aspect-square rounded-xl overflow-hidden bg-surface-container-low shadow-sm transition-all ${i === foto ? 'ring-2 ring-primary-container' : 'opacity-80 hover:opacity-100'}`}>
                    <Foto id={f} alt="" className="w-full h-full" />
                    <span className={`absolute bottom-1 left-1 text-[10px] font-label-sm px-space-xs py-0.5 rounded shadow ${i === foto ? 'bg-surface-container-lowest text-primary' : 'bg-surface-container-lowest/90 text-on-surface'}`}>{i + 1}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="hidden lg:grid bg-surface-container-lowest rounded-xl p-space-lg shadow-sm grid-cols-3 gap-space-md mt-space-sm">
              {[['storefront', 'bg-primary-fixed text-primary', 'Retiro en el local', 'Lo apartamos y lo retiras en nuestro mostrador de Cuenca.'],
                ['chat', 'bg-tertiary-fixed text-tertiary', 'Consulta directa', 'Te respondemos por WhatsApp con disponibilidad y detalles.'],
                ['payments', 'bg-secondary-fixed text-secondary', 'Pago en tienda', 'Efectivo, transferencia o tarjeta al momento de retirar.']].map(([i, c, t, s]) => (
                <div key={t} className="flex items-start gap-space-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c}`}><I n={i} className="text-[20px]" /></div>
                  <div><h4 className="font-headline-sm text-body-md text-on-surface">{t}</h4><p className="font-body-sm text-body-sm text-on-surface-variant">{s}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-40">
            <div className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-xl shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/categoria/${p.categoriaId}`} className="bg-surface-container text-primary-container font-label-sm text-label-sm uppercase tracking-wider px-space-sm py-space-xs rounded-full hover:bg-primary-fixed transition-colors">{p.categoria}</Link>
                {p.codigo && <span className="font-label-md text-label-md text-outline bg-surface-container-low px-space-sm py-space-xs rounded-lg">Ref: <span className="text-on-surface font-bold">{p.codigo}</span></span>}
              </div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile lg:font-headline-lg lg:text-headline-lg text-on-surface leading-snug">{p.nombre}</h1>
              <div className="flex items-center">
                <div className={`inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full font-label-md text-label-md ${d.chip}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${d.dot} ${p.disponibilidad === 'DISPONIBLE' ? 'animate-pulse' : ''}`} /><span>{textoDisp}</span>
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-xs">
                <div className="flex items-baseline gap-space-sm flex-wrap">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{p.esServicio ? 'Precio desde:' : 'Precio referencial:'}</span>
                  <span className="font-display-mobile text-display-mobile lg:font-display lg:text-display text-primary leading-none tabular">{money(p.precio)}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">* Precio referencial de venta en el local. Confirma disponibilidad y valor final por WhatsApp antes de acercarte.</p>
              </div>
              {p.descripcion && (
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-lg text-label-lg text-on-surface">Detalle del producto:</span>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">{p.descripcion}</p>
                </div>
              )}
              {whatsapp && (
                <div className="flex flex-col gap-space-xs mt-space-sm">
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="w-full bg-whatsapp hover:bg-whatsapp-dark text-white py-space-md px-space-lg rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm shadow-lg transition-transform hover:-translate-y-0.5"><WaIcon /><span>Consultar por WhatsApp con este producto</span></a>
                  <p className="font-body-sm text-body-sm text-center text-on-surface-variant">Te abriremos un chat con el {p.codigo ? 'código del' : ''} producto para confirmar disponibilidad y coordinar el retiro.</p>
                </div>
              )}
              <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-sm mt-space-xs">
                <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs"><I n="info" className="text-[18px] text-primary" />Condiciones de Compra y Atención Local</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
                  {[['storefront', 'Retiro exclusivo en nuestro local en Cuenca'], ['schedule', 'Atención: ' + (cfg.horario || 'Lun - Sáb')], ['payments', 'Pago en tienda (efectivo, transferencia o tarjeta)'], ['local_shipping', 'Sin envíos a domicilio ni cobros en línea']].map(([i, t]) => (
                    <div key={t} className="flex items-start gap-space-xs"><I n={i} className="text-[18px] text-primary shrink-0 mt-0.5" /><span className="font-body-sm text-body-sm text-on-surface">{t}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl p-space-md lg:p-space-xl shadow-sm my-space-lg lg:my-space-xl">
          <div className="flex flex-col gap-space-xs mb-space-lg text-center max-w-2xl mx-auto">
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Paso a Paso</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">¿Cómo comprar en ALL DAY?</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Un proceso cercano, claro y sin pagos por internet.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
            {[['Consulta por WhatsApp', `Toca el botón verde: se abre WhatsApp con el código ${p.codigo || 'del producto'} ya escrito. Solo agrega la cantidad.`], ['Confirmamos disponibilidad', 'Te respondemos con el stock del local y, si es un detalle, coordinamos el diseño.'], ['Lo dejamos listo', 'Apartamos tu producto o preparamos tu encargo en el taller.'], ['Retiro y pago en local', 'Pasa por nuestro local en Cuenca, revisa tu compra y paga en caja.']].map(([t, s], i) => (
              <div key={t} className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-xs">
                <div className={`w-8 h-8 rounded-full font-headline-sm text-label-md flex items-center justify-center mb-space-xs ${['bg-primary text-on-primary', 'bg-primary-container text-on-primary', 'bg-tertiary text-on-tertiary', 'bg-secondary text-on-secondary'][i]}`}>{i + 1}</div>
                <h3 className="font-headline-sm text-body-md text-on-surface">{t}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {rel.length > 0 && (
          <section className="flex flex-col gap-space-md lg:gap-space-lg mb-space-lg lg:mb-space-xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Combina tu compra</span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile lg:font-headline-lg lg:text-headline-lg text-on-surface">También en {p.categoria}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Otros artículos que puedes retirar junto con tu pedido en tienda.</p>
              </div>
              <Link to={`/categoria/${p.categoriaId}`} className="inline-flex items-center gap-space-xs text-primary font-label-lg text-label-lg hover:underline"><span>Ver toda la categoría</span><I n="arrow_forward" className="text-[18px]" /></Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm lg:gap-gutter-desktop">{rel.map((r) => <ProductoCard key={r.id} p={r} detallada />)}</div>
          </section>
        )}

        <div className="w-full bg-surface-container rounded-xl p-space-md lg:p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md mb-space-lg lg:mb-space-xl">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0"><I n="pin_drop" className="text-[24px]" /></div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface">¿Prefieres verlo en persona?</span>
              <span className="font-body-md text-body-md text-on-surface-variant">Ven directamente a nuestro local en Cuenca y te asesoramos en el mostrador.</span>
            </div>
          </div>
          <a href={mapsUrl(cfg.direccion)} target="_blank" rel="noopener noreferrer" className="bg-surface-container-lowest hover:bg-surface-container-high text-on-surface px-space-md py-space-sm rounded-xl font-label-md text-label-md transition-colors flex items-center gap-space-xs shadow-sm shrink-0"><I n="near_me" className="text-[18px]" /><span>Cómo llegar al local</span></a>
        </div>
      </div>
    </div>
  )
}
