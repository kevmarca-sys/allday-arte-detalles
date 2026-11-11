import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { useConfig } from '../config.jsx'
import { FORMAS, money, waInternacional } from '../util.js'

/* Código de barras Code 39 (solo dígitos y guiones) dibujado en SVG. */
const C39 = {
  0: 'nnnwwnwnn', 1: 'wnnwnnnnw', 2: 'nnwwnnnnw', 3: 'wnwwnnnnn', 4: 'nnnwwnnnw', 5: 'wnnwwnnnn', 6: 'nnwwwnnnn', 7: 'nnnwnnwnw',
  8: 'wnnwnnwnn', 9: 'nnwwnnwnn', '-': 'nwnnnnwnw', '*': 'nwnnwnwnn',
}
export function Barras({ valor, alto = 40 }) {
  const txt = `*${valor.replace(/[^0-9-]/g, '')}*`
  let x = 0; const barras = []
  for (const ch of txt) {
    C39[ch].split('').forEach((a, i) => { const w = a === 'w' ? 3 : 1; if (i % 2 === 0) barras.push([x, w]); x += w })
    x += 1
  }
  return <svg viewBox={`0 0 ${x} ${alto}`} className="w-full max-w-[210px] mx-auto" style={{ height: alto }} preserveAspectRatio="none" aria-label={`Código ${valor}`}>{barras.map(([bx, w], i) => <rect key={i} x={bx} width={w} height={alto} fill="#111" />)}</svg>
}

function QrWhatsApp({ numero }) {
  const [src, setSrc] = useState('')
  useEffect(() => { if (numero) QRCode.toDataURL(`https://wa.me/${numero}`, { margin: 0, width: 160 }).then(setSrc).catch(() => {}) }, [numero])
  return src ? <div className="flex flex-col items-center gap-1 mt-2"><img src={src} alt="QR de WhatsApp" className="w-20 h-20" /><span className="text-[9px] text-neutral-500">Escanea para escribirnos por WhatsApp</span></div> : null
}

const F = ({ a, b, bold, cls = '' }) => <div className={`flex justify-between gap-2 ${bold ? 'font-bold' : ''} ${cls}`}><span>{a}</span><span className="text-right">{b}</span></div>
const Sep = () => <div className="border-t border-dashed border-neutral-400 my-2" />

