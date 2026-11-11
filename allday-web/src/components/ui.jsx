import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { imgUrl } from '../util.js'

/** Ícono de Material Symbols. */
export const I = ({ n, className = '', fill }) => <span className={`material-symbols-outlined ${fill ? 'fill' : ''} ${className}`} aria-hidden="true">{n}</span>

/** Foto desde la base; si no hay, muestra un ícono sobre fondo suave. */
export function Foto({ id, src, alt = '', icono = 'image', className = '', imgClass = 'w-full h-full object-cover' }) {
  const [error, setError] = useState(false)
  const url = src || imgUrl(id)
  return (
    <div className={`overflow-hidden bg-surface-container-low flex items-center justify-center ${className}`}>
      {url && !error
        ? <img src={url} alt={alt} loading="lazy" className={imgClass} onError={() => setError(true)} />
        : <I n={icono} className="text-[40px] text-primary-container/40" />}
    </div>
  )
}

/** Ventana modal con el estilo del diseño (barra de color superior, ícono y botón cerrar). */
export function Modal({ titulo, subtitulo, icono = 'edit_square', onClose, children, pie, ancho = 'max-w-2xl' }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', h); document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[80] bg-on-surface/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`relative w-full ${ancho} bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden my-6`}>
        <div className="h-1.5 bg-gradient-to-r from-primary via-secondary-container to-tertiary-fixed-dim" />
        <div className="flex items-start gap-space-md px-space-lg pt-space-lg">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-center shrink-0"><I n={icono} className="text-[26px]" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="font-headline-md text-headline-md text-on-surface">{titulo}</h2>
            {subtitulo && <p className="font-body-md text-body-md text-on-surface-variant">{subtitulo}</p>}
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center"><I n="close" /></button>
        </div>
        <div className="px-space-lg py-space-lg">{children}</div>
        {pie && <div className="px-space-lg py-space-md border-t border-surface-container flex items-center justify-end gap-space-sm bg-surface-container-lowest">{pie}</div>}
      </div>
    </div>
  )
}

const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [t, setT] = useState(null)
  const timer = useRef()
  const show = useCallback((msg, tipo = 'ok') => {
    clearTimeout(timer.current); setT({ msg, tipo }); timer.current = setTimeout(() => setT(null), 4200)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <div role="status" className="fixed z-[100] left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 max-w-[92vw] pointer-events-none">
          <div className={`flex items-center gap-space-sm px-space-lg py-3 rounded-xl shadow-xl font-label-lg text-label-lg ${t.tipo === 'error' ? 'bg-error text-on-error' : 'bg-inverse-surface text-inverse-on-surface'}`}>
            <I n={t.tipo === 'error' ? 'error' : 'check_circle'} className={t.tipo === 'error' ? '' : 'text-tertiary-fixed'} />{t.msg}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

/** Interruptor tipo "switch" del diseño. */
export function Toggle({ checked, onChange, color = 'bg-primary-container', label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? color : 'bg-surface-container-high'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

/** Reduce la imagen en el navegador (máx. 1000 px, JPEG) antes de subirla. */
async function reducir(file, max = 1000) {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85))
}
export async function subirImagen(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use una imagen JPG, PNG o WEBP')
  const blob = await reducir(file)
  const fd = new FormData(); fd.append('archivo', blob, 'foto.jpg')
  const { data } = await api.post('/imagenes', fd)
  return data.id
}

/** Zona para arrastrar o elegir una foto (estilo del modal de producto). */
export function ImagenInput({ value, onChange, texto = 'Arrastra una imagen o haz clic para subir' }) {
  const ref = useRef()
  const [subiendo, setSubiendo] = useState(false), [error, setError] = useState(''), [sobre, setSobre] = useState(false)
  async function procesar(f) {
    if (!f) return
    setError(''); setSubiendo(true)
    try { onChange(await subirImagen(f)) } catch (err) { setError(err.response ? errorMsg(err) : err.message) } finally { setSubiendo(false) }
  }
  return (
    <div>
      <div onClick={() => ref.current.click()} onDragOver={(e) => { e.preventDefault(); setSobre(true) }} onDragLeave={() => setSobre(false)}
        onDrop={(e) => { e.preventDefault(); setSobre(false); procesar(e.dataTransfer.files?.[0]) }}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-space-md flex items-center gap-space-md transition-colors ${sobre ? 'border-primary-container bg-primary-fixed/40' : 'border-outline-variant hover:bg-surface-container-low'}`}>
        <div className="w-16 h-16 rounded-xl bg-primary-fixed/60 text-primary-container flex items-center justify-center overflow-hidden shrink-0">
          {value ? <img src={imgUrl(value)} alt="Vista previa" className="w-full h-full object-cover" /> : <I n={subiendo ? 'progress_activity' : 'add_photo_alternate'} className={`text-[30px] ${subiendo ? 'animate-spin' : ''}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-lg text-label-lg text-on-surface">{subiendo ? 'Subiendo…' : value ? 'Foto cargada · clic para cambiar' : texto}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">JPG, PNG o WEBP. Se reduce automáticamente antes de subir.</p>
        </div>
        {value && <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null) }} className="font-label-md text-label-md text-error px-space-sm py-space-xs rounded-lg hover:bg-error-container">Quitar</button>}
      </div>
      {error && <p className="mt-1 font-body-sm text-body-sm text-error">{error}</p>}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { procesar(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}

/** Campo con etiqueta en mayúsculas como en el diseño. */
export function Campo({ label, extra, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-space-xs ${className}`}>
      <span className="flex items-center justify-between gap-2"><span className="etiqueta">{label}</span>{extra}</span>
      {children}
    </label>
  )
}

/** Tarjeta de indicador (KPI) del panel. */
export function Kpi({ titulo, valor, icono, tono = 'primary', children, barra }) {
  const T = {
    primary: 'bg-primary-fixed text-primary-container', tertiary: 'bg-tertiary-fixed/60 text-tertiary', secondary: 'bg-secondary-fixed text-secondary',
    error: 'bg-error-container text-error',
  }[tono]
  const B = { primary: 'bg-primary-container', tertiary: 'bg-tertiary', secondary: 'bg-secondary-container', error: 'bg-error' }[tono]
  return (
    <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{titulo}</span>
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${T}`}><I n={icono} className="text-[22px]" /></span>
      </div>
      <div className="font-display-mobile text-display-mobile text-on-surface tabular">{valor}</div>
      {children}
      {barra !== undefined && <div className="h-1.5 rounded-full bg-surface-container mt-auto"><div className={`h-full rounded-full ${B}`} style={{ width: `${Math.max(0, Math.min(100, barra))}%` }} /></div>}
    </div>
  )
}

/** Estado vacío. */
export function Vacio({ icono = 'inventory_2', titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-space-xl gap-space-sm">
      <div className="w-20 h-20 rounded-full bg-primary-fixed/50 text-primary-container flex items-center justify-center"><I n={icono} className="text-[40px]" /></div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{titulo}</h3>
      {texto && <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{texto}</p>}
      {children}
    </div>
  )
}

export function Cargando() {
  return <div className="flex items-center justify-center p-space-xl text-on-surface-variant gap-2"><I n="progress_activity" className="animate-spin" /> Cargando…</div>
}

/** Ícono oficial de WhatsApp (SVG) para los botones de consulta. */
export const WaIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.2-4.24 9.43-9.45 9.43m8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.7l6.1-1.6a11.33 11.33 0 0 0 5.37 1.37h.01c6.26 0 11.36-5.1 11.37-11.36 0-3.04-1.18-5.89-3.33-8.04" /></svg>
)
