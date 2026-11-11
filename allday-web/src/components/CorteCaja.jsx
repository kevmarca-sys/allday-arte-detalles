import { useEffect, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useConfig } from '../config.jsx'
import { FORMAS, hoyISO, money } from '../util.js'
import { Cargando, I, Modal } from './ui.jsx'
import { imprimirContenido } from './Ticket.jsx'

export function calcularCorte(ventas) {
  const val = ventas.filter((v) => !v.anulada), anu = ventas.filter((v) => v.anulada)
  const por = Object.fromEntries(Object.keys(FORMAS).map((k) => [k, val.filter((v) => v.formaPago === k).reduce((s, v) => s + Number(v.total), 0)]))
  const total = val.reduce((s, v) => s + Number(v.total), 0)
  return {
    total, n: val.length, por, ticket: val.length ? total / val.length : 0,
    descuentos: val.reduce((s, v) => s + Number(v.descuento || 0), 0),
    iva: val.reduce((s, v) => s + Number(v.iva || 0), 0),
    anuladas: anu.length, montoAnulado: anu.reduce((s, v) => s + Number(v.total), 0),
    desde: ventas.length ? ventas.at(-1).fecha : null, hasta: ventas.length ? ventas[0].fecha : null,
  }
}

function CorteTicket({ c, fecha, usuario, cfg, contado }) {
  const R = ({ a, b, bold }) => <div className={`flex justify-between ${bold ? 'font-bold text-[14px]' : ''}`}><span>{a}</span><span>{b}</span></div>
  return (
    <div className="bg-white text-neutral-900 font-mono text-[12px] leading-snug">
      <div className="text-center"><b className="uppercase">{cfg.nombre || 'ALL DAY Arte – Detalles'}</b><div>CORTE DE CAJA</div><div>{new Date(fecha + 'T12:00').toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div><div>Impreso: {new Date().toLocaleString('es-EC', { hour12: false })} · {usuario}</div></div>
      <div className="border-t border-dashed border-neutral-400 my-2" />
      {Object.entries(FORMAS).map(([k, t]) => <R key={k} a={t} b={money(c.por[k])} />)}
      <div className="border-t border-dashed border-neutral-400 my-2" />
      <R a="Ventas válidas" b={c.n} /><R a="Descuentos" b={`-${money(c.descuentos)}`} /><R a="IVA incluido" b={money(c.iva)} /><R a={`Anuladas (${c.anuladas})`} b={money(c.montoAnulado)} />
      <R a="TOTAL VENDIDO" b={money(c.total)} bold />
      {contado !== '' && <><div className="border-t border-dashed border-neutral-400 my-2" /><R a="Efectivo esperado" b={money(c.por.EFECTIVO)} /><R a="Efectivo contado" b={money(contado)} /><R a="Diferencia" b={money(Number(contado) - c.por.EFECTIVO)} bold /></>}
      <div className="mt-8 text-center">______________________<br />Firma responsable</div>
    </div>
  )
}

/** Corte de caja del día: totales por forma de pago, anulaciones y cuadre del efectivo. */
export default function CorteCaja({ onClose }) {
  const { user } = useAuth()
  const { cfg } = useConfig()
  const [fecha, setFecha] = useState(hoyISO())
  const [c, setC] = useState(null), [error, setError] = useState('')
  const [contado, setContado] = useState('')
  useEffect(() => {
    setC(null); setError('')
    api.get('/ventas', { params: { desde: fecha, hasta: fecha } }).then((r) => setC(calcularCorte(r.data))).catch((e) => setError(errorMsg(e)))
  }, [fecha])
  const dif = contado === '' || !c ? null : Number(contado) - c.por.EFECTIVO
  return (
    <Modal titulo="Corte de Caja" subtitulo="Resumen del día por forma de pago y cuadre del efectivo" icono="point_of_sale" onClose={onClose}
      pie={<><button className="btn-sec" onClick={onClose}>Cerrar</button><button className="btn-pri" disabled={!c} onClick={() => imprimirContenido(<CorteTicket c={c} fecha={fecha} usuario={user?.nombre} cfg={cfg} contado={contado} />)}><I n="print" />Imprimir corte (80 mm)</button></>}>
      <div className="flex items-center gap-space-sm mb-space-md">
        <label className="etiqueta">Fecha</label>
        <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} className="campo w-auto py-2" />
      </div>
      {error ? <p className="text-error">{error}</p> : !c ? <Cargando /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          <div className="flex flex-col gap-space-sm">
            {Object.entries(FORMAS).map(([k, t]) => (
              <div key={k} className="flex items-center justify-between bg-surface-container-low rounded-xl px-space-md py-space-sm">
                <span className="flex items-center gap-space-sm font-label-lg text-label-lg"><I n={{ EFECTIVO: 'payments', TRANSFERENCIA: 'account_balance', TARJETA: 'credit_card', OTRO: 'more_horiz' }[k]} className="text-primary-container" />{t}</span>
                <span className="font-headline-sm text-headline-sm tabular">{money(c.por[k])}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-primary-container text-on-primary rounded-xl px-space-md py-space-md">
              <span className="font-label-lg text-label-lg uppercase">Total vendido</span><span className="font-headline-md text-headline-md tabular">{money(c.total)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-space-sm">
            <div className="grid grid-cols-2 gap-space-sm">
              {[['Ventas válidas', c.n], ['Ticket promedio', money(c.ticket)], ['Descuentos', money(c.descuentos)], [`Anuladas (${c.anuladas})`, money(c.montoAnulado)]].map(([t, v]) => (
                <div key={t} className="bg-surface-container-low rounded-xl p-space-sm"><span className="etiqueta block">{t}</span><span className="font-headline-sm text-headline-sm tabular">{v}</span></div>
              ))}
            </div>
            <div className="bg-tertiary-fixed/30 rounded-xl p-space-md flex flex-col gap-space-sm">
              <span className="font-label-lg text-label-lg text-tertiary flex items-center gap-space-xs"><I n="savings" />Cuadre de efectivo</span>
              <div className="flex justify-between font-body-md text-body-md"><span>Efectivo esperado en caja</span><b className="tabular">{money(c.por.EFECTIVO)}</b></div>
              <label className="flex items-center justify-between gap-space-sm font-body-md text-body-md">Efectivo contado
                <input type="number" min="0" step="0.01" value={contado} onChange={(e) => setContado(e.target.value)} placeholder="0.00" className="campo w-32 py-2 text-right tabular" />
              </label>
              {dif !== null && <div className={`flex justify-between font-label-lg text-label-lg ${Math.abs(dif) < 0.005 ? 'text-tertiary' : dif > 0 ? 'text-secondary' : 'text-error'}`}><span>{Math.abs(dif) < 0.005 ? 'Caja cuadrada ✓' : dif > 0 ? 'Sobrante' : 'Faltante'}</span><span className="tabular">{money(Math.abs(dif))}</span></div>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