/** Comprobante interno de 80 mm (no es factura del SRI). */
export function Ticket({ v, cfg: cfgProp }) {
  const { cfg: cfgCtx } = useConfig()
  const cfg = cfgProp || cfgCtx
  const f = new Date(v.fecha)
  const iva = Number(v.iva || 0), tarifa = cfg.ivaPorcentaje ?? 15
  return (
    <div className="w-full bg-white text-neutral-900 font-mono text-[12px] leading-tight">
      <div className="text-center flex flex-col items-center gap-0.5">
        <img src="/logo-allday.png" alt="" className="w-16 h-auto mb-1" />
        <b className="text-[14px] tracking-wide uppercase">{cfg.nombre || 'ALL DAY Arte – Detalles'}</b>
        <span>Papelería · Bazar · Detalles</span>
        {cfg.direccion && <span>{cfg.direccion}</span>}
        {(cfg.telefono || cfg.whatsapp) && <span>Tel/WhatsApp: {cfg.telefono || `+${waInternacional(cfg.whatsapp)}`}</span>}
        {cfg.ruc && <b>RUC: {cfg.ruc}</b>}
      </div>
      <Sep />
      <div className="text-center font-bold">COMPROBANTE N.º {v.numero}</div>
      {v.anulada && <div className="text-center font-bold border border-neutral-900 my-1 py-0.5">*** ANULADO *** {v.motivoAnulacion}</div>}
      <div className="mt-1.5 flex flex-col gap-0.5">
        <F a="Fecha:" b={`${f.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${f.toLocaleTimeString('es-EC', { hour12: false })}`} />
        <F a="Atendió:" b={v.usuario} />
        <F a="Cliente:" b={<b>{v.clienteNombre}</b>} />
        <F a="C.I. / RUC:" b={v.clienteIdentificacion} />
      </div>
      <Sep />
      <table className="w-full">
        <thead><tr className="text-[10px] text-neutral-600"><th className="text-left font-bold w-8">CANT</th><th className="text-left font-bold">DESCRIPCIÓN</th><th className="text-right font-bold">P.U</th><th className="text-right font-bold">TOTAL</th></tr></thead>
        <tbody>{v.detalles.map((d, k) => (
          <tr key={k} className="align-top"><td>{d.cantidad}</td><td className="pr-1 break-words">{d.producto}</td><td className="text-right">{money(d.precioUnitario)}</td><td className="text-right font-bold">{money(d.subtotal)}</td></tr>
        ))}</tbody>
      </table>
      <Sep />
      <div className="flex flex-col gap-0.5">
        <F a="Subtotal:" b={money(v.subtotal)} />
        {Number(v.descuento) > 0 && <F a="Descuento:" b={`-${money(v.descuento)}`} />}
        <F a={`IVA ${tarifa}% incluido:`} b={money(iva)} />
        <div className="border-t border-neutral-300 my-1" />
        <F a="TOTAL:" b={money(v.total)} bold cls="text-[15px]" />
      </div>
      <Sep />
      <div className="flex flex-col gap-0.5 text-[11px]">
        <F a="Forma de pago:" b={<b>{FORMAS[v.formaPago] || v.formaPago}</b>} />
        {v.montoRecibido != null && <><F a="Efectivo recibido:" b={money(v.montoRecibido)} /><F a="Cambio / Vuelto:" b={money(v.cambio)} bold /></>}
        {v.observacion && <span>Obs.: {v.observacion}</span>}
      </div>
      <Sep />
      <p className="text-center font-sans font-bold text-[12px] my-1">{cfg.pieComprobante || '¡Gracias por su compra!'}</p>
      <Barras valor={v.numero} />
      <div className="text-center text-[9px] text-neutral-500 tracking-widest">*{v.numero.replace(/-/g, '')}*</div>
      {cfg.qrWhatsapp !== false && cfg.whatsapp && <QrWhatsApp numero={waInternacional(cfg.whatsapp)} />}
      <p className="text-center text-[9px] text-neutral-500 mt-2">Documento interno de control emitido por el sistema de caja. No es factura ni comprobante electrónico autorizado por el SRI.</p>
    </div>
  )
}

/** Imprime cualquier contenido (ticket de venta o corte de caja): se monta fuera de la app y es lo único visible al imprimir. */
export function imprimirContenido(el, { a4 = false } = {}) {
  let root = document.getElementById('area-impresion')
  if (!root) { root = document.createElement('div'); root.id = 'area-impresion'; document.body.appendChild(root) }
  window.__imprimir = el
  window.dispatchEvent(new Event('imprimir-ticket'))
  let estilo = null
  if (a4) { estilo = document.createElement('style'); estilo.textContent = '@media print{@page{size:A4;margin:12mm}#area-impresion{width:100%!important}}'; document.head.appendChild(estilo) }
  setTimeout(() => { window.print(); if (estilo) setTimeout(() => estilo.remove(), 500) }, 300)
}
export const imprimir = (v) => imprimirContenido(<Ticket v={v} />)
export function AreaImpresion() {
  const [el, setEl] = useState(null)
  useEffect(() => { const h = () => setEl(window.__imprimir); window.addEventListener('imprimir-ticket', h); return () => window.removeEventListener('imprimir-ticket', h) }, [])
  const root = typeof document !== 'undefined' ? document.getElementById('area-impresion') : null
  return el && root ? createPortal(<div key={Date.now()}>{el}</div>, root) : null
}

/** Texto del comprobante para enviarlo por WhatsApp. */
export function textoWhatsApp(v, cfg) {
  const l = [`*${cfg.nombre || 'ALL DAY Arte – Detalles'}*`, `Comprobante N.º ${v.numero}`, new Date(v.fecha).toLocaleString('es-EC', { hour12: false }), '']
  v.detalles.forEach((d) => l.push(`${d.cantidad} x ${d.producto} — ${money(d.subtotal)}`))
  l.push('')
  if (Number(v.descuento) > 0) l.push(`Descuento: -${money(v.descuento)}`)
  l.push(`*TOTAL: ${money(v.total)}* (${FORMAS[v.formaPago]})`)
  if (v.cambio != null) l.push(`Recibido ${money(v.montoRecibido)} · Cambio ${money(v.cambio)}`)
  l.push('', cfg.pieComprobante || '¡Gracias por su compra!', '_Documento interno, no es factura del SRI._')
  return l.join('\n')
}
