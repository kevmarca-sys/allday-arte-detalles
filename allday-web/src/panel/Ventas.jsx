import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useConfig } from '../config.jsx'
import { Cargando, I, Modal, useToast } from '../components/ui.jsx'
import { calcularCorte } from '../components/CorteCaja.jsx'
import { imprimir, imprimirContenido, textoWhatsApp, Ticket } from '../components/Ticket.jsx'
import { exportarCSV, fechaNum, FORMAS, horaTxt, hoyISO, iniciales, money, sumarDias } from '../util.js'
import { usePanel } from './AdminLayout.jsx'

const FCHIP = { EFECTIVO: 'bg-tertiary-fixed/50 text-on-tertiary-fixed', TRANSFERENCIA: 'bg-primary-fixed text-primary', TARJETA: 'bg-secondary-fixed text-on-secondary-fixed', OTRO: 'bg-surface-container text-on-surface' }
const POR_PAG = 10

export default function Ventas() {
  const { esAdmin } = useAuth()
  const { cfg } = useConfig()
  const { abrirCorte } = usePanel()
  const toast = useToast()
  const [sp] = useSearchParams()
  const [rango, setRango] = useState({ desde: hoyISO(), hasta: hoyISO(), k: 'hoy' })
  const [ventas, setVentas] = useState(null), [previas, setPrevias] = useState(null)
  const [q, setQ] = useState(sp.get('q') || ''), [forma, setForma] = useState(''), [est, setEst] = useState('VALIDAS')
  const [pag, setPag] = useState(1)
  const [sel, setSel] = useState(null)
  const [anular, setAnular] = useState(null), [motivo, setMotivo] = useState('')

  const cargar = () => {
    setVentas(null)
    api.get('/ventas', { params: { desde: rango.desde, hasta: rango.hasta } }).then((r) => setVentas(r.data)).catch((e) => { toast(errorMsg(e), 'error'); setVentas([]) })
    const dias = Math.round((new Date(rango.hasta) - new Date(rango.desde)) / 864e5) + 1
    api.get('/ventas', { params: { desde: sumarDias(-dias, rango.desde + 'T12:00'), hasta: sumarDias(-1, rango.desde + 'T12:00') } }).then((r) => setPrevias(r.data)).catch(() => setPrevias(null))
  }
  useEffect(cargar, [rango]) // eslint-disable-line
  useEffect(() => { setPag(1) }, [q, forma, est, rango])
  useEffect(() => { if (sp.get('q')) setRango({ desde: sumarDias(-30), hasta: hoyISO(), k: 'mes' }) }, []) // eslint-disable-line

  const fijar = (k) => {
    const h = new Date()
    if (k === 'hoy') setRango({ desde: hoyISO(), hasta: hoyISO(), k })
    if (k === 'semana') { const d = (h.getDay() + 6) % 7; setRango({ desde: sumarDias(-d), hasta: hoyISO(), k }) }
    if (k === 'mes') setRango({ desde: hoyISO().slice(0, 8) + '01', hasta: hoyISO(), k })
  }
  const lista = useMemo(() => (ventas || []).filter((v) => {
    const t = q.trim().toLowerCase()
    return (!t || v.numero.includes(t) || v.numero.replace(/-/g, '').includes(t.replace(/-/g, '')) || v.clienteNombre.toLowerCase().includes(t) || v.clienteIdentificacion.includes(t)) &&
      (!forma || v.formaPago === forma) && (est === 'TODAS' || (est === 'ANULADAS') === v.anulada)
  }), [ventas, q, forma, est])
  if (!ventas) return <Cargando />
  const c = calcularCorte(ventas)
  const cAnt = previas ? calcularCorte(previas) : null
  const varTotal = cAnt && cAnt.total > 0 ? ((c.total - cAnt.total) / cAnt.total) * 100 : null
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAG))
  const visibles = lista.slice((pag - 1) * POR_PAG, pag * POR_PAG)
  const sumaVisible = visibles.filter((v) => !v.anulada).reduce((s, v) => s + Number(v.total), 0)
  const pctF = (k) => (c.total ? (c.por[k] / c.total) * 100 : 0)

  async function confirmarAnular() {
    try { const { data } = await api.post(`/ventas/${anular.id}/anular`, { motivo }); toast(`Venta ${data.numero} anulada; el stock fue devuelto`); setAnular(null); setMotivo(''); setSel(data); cargar() }
    catch (e) { toast(errorMsg(e), 'error') }
  }
  const exportar = () => exportarCSV(`ventas-${rango.desde}_${rango.hasta}.csv`, [
    ['N.º comprobante', 'Fecha', 'Hora', 'Cliente', 'CI/RUC', 'Forma de pago', 'Subtotal', 'Descuento', 'IVA incluido', 'Total', 'Estado', 'Atendido por', 'Motivo anulación'],
    ...lista.map((v) => [v.numero, fechaNum(v.fecha), horaTxt(v.fecha), v.clienteNombre, v.clienteIdentificacion, FORMAS[v.formaPago], v.subtotal, v.descuento, v.iva, v.total, v.anulada ? 'Anulada' : 'Válida', v.usuario, v.motivoAnulacion || '']),
  ])
  const prueba = () => imprimirContenido(<div className="font-mono text-[12px] text-center"><b>{cfg.nombre || 'ALL DAY'}</b><div className="border-t border-dashed border-neutral-400 my-2" />PRUEBA DE IMPRESIÓN 80 mm<br />{new Date().toLocaleString('es-EC', { hour12: false })}<div className="border-t border-dashed border-neutral-400 my-2" />Si este texto se ve completo y centrado,<br />la impresora está bien configurada.</div>)

  return (
    <div className="px-margin-desktop py-space-lg space-y-space-lg max-w-[1600px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <span className="w-16 h-16 rounded-2xl bg-surface-container-lowest shadow-md flex items-center justify-center shrink-0"><img src="/logo-mark.png" alt="" className="w-10 h-10 object-contain" /></span>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Registro Histórico de Ventas y Comprobantes</h1>
            <div className="flex items-center gap-space-sm flex-wrap mt-1"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Caja del local</span><span className="font-body-md text-body-md text-on-surface-variant">Comprobantes internos (no son facturas del SRI)</span></div>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <button type="button" onClick={abrirCorte} className="whitespace-nowrap flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-lowest shadow-sm font-label-md text-label-md hover:bg-surface-container-high"><I n="schedule" className="text-[18px]" />Corte de caja</button>
          <button type="button" onClick={exportar} disabled={!lista.length} className="whitespace-nowrap flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-tertiary-container text-on-tertiary font-label-md text-label-md shadow-sm hover:bg-tertiary disabled:opacity-50"><I n="table_view" className="text-[18px]" />Exportar a Excel<I n="download" className="text-[16px]" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm"><div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary-fixed/50" />
          <div className="relative flex items-center justify-between"><span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Total vendido</span><span className="w-10 h-10 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-center"><I n="payments" /></span></div>
          <div className="relative mt-space-md font-display-mobile text-display-mobile tabular">{money(c.total)}</div>
          <div className="relative mt-1 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">{varTotal !== null && <span className={`font-bold flex items-center ${varTotal >= 0 ? 'text-tertiary' : 'text-error'}`}><I n={varTotal >= 0 ? 'trending_up' : 'trending_down'} className="text-[16px]" />{varTotal >= 0 ? '+' : ''}{varTotal.toFixed(1)}%</span>}· {c.n} transacciones</div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-center justify-between"><span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Por forma de pago</span><span className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center"><I n="donut_large" /></span></div>
          <div className="mt-space-md flex items-center justify-between font-label-md text-label-md"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary" />Efectivo</span><span className="tabular">{money(c.por.EFECTIVO)} <span className="text-outline">({pctF('EFECTIVO').toFixed(0)}%)</span></span></div>
          <div className="mt-2 h-1.5 rounded-full bg-surface-container flex overflow-hidden"><div className="bg-tertiary" style={{ width: `${pctF('EFECTIVO')}%` }} /><div className="bg-primary-container" style={{ width: `${pctF('TRANSFERENCIA')}%` }} /><div className="bg-secondary-container" style={{ width: `${pctF('TARJETA')}%` }} /></div>
          <div className="mt-2 flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-container" />Transf.: {money(c.por.TRANSFERENCIA)}</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-container" />Tarjeta: {money(c.por.TARJETA)}</span></div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-center justify-between"><span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Transacciones anuladas</span><span className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center"><I n="block" /></span></div>
          <div className="mt-space-md flex items-baseline justify-between"><span><span className="font-display-mobile text-display-mobile text-error">{c.anuladas}</span> <span className="font-headline-sm text-headline-sm text-error">ventas</span></span><span className="font-label-lg text-label-lg text-outline line-through tabular">{money(c.montoAnulado)}</span></div>
          <div className="mt-2 px-2 py-1 rounded-md bg-error-container/70 text-on-error-container font-label-sm text-label-sm w-fit">Solo el administrador puede anular</div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-center justify-between"><span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Ticket promedio</span><span className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center"><I n="receipt_long" /></span></div>
          <div className="mt-space-md font-display-mobile text-display-mobile tabular">{money(c.ticket)}</div>
          <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Descuentos otorgados: {money(c.descuentos)} · IVA: {money(c.iva)}</div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl gap-1">{[['hoy', 'Hoy'], ['semana', 'Esta Semana'], ['mes', 'Este Mes']].map(([k, t]) => <button key={k} type="button" onClick={() => fijar(k)} className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md ${rango.k === k ? 'bg-primary-container text-on-primary shadow-sm' : 'text-on-surface hover:bg-surface-container'}`}>{t}</button>)}</div>
          <div className="flex items-center gap-space-sm">
            <label className="flex items-center gap-space-xs bg-surface-container-low rounded-xl px-space-md py-1.5 font-label-sm text-label-sm text-outline">Desde:<input type="date" value={rango.desde} max={rango.hasta} onChange={(e) => e.target.value && setRango({ ...rango, desde: e.target.value, k: '' })} className="bg-transparent text-on-surface outline-none font-label-md text-label-md" /></label>
            <span className="text-outline">–</span>
            <label className="flex items-center gap-space-xs bg-surface-container-low rounded-xl px-space-md py-1.5 font-label-sm text-label-sm text-outline">Hasta:<input type="date" value={rango.hasta} min={rango.desde} max={hoyISO()} onChange={(e) => e.target.value && setRango({ ...rango, hasta: e.target.value, k: '' })} className="bg-transparent text-on-surface outline-none font-label-md text-label-md" /></label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_220px] gap-space-sm">
          <div className="relative"><I n="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar venta" placeholder="Buscar por N.º de comprobante (001-001-…), cliente o cédula" className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary-container/30" /></div>
          <select value={forma} onChange={(e) => setForma(e.target.value)} aria-label="Forma de pago" className="h-11 px-space-md rounded-xl bg-surface-container-low font-label-md text-label-md outline-none"><option value="">Forma de pago: Todas</option>{Object.entries(FORMAS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
          <select value={est} onChange={(e) => setEst(e.target.value)} aria-label="Estado" className="h-11 px-space-md rounded-xl bg-surface-container-low font-label-md text-label-md outline-none"><option value="VALIDAS">Válidas ({c.n})</option><option value="ANULADAS">Anuladas ({c.anuladas})</option><option value="TODAS">Todas ({ventas.length})</option></select>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider"><th className="py-4 px-space-md">N.º comprobante</th><th className="py-4 px-space-md">Fecha y hora</th><th className="py-4 px-space-md">Cliente</th><th className="py-4 px-space-md">Forma de pago</th><th className="py-4 px-space-md text-right">Total</th><th className="py-4 px-space-md text-center">Estado</th><th className="py-4 px-space-md">Atendido por</th></tr></thead>
          <tbody>
            {visibles.length === 0 ? <tr><td colSpan={7} className="py-space-xl text-center text-outline">No hay ventas {q || forma ? 'con esos filtros' : 'en este período'}.</td></tr> : visibles.map((v) => (
              <tr key={v.id} onClick={() => setSel(v)} className={`cursor-pointer border-t border-surface-container transition-colors ${v.anulada ? 'bg-error-container/20 hover:bg-error-container/30' : 'hover:bg-surface-container-low/60'}`}>
                <td className="py-3.5 px-space-md"><span className={`flex items-center gap-2 font-label-lg text-label-lg ${v.anulada ? 'text-error' : 'text-primary'}`}><I n="receipt_long" className="text-[20px]" /><span className="font-mono">{v.numero}</span></span></td>
                <td className="py-3.5 px-space-md font-body-md text-body-md whitespace-nowrap">{fechaNum(v.fecha)} · <b>{horaTxt(v.fecha)}</b></td>
                <td className="py-3.5 px-space-md"><span className="block font-label-lg text-label-lg">{v.clienteNombre}</span><span className="font-body-sm text-body-sm text-outline">{v.clienteIdentificacion === '9999999999999' ? v.clienteIdentificacion : `C.I. ${v.clienteIdentificacion}`}</span></td>
                <td className="py-3.5 px-space-md"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm ${FCHIP[v.formaPago]} ${v.anulada ? 'line-through opacity-70' : ''}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{FORMAS[v.formaPago]}</span></td>
                <td className={`py-3.5 px-space-md text-right font-headline-sm text-headline-sm tabular ${v.anulada ? 'text-error line-through' : ''}`}>{money(v.total)}</td>
                <td className="py-3.5 px-space-md text-center">{v.anulada ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm"><I n="cancel" className="text-[14px]" />Anulada</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-sm text-label-sm"><I n="check_circle" className="text-[14px]" />Válida</span>}</td>
                <td className="py-3.5 px-space-md"><span className="flex items-center gap-2 font-body-md text-body-md"><span className="w-7 h-7 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm flex items-center justify-center">{iniciales(v.usuario)}</span>{v.usuario}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-space-md py-space-md border-t border-surface-container">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Mostrando <b>{lista.length ? (pag - 1) * POR_PAG + 1 : 0}–{Math.min(pag * POR_PAG, lista.length)}</b> de <b>{lista.length}</b> ventas · Suma visible: {money(sumaVisible)}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={pag === 1} onClick={() => setPag(pag - 1)} aria-label="Anterior" className="w-9 h-9 rounded-lg bg-surface-container-low disabled:opacity-40 flex items-center justify-center"><I n="chevron_left" /></button>
            {Array.from({ length: paginas }, (_, i) => i + 1).filter((n) => Math.abs(n - pag) < 3 || n === 1 || n === paginas).map((n) => <button key={n} type="button" onClick={() => setPag(n)} className={`w-9 h-9 rounded-lg font-label-md text-label-md ${n === pag ? 'bg-primary-container text-on-primary' : 'hover:bg-surface-container-low'}`}>{n}</button>)}
            <button type="button" disabled={pag === paginas} onClick={() => setPag(pag + 1)} aria-label="Siguiente" className="w-9 h-9 rounded-lg bg-surface-container-low disabled:opacity-40 flex items-center justify-center"><I n="chevron_right" /></button>
          </div>
        </div>
      </div>

      <div className="bg-primary-fixed/40 rounded-2xl p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md"><span className="w-12 h-12 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-center"><I n="print" /></span><div><h3 className="font-headline-md text-headline-md">Impresión de comprobantes 80 mm</h3><p className="font-body-md text-body-md text-on-surface-variant">Se imprime con la impresora térmica instalada en Windows. En el diálogo elija la impresora y tamaño 80 mm.</p></div></div>
        <div className="flex gap-space-sm"><button type="button" onClick={prueba} className="btn-sec bg-surface-container-lowest py-2.5"><I n="code" />Probar impresión</button></div>
      </div>

      {sel && (
        <Modal titulo={`Comprobante ${sel.numero}`} subtitulo={sel.anulada ? `Anulada por ${sel.anuladaPor} · ${sel.motivoAnulacion}` : `Registrado por ${sel.usuario}`} icono="receipt_long" onClose={() => setSel(null)} ancho="max-w-lg"
          pie={<>
            {esAdmin && !sel.anulada && <button type="button" className="btn-sec text-error mr-auto" onClick={() => setAnular(sel)}><I n="block" />Anular</button>}
            <a className="btn-sec" href={`https://wa.me/?text=${encodeURIComponent(textoWhatsApp(sel, cfg))}`} target="_blank" rel="noopener noreferrer"><I n="send_to_mobile" />WhatsApp</a>
            <button type="button" className="btn-pri" onClick={() => imprimir(sel)}><I n="print" />Reimprimir</button>
          </>}>
          <div className="bg-white rounded-lg border border-neutral-200 p-5 max-w-[360px] mx-auto"><Ticket v={sel} cfg={cfg} /></div>
        </Modal>
      )}
      {anular && (
        <Modal titulo="Anular venta" subtitulo={`${anular.numero} · ${money(anular.total)}. El stock de los productos se devolverá.`} icono="block" onClose={() => setAnular(null)} ancho="max-w-md"
          pie={<><button type="button" className="btn-sec" onClick={() => setAnular(null)}>Cancelar</button><button type="button" className="btn-pri bg-error hover:bg-on-error-container" disabled={motivo.trim().length < 4} onClick={confirmarAnular}>Anular venta</button></>}>
          <label className="flex flex-col gap-space-xs"><span className="etiqueta">Motivo (obligatorio)</span><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} rows={3} className="campo" placeholder="Ej.: error al registrar, devolución del cliente…" autoFocus /></label>
        </Modal>
      )}
    </div>
  )
}
