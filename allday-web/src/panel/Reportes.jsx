import { useEffect, useMemo, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { useConfig } from '../config.jsx'
import { Cargando, Foto, I } from '../components/ui.jsx'
import { AreaVentas } from '../components/Graficos.jsx'
import { imprimirContenido } from '../components/Ticket.jsx'
import { exportarCSV, fechaCorta, hoyISO, iconoCat, money, sumarDias } from '../util.js'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const COLORES = ['bg-primary-container', 'bg-tertiary', 'bg-secondary-container', 'bg-secondary', 'bg-tertiary-fixed-dim', 'bg-primary-fixed-dim', 'bg-outline']
const variacion = (a, b) => (b > 0 ? ((a - b) / b) * 100 : null)

function Chip({ v, texto }) {
  if (v === null) return <span className="font-body-sm text-body-sm text-outline">{texto ? 'sin período anterior' : ''}</span>
  return <span className="flex items-center gap-1 flex-wrap"><span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-label-sm text-label-sm ${v >= 0 ? 'bg-tertiary-fixed/40 text-tertiary' : 'bg-error-container text-error'}`}><I n={v >= 0 ? 'arrow_upward' : 'arrow_downward'} className="text-[14px]" />{v >= 0 ? '+' : ''}{v.toFixed(1)}%</span><span className="font-body-sm text-body-sm text-on-surface-variant">{texto}</span></span>
}

function Resumen({ r, cfg, rango }) {
  return (
    <div className="font-sans text-[12px] text-neutral-900">
      <h1 className="text-[18px] font-bold">{cfg.nombre || 'ALL DAY Arte – Detalles'} · Resumen de ventas</h1>
      <p>Del {rango.desde} al {rango.hasta} · generado {new Date().toLocaleString('es-EC', { hour12: false })}</p>
      <table className="w-full mt-3 border-collapse"><tbody>{[['Total vendido', money(r.total)], ['Transacciones', r.numeroVentas], ['Ticket promedio', money(r.ticketPromedio)], ['Pedidos registrados', r.pedidos], ['Margen bruto estimado', r.margen == null ? '—' : `${r.margen}%`]].map(([a, b]) => <tr key={a}><td className="border p-1">{a}</td><td className="border p-1 text-right font-bold">{b}</td></tr>)}</tbody></table>
      <h2 className="font-bold mt-3">Ventas por categoría</h2>
      <table className="w-full border-collapse"><tbody>{r.porCategoria.map((c) => <tr key={c.categoria}><td className="border p-1">{c.categoria}</td><td className="border p-1 text-right">{c.cantidad} u.</td><td className="border p-1 text-right">{money(c.total)}</td></tr>)}</tbody></table>
      <h2 className="font-bold mt-3">Productos más vendidos</h2>
      <table className="w-full border-collapse"><tbody>{r.topProductos.map((t, i) => <tr key={t.id}><td className="border p-1">{i + 1}. {t.nombre}</td><td className="border p-1 text-right">{t.cantidad} u.</td><td className="border p-1 text-right">{money(t.total)}</td></tr>)}</tbody></table>
      <h2 className="font-bold mt-3">Ventas por día</h2>
      <table className="w-full border-collapse"><tbody>{r.porDia.map((d) => <tr key={d.fecha}><td className="border p-1">{d.fecha}</td><td className="border p-1 text-right">{money(d.total)}</td></tr>)}</tbody></table>
    </div>
  )
}

export default function Reportes() {
  const { cfg } = useConfig()
  const [rango, setRango] = useState({ desde: sumarDias(-6), hasta: hoyISO(), k: '7' })
  const [r, setR] = useState(null), [error, setError] = useState('')
  const [top, setTop] = useState(5), [fTop, setFTop] = useState('')
  useEffect(() => { setR(null); setError(''); api.get('/reportes/ventas', { params: { desde: rango.desde, hasta: rango.hasta } }).then((x) => setR(x.data)).catch((e) => setError(errorMsg(e))) }, [rango])
  const fijar = (k) => {
    const h = hoyISO()
    setRango({ k, hasta: h, desde: k === 'hoy' ? h : k === '7' ? sumarDias(-6) : k === 'mes' ? h.slice(0, 8) + '01' : h.slice(0, 5) + '01-01' })
  }
  const datos = useMemo(() => (r?.porDia || []).map((d) => { const f = new Date(d.fecha + 'T12:00'); return { etiqueta: r.porDia.length > 14 ? `${f.getDate()}/${f.getMonth() + 1}` : `${DIAS[f.getDay()]} ${f.getDate()}`, valor: Number(d.total) } }), [r])
  if (error) return <div className="p-space-xl text-error">{error}</div>
  const totCat = r ? r.porCategoria.reduce((s, c) => s + Number(c.total), 0) : 0
  const pico = datos.reduce((m, d) => (d.valor > m.valor ? d : m), { valor: 0, etiqueta: '—' })
  const dias = r ? r.porDia.length : 1
  const topF = r ? r.topProductos.filter((t) => !fTop || `${t.nombre} ${t.codigo || ''}`.toLowerCase().includes(fTop.toLowerCase())).slice(0, top) : []
  const exportar = () => exportarCSV(`reporte-${rango.desde}_${rango.hasta}.csv`, [['Resumen', `${rango.desde} a ${rango.hasta}`], ['Total vendido', r.total], ['Transacciones', r.numeroVentas], ['Ticket promedio', r.ticketPromedio], ['Pedidos', r.pedidos], ['Margen estimado %', r.margen ?? ''], [],
    ['Fecha', 'Total'], ...r.porDia.map((d) => [d.fecha, d.total]), [], ['Categoría', 'Unidades', 'Total'], ...r.porCategoria.map((c) => [c.categoria, c.cantidad, c.total]), [], ['Pos.', 'Producto', 'Código', 'Categoría', 'Unidades', 'Total'], ...r.topProductos.map((t, i) => [i + 1, t.nombre, t.codigo || '', t.categoria, t.cantidad, t.total])])

  return (
    <div className="px-margin-desktop py-space-md space-y-space-lg max-w-[1600px]">
      <div className="flex items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-primary-container uppercase tracking-wider"><I n="monitoring" className="text-[16px]" />Panel analítico operativo</div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Reportes y Analítica del Negocio</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Ventas, productos destacados y categorías del local en el período elegido (sin ventas anuladas).</p>
        </div>
        <div className="flex flex-col items-end gap-space-xs">
          <button type="button" disabled={!r} onClick={() => imprimirContenido(<Resumen r={r} cfg={cfg} rango={rango} />, { a4: true })} className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-sm font-label-md text-label-md hover:bg-surface-container-high disabled:opacity-50"><I n="print" className="text-[18px]" />Imprimir resumen (PDF)</button>
          <button type="button" disabled={!r} onClick={exportar} className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-tertiary text-on-tertiary font-label-md text-label-md shadow-sm hover:bg-tertiary-container disabled:opacity-50"><I n="table_view" className="text-[18px]" />Exportar a Excel</button>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-xs flex-wrap"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase mr-space-xs">Período:</span>
          {[['hoy', 'Hoy'], ['7', 'Últimos 7 días'], ['mes', 'Este mes'], ['anio', 'Año actual']].map(([k, t]) => <button key={k} type="button" onClick={() => fijar(k)} className={`px-space-md py-1.5 rounded-full font-label-md text-label-md ${rango.k === k ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low hover:bg-surface-container'}`}>{t}</button>)}</div>
        <div className="flex items-center gap-space-sm bg-surface-container-low rounded-xl px-space-md py-1.5 font-label-sm text-label-sm">
          Desde:<input type="date" value={rango.desde} max={rango.hasta} onChange={(e) => e.target.value && setRango({ ...rango, desde: e.target.value, k: '' })} className="bg-transparent outline-none font-label-md text-label-md" />
          Hasta:<input type="date" value={rango.hasta} min={rango.desde} max={hoyISO()} onChange={(e) => e.target.value && setRango({ ...rango, hasta: e.target.value, k: '' })} className="bg-transparent outline-none font-label-md text-label-md" />
        </div>
      </div>
      {!r ? <Cargando /> : (<>
        <div className="grid grid-cols-4 gap-space-md">
          {[['Total vendido', money(r.total), 'payments', 'bg-primary-fixed text-primary-container', <Chip key="a" v={variacion(Number(r.total), Number(r.totalAnterior))} texto="vs. período anterior" />],
            ['Transacciones', <>{r.numeroVentas} <span className="font-headline-sm text-headline-sm text-on-surface-variant">ventas</span></>, 'receipt', 'bg-secondary-fixed text-secondary', <Chip key="b" v={variacion(r.numeroVentas, r.numeroAnterior)} texto={`promedio ${(r.numeroVentas / dias).toFixed(1)}/día`} />],
            ['Ticket promedio', money(r.ticketPromedio), 'balance', 'bg-tertiary-fixed/50 text-tertiary', <span key="c" className="font-body-sm text-body-sm text-on-surface-variant">{r.numeroAnterior ? `Anterior: ${money(r.totalAnterior / r.numeroAnterior)}` : 'Valor medio por venta'}</span>],
            ['Encargos taller', <>{r.pedidos} <span className="font-headline-sm text-headline-sm text-on-surface-variant">pedidos</span></>, 'design_services', 'bg-primary-fixed text-primary', <span key="d" className="font-body-sm text-body-sm text-on-surface-variant">{r.pedidosListos} listos • {r.pedidosEnCurso} en curso</span>]].map(([t, v, i, c, pie]) => (
            <div key={t} className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-start justify-between"><span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">{t}</span><span className={`w-11 h-11 rounded-xl flex items-center justify-center ${c}`}><I n={i} /></span></div>
              <div className="font-display-mobile text-display-mobile tabular">{v}</div>{pie}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-space-md">
          <div className="col-span-7 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <div className="flex items-start justify-between gap-space-md mb-space-md">
              <div><h2 className="font-headline-md text-headline-md">Evolución de Ventas por Día</h2><p className="font-body-sm text-body-sm text-on-surface-variant">{fechaCorta(rango.desde)} a {fechaCorta(rango.hasta)} (ingresos netos en USD)</p></div>
              <div className="flex items-center gap-space-sm bg-surface-container-low rounded-full px-space-md py-1 font-label-sm text-label-sm"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-container" />Ventas</span><span className="text-outline">|</span><span>Pico: {pico.etiqueta} ({money(pico.valor)})</span></div>
            </div>
            <AreaVentas datos={datos} alto={280} />
          </div>
          <div className="col-span-5 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col">
            <div className="flex items-start justify-between"><div><h2 className="font-headline-md text-headline-md">Ventas por Categoría</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Participación y unidades vendidas</p></div><span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">{r.porCategoria.length} categorías</span></div>
            {r.porCategoria.length === 0 ? <p className="flex-1 flex items-center justify-center text-outline py-space-xl">Sin ventas en el período.</p> : (
              <div className="mt-space-md space-y-space-md flex-1">{r.porCategoria.map((c, i) => { const p = totCat ? (Number(c.total) / totCat) * 100 : 0; return (
                <div key={c.categoria}>
                  <div className="flex items-center justify-between font-label-lg text-label-lg"><span className="flex items-center gap-space-xs"><span className={`w-3 h-3 rounded-full ${COLORES[i % 7]}`} />{c.categoria}</span><span className="tabular">{money(c.total)} <span className="text-on-surface-variant font-label-sm text-label-sm">({p.toFixed(0)}%)</span></span></div>
                  <div className="h-2 rounded-full bg-surface-container mt-1"><div className={`h-full rounded-full ${COLORES[i % 7]}`} style={{ width: `${p}%` }} /></div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant mt-0.5"><span>{c.cantidad} unidades vendidas</span><span>Ticket prom.: {money(Number(c.total) / Math.max(1, c.cantidad))}/u</span></div>
                </div>) })}</div>
            )}
            <div className="mt-space-md bg-primary-fixed/40 rounded-xl px-space-md py-space-sm flex items-center justify-between font-label-md text-label-md"><span className="flex items-center gap-space-xs"><I n="verified" className="text-primary" />Margen bruto estimado</span><span className="font-headline-sm text-headline-sm text-primary">{r.margen == null ? '—' : `${r.margen}%`}</span></div>
            {r.margen == null && <p className="font-body-sm text-body-sm text-outline mt-1">Registre el costo de los productos para calcular el margen.</p>}
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-center justify-between gap-space-md mb-space-md">
            <div><h2 className="font-headline-md text-headline-md">Ranking de Productos Más Vendidos</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Rotación e impacto en la facturación del período</p></div>
            <div className="flex items-center gap-space-sm">
              <div className="relative"><I n="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]" /><input value={fTop} onChange={(e) => setFTop(e.target.value)} aria-label="Filtrar ranking" placeholder="Filtrar por nombre o código…" className="h-10 pl-9 pr-3 w-64 rounded-xl bg-surface-container-low font-body-sm text-body-sm outline-none" /></div>
              <div className="flex bg-surface-container-low p-1 rounded-xl">{[5, 10].map((n) => <button key={n} type="button" onClick={() => setTop(n)} className={`px-3 py-1 rounded-lg font-label-sm text-label-sm ${top === n ? 'bg-surface-container-lowest text-primary shadow-sm' : ''}`}>Top {n}</button>)}</div>
            </div>
          </div>
          <table className="w-full text-left">
            <thead><tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider"><th className="py-3 px-space-md rounded-l-xl w-16">Pos.</th><th className="py-3 px-space-md">Producto &amp; código</th><th className="py-3 px-space-md">Categoría</th><th className="py-3 px-space-md text-center">Cantidad vendida</th><th className="py-3 px-space-md text-right">Ingresos totales</th><th className="py-3 px-space-md rounded-r-xl text-right">% del total</th></tr></thead>
            <tbody>{topF.length === 0 ? <tr><td colSpan={6} className="py-space-xl text-center text-outline">Sin ventas en el período.</td></tr> : topF.map((t, i) => { const p = Number(r.total) ? (Number(t.total) / Number(r.total)) * 100 : 0; return (
              <tr key={t.id} className="border-b border-surface-container last:border-0">
                <td className="py-3 px-space-md"><span className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md ${i === 0 ? 'bg-secondary-container text-on-secondary-container' : i < 3 ? 'bg-secondary-fixed text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>{r.topProductos.indexOf(t) + 1}</span></td>
                <td className="py-3 px-space-md"><div className="flex items-center gap-space-sm"><Foto id={t.imagenId} icono={iconoCat(t.icono)} className="w-11 h-11 rounded-lg" /><div><span className="font-label-lg text-label-lg block">{t.nombre}</span><span className="font-body-sm text-body-sm text-on-surface-variant font-mono">{t.codigo ? `SKU: ${t.codigo}` : 'Sin código'}</span></div></div></td>
                <td className="py-3 px-space-md"><span className="px-2 py-0.5 rounded-md bg-primary-fixed/60 text-primary font-label-sm text-label-sm">{t.categoria}</span></td>
                <td className="py-3 px-space-md text-center font-body-md text-body-md">{t.cantidad} unid.</td>
                <td className="py-3 px-space-md text-right font-headline-sm text-headline-sm tabular">{money(t.total)}</td>
                <td className="py-3 px-space-md text-right"><span className="inline-flex items-center gap-2 font-label-md text-label-md text-primary">{p.toFixed(1)}%<span className="w-16 h-1.5 rounded-full bg-surface-container"><span className="block h-full rounded-full bg-primary-container" style={{ width: `${p}%` }} /></span></span></td>
              </tr>) })}</tbody>
          </table>
        </div>
      </>)}
    </div>
  )
}
