export const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const hoyISO = () => isoDe(new Date())
export const isoDe = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10) }
export const sumarDias = (n, base = new Date()) => { const d = new Date(base); d.setDate(d.getDate() + n); return isoDe(d) }
export const parseFecha = (iso) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d) }
export const fechaCorta = (iso) => parseFecha(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
export const fechaLarga = (d = new Date()) => { const s = d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1) }
export const fechaNum = (iso) => new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const horaTxt = (iso) => new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false })
export const fechaHora = (iso) => `${fechaNum(iso)} · ${horaTxt(iso)}`
export const difDias = (iso) => { const h = new Date(); h.setHours(0, 0, 0, 0); return Math.round((parseFecha(iso) - h) / 864e5) }
/** "Hoy", "Mañana", "Ayer" o "12 nov" */
export const diaRelativo = (iso) => { const d = difDias(iso); return d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : d === -1 ? 'Ayer' : fechaCorta(iso) }
export const diaRelativoHora = (iso) => `${diaRelativo(isoDe(iso))} · ${horaTxt(iso)}`
export const iniciales = (n = '') => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/** Íconos Material Symbols por categoría (el campo "icono" de la base guarda la clave corta). */
const ICONOS = {
  note: 'edit_note', print: 'print', camera: 'photo_camera', gift: 'featured_seasonal_and_gifts', lips: 'face',
  balloon: 'celebration', basket: 'shopping_bag', mug: 'coffee', pen: 'draw', box: 'inventory_2',
  toy: 'toys', ring: 'diamond', book: 'menu_book',
}
export const iconoCat = (k) => ICONOS[k] || k || 'category'
export const OPCIONES_ICONO = Object.entries(ICONOS)

export const ESTADOS = [
  { k: 'RECIBIDO', t: 'Recibido', dot: 'bg-secondary-container', chip: 'bg-secondary-fixed text-on-secondary-fixed' },
  { k: 'EN_PREPARACION', t: 'En preparación', dot: 'bg-primary-container', chip: 'bg-primary-fixed text-primary' },
  { k: 'LISTO', t: 'Listo para retirar', dot: 'bg-tertiary', chip: 'bg-tertiary-fixed text-on-tertiary-fixed' },
  { k: 'ENTREGADO', t: 'Entregado', dot: 'bg-outline', chip: 'bg-surface-container text-on-surface-variant' },
]
export const estado = (k) => ESTADOS.find((e) => e.k === k) || { k, t: 'Anulado', dot: 'bg-error', chip: 'bg-error-container text-on-error-container' }
export const SIGUIENTE = { RECIBIDO: 'EN_PREPARACION', EN_PREPARACION: 'LISTO', LISTO: 'ENTREGADO' }
export const TIPOS_PEDIDO = ['Detalle o arreglo', 'Impresión de fotos', 'Impresión de documentos', 'Decoración para fiesta', 'Otro']

export const FORMAS = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta', OTRO: 'Otro' }

export const DISPONIBILIDAD = {
  DISPONIBLE: { t: 'Disponible', corto: 'Disp.', chip: 'bg-tertiary-fixed text-on-tertiary-fixed', dot: 'bg-tertiary' },
  ULTIMAS: { t: 'Últimas unidades', corto: 'Últimas', chip: 'bg-secondary-fixed text-on-secondary-fixed', dot: 'bg-secondary' },
  AGOTADO: { t: 'Agotado', corto: 'Agotado', chip: 'bg-surface-container-high text-on-surface-variant', dot: 'bg-outline' },
  SERVICIO: { t: 'Servicio en local', corto: 'Servicio', chip: 'bg-primary-fixed text-primary', dot: 'bg-primary-container' },
}

/** Número de WhatsApp en formato internacional: 0984115728 → 593984115728 (Ecuador). */
export const waInternacional = (n) => {
  const d = String(n || '').replace(/\D/g, '')
  if (d.length === 10 && d.startsWith('0')) return '593' + d.slice(1)
  if (d.length === 9 && d.startsWith('9')) return '593' + d
  return d
}
export const linkWhatsApp = (numero, texto) => `https://wa.me/${waInternacional(numero)}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`
export const telInternacional = (tel) => { const t = String(tel || '').replace(/\D/g, ''); return t.startsWith('0') ? '593' + t.slice(1) : t }
export const telBonito = (tel) => { const t = telInternacional(tel); return t.startsWith('593') ? `+593 ${t.slice(3, 5)} ${t.slice(5, 8)} ${t.slice(8)}` : tel }
export const imgUrl = (id) => (id ? `${import.meta.env.VITE_API_URL || ''}/api/public/imagenes/${id}` : null)
export const pct = (v) => (v === null || v === undefined ? null : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`)

/** Descarga un CSV que Excel abre directamente (separador ; y BOM para tildes). */
export function exportarCSV(nombre, filas) {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const csv = '﻿' + filas.map((f) => f.map(esc).join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = nombre; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
