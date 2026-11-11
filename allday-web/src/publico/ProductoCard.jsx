import { Link } from 'react-router-dom'
import { useConfig } from '../config.jsx'
import { Foto, I } from '../components/ui.jsx'
import { DISPONIBILIDAD, iconoCat, linkWhatsApp, money } from '../util.js'

export const mensajeProducto = (p) => `Hola ALL DAY 👋, me interesa: ${p.nombre}${p.codigo ? ` (código ${p.codigo})` : ''} – ${money(p.precio)}. ¿Está disponible para retirar en el local?`

/** Tarjeta de producto del catálogo (diseño Stitch). En móvil se compacta a 2 columnas. */
export default function ProductoCard({ p, detallada }) {
  const { whatsapp } = useConfig()
  const d = DISPONIBILIDAD[p.disponibilidad] || DISPONIBILIDAD.DISPONIBLE
  const agotado = p.disponibilidad === 'AGOTADO'
  return (
    <article className="bg-surface-container-lowest rounded-xl lg:rounded-2xl p-space-sm sm:p-space-md flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative">
      <Link to={`/producto/${p.id}`} className="flex flex-col gap-1 sm:gap-space-sm">
        <div className="relative w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-surface-container-low">
          <Foto id={p.imagenId} alt={p.nombre} icono={iconoCat(p.icono)} className={`w-full h-full ${agotado ? 'grayscale opacity-70' : ''}`} imgClass="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <span className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-label-sm text-[10px] sm:text-label-sm shadow-sm ${d.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${d.dot} ${p.disponibilidad === 'DISPONIBLE' ? 'animate-pulse' : ''}`} />
            <span className="sm:hidden">{d.corto}</span><span className="hidden sm:inline">{d.t}</span>
          </span>
          {p.codigo && <span className="hidden sm:block absolute bottom-2 right-2 bg-surface-container-lowest/90 px-2 py-0.5 rounded-md text-[10px] font-mono text-outline">#{p.codigo}</span>}
        </div>
        <div className="flex flex-col">
          <span className="text-outline font-label-sm text-[10px] sm:text-label-sm uppercase tracking-wider">{p.categoria}</span>
          <h3 className="font-headline-sm text-[13px] leading-tight sm:text-headline-sm text-on-surface line-clamp-2 group-hover:text-primary-container transition-colors">{p.nombre}</h3>
          {detallada && p.descripcion && <p className="hidden sm:block font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">{p.descripcion}</p>}
        </div>
      </Link>
      <div className="flex flex-col gap-2 sm:gap-space-sm mt-2 sm:mt-space-md pt-space-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-outline font-label-sm text-[10px] sm:text-label-sm">{p.esServicio ? 'Desde' : <><span className="sm:hidden">PVP</span><span className="hidden sm:inline">Precio referencial</span></>}</span>
          <span className="font-headline-sm text-headline-sm sm:font-headline-md sm:text-headline-md text-primary-container sm:text-on-surface font-extrabold tabular">{money(p.precio)}</span>
        </div>
        {whatsapp && (
          <a href={linkWhatsApp(whatsapp, mensajeProducto(p))} target="_blank" rel="noopener noreferrer"
            className="w-full h-9 sm:h-auto btn-wa sm:py-space-sm font-label-sm text-[11px] sm:text-label-md">
            <I n="chat" className="text-[15px] sm:text-[18px]" /><span className="sm:hidden">WhatsApp</span><span className="hidden sm:inline">Consultar por WhatsApp</span>
          </a>
        )}
      </div>
    </article>
  )
}
