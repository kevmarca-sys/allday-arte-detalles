import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useConfig } from '../config.jsx'
import { Cargando, Foto, I } from '../components/ui.jsx'
import { AreaVentas } from '../components/Graficos.jsx'
import { diaRelativo, estado, exportarCSV, fechaLarga, hoyISO, iconoCat, linkWhatsApp, money, pct, sumarDias, telBonito, telInternacional } from '../util.js'
import { usePanel } from './AdminLayout.jsx'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const etiquetaDia = (iso) => { const d = new Date(iso + 'T12:00'); return `${DIAS[d.getDay()]} ${d.getDate()}` }
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function KpiCard({ titulo, icono, tono, valor, sufijo, children, pie, barra }) {
  const T = { primary: ['bg-primary-fixed text-primary', 'bg-primary/5', 'bg-primary'], tertiary: ['bg-tertiary-fixed/40 text-tertiary', 'bg-tertiary/5', 'bg-tertiary'], secondary: ['bg-secondary-fixed text-secondary', 'bg-secondary-container/10', 'bg-secondary-container'], error: ['bg-error-container text-error', 'bg-error/5', 'bg-error'] }[tono]
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group min-h-[200px]">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500 ${T[1]}`} />
      <div className="flex items-center justify-between relative"><span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{titulo}</span><span className={`w-10 h-10 rounded-xl flex items-center justify-center ${T[0]}`}><I n={icono} className="text-[22px]" /></span></div>
      <div className="mt-space-md"><span className="font-display text-display text-on-surface font-extrabold tracking-tight tabular">{valor}</span>{sufijo && <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-1">{sufijo}</span>}{children}</div>
      {pie && <div className="mt-space-md pt-space-sm flex items-center justify-between text-body-sm text-outline font-body-sm">{pie}</div>}
      {barra !== undefined && <div className="w-full bg-surface-container h-1.5 rounded-full mt-1.5 overflow-hidden"><div className={`h-full rounded-full ${T[2]}`} style={{ width: `${Math.max(2, Math.min(100, barra))}%` }} /></div>}
    </div>
  )
}
export const Variacion = ({ v, texto }) => v === null || v === undefined ? <span className="block mt-2 font-body-sm text-body-sm text-outline">{texto ? 'Sin datos del período anterior' : ''}</span> : (
  <span className="flex items-center gap-space-xs mt-2"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${v >= 0 ? 'bg-tertiary-fixed/30 text-tertiary-container' : 'bg-error-container text-error'}`}><I n={v >= 0 ? 'trending_up' : 'trending_down'} className="text-[14px]" />{pct(v)}</span>{texto && <span className="font-body-sm text-body-sm text-outline">{texto}</span>}</span>
)

export default function Inicio() {
  const { user, esAdmin } = useAuth()
  const { horario } = useConfig()
  const { abrirCorte, abrirCalculadora } = usePanel()
  const nav = useNavigate()
  const [r, setR] = useState(null), [error, setError] = useState('')
  const [periodo, setPeriodo] = useState(7), [serie, setSerie] = useState(null)
  const [filtro, setFiltro] = useState('')
  useEffect(() => { api.get('/reportes/resumen').then((x) => setR(x.data)).catch((e) => setError(errorMsg(e))) }, [])
  useEffect(() => {
    if (!r) return
    if (periodo === 7 || !esAdmin) { setSerie(r.semana); return }
    api.get('/reportes/ventas', { params: { desde: sumarDias(-29), hasta: hoyISO() } }).then((x) => setSerie(x.data.porDia)).catch(() => setSerie(r.semana))
  }, [r, periodo, esAdmin])
  if (error) return <div className="p-space-xl text-error">{error}</div>
  if (!r) return <Cargando />

  const datos = (serie || []).map((d) => ({ etiqueta: etiquetaDia(d.fecha), valor: Number(d.total) }))
  const totalP = datos.reduce((s, d) => s + d.valor, 0)
  const pico = datos.reduce((m, d) => (d.valor > m.valor ? d : m), { valor: 0, etiqueta: '—' })
  const diasConVenta = datos.filter((d) => d.valor > 0).length
  const maxTop = Math.max(1, ...r.masVendidos.map((t) => t.cantidad))
  const recientes = r.pedidosRecientes.filter((p) => !filtro || p.estado === filtro)
  const mes = MESES[new Date().getMonth()]
  const reposicion = () => exportarCSV(`reposicion-${hoyISO()}.csv`, [['Código', 'Producto', 'Categoría', 'Stock actual', 'Stock mínimo', 'Sugerido pedir'], ...r.alertas.map((p) => [p.codigo || '', p.nombre, p.categoria, p.stock, p.stockMinimo, Math.max(1, p.stockMinimo * 2 - p.stock)])])

  return (
    <div className="flex flex-col w-full">
      <div className="px-margin-desktop py-space-sm">
        <div className="bg-primary-fixed/40 rounded-xl px-space-md py-2.5 flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <span className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0"><I n="location_on" className="text-[18px]" /></span>
            <div className="flex flex-col min-w-0"><span className="font-label-sm text-label-sm text-primary tracking-wide uppercase">Local &amp; retiro en mostrador</span><span className="font-body-sm text-body-sm text-on-surface truncate">Hoy: {r.ventasHoy} ventas por {money(r.totalHoy)} · {r.entregasHoy} entregas programadas · {r.listos} pedidos listos para retirar</span></div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest text-tertiary font-label-sm text-label-sm shadow-sm"><span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />Horario: {horario.replace(/^[^:]*:\s*/, '')}</span>
        </div>
      </div>

      <div className="px-margin-desktop py-space-md space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs"><span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold uppercase tracking-wider">Bazar &amp; Papelería</span><span className="text-outline text-body-sm">·</span><span className="font-label-sm text-label-sm text-outline">{esAdmin ? 'Administración' : 'Mostrador'}</span></div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight flex items-center gap-2">¡Hola de nuevo, {user?.nombre?.split(' ')[0]}! <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span></h1>
            <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1.5"><I n="calendar_today" className="text-[18px] text-primary" /><span>{fechaLarga()}</span></p>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <button type="button" onClick={abrirCorte} className="whitespace-nowrap flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md shadow-sm transition-all"><I n="payments" className="text-[18px] text-secondary" /><span>Corte de Caja</span></button>
            <Link to="/panel/caja" className="whitespace-nowrap flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md shadow-sm transition-all"><I n="point_of_sale" className="text-[18px] text-primary-container" /><span>Ir a Caja</span></Link>
            <Link to="/panel/pedidos?nuevo=1" className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-md hover:shadow-lg transition-all"><I n="add_circle" className="text-[20px]" /><span>Nuevo Pedido</span></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          <KpiCard titulo="Ventas del mes" icono="attach_money" tono="primary" valor={money(r.ventasMes)} pie={<><span>Hoy</span><span className="text-primary font-semibold">{money(r.totalHoy)} · {r.ventasHoy} ventas</span></>}>
            <Variacion v={r.variacionVentas} texto="frente al mes anterior" />
          </KpiCard>
          <KpiCard titulo="Pedidos del mes" icono="shopping_bag" tono="tertiary" valor={r.pedidosMes} sufijo="encargos" pie={<><span>Pendientes</span><span className="text-tertiary font-semibold">{r.pedidosPendientes} en curso · {r.listos} listos</span></>}>
            <Variacion v={r.variacionPedidos} />
          </KpiCard>
          <KpiCard titulo="Clientes registrados" icono="groups" tono="secondary" valor={r.clientes} sufijo="en total" pie={<><span>Nuevos en {mes}</span><span className="text-secondary font-semibold">+{r.clientesNuevosMes}</span></>} barra={r.clientes ? (r.clientesNuevosMes / r.clientes) * 100 : 0} />
          <KpiCard titulo="Alerta de stock" icono="warning" tono="error" valor={r.porAgotarse} pie={<><span>{r.porAgotarse ? 'requieren reposición' : 'Inventario en orden'}</span>{esAdmin && <Link to="/panel/inventario" className="text-error font-semibold hover:underline">Ver inventario</Link>}</>}>
            {r.porAgotarse > 0 && <span className="ml-2 align-middle px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Revisar</span>}
          </KpiCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div><div className="flex items-center gap-space-xs"><span className="w-2.5 h-2.5 rounded-full bg-primary" /><h2 className="font-headline-sm text-headline-sm text-on-surface">Ventas de los últimos {periodo} días</h2></div><p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Ingresos diarios registrados en caja (sin ventas anuladas).</p></div>
              {esAdmin && <div className="flex items-center bg-surface-container-low p-1 rounded-xl gap-1 shrink-0">{[7, 30].map((p) => <button key={p} type="button" onClick={() => setPeriodo(p)} className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all ${periodo === p ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>{p === 7 ? 'Últimos 7 días' : '30 días'}</button>)}</div>}
            </div>
            <div className="grid grid-cols-3 gap-space-sm my-space-md p-space-md bg-surface-container-low/70 rounded-xl">
              <div className="flex flex-col"><span className="font-label-sm text-label-sm text-outline">Total período</span><span className="font-headline-md text-headline-md text-primary tabular">{money(totalP)}</span></div>
              <div className="flex flex-col"><span className="font-label-sm text-label-sm text-outline">Día pico ({pico.etiqueta})</span><span className="font-headline-md text-headline-md text-on-surface tabular">{money(pico.valor)}</span></div>
              <div className="flex flex-col"><span className="font-label-sm text-label-sm text-outline">Promedio por día con venta</span><span className="font-headline-md text-headline-md text-on-surface tabular">{money(diasConVenta ? totalP / diasConVenta : 0)}</span></div>
            </div>
            {serie ? <AreaVentas datos={datos} /> : <Cargando />}
            <div className="mt-space-sm flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />{pico.valor > 0 ? `${pico.etiqueta} fue el día con más ventas del período` : 'Aún no hay ventas en el período'}</span>
              {esAdmin && <Link to="/panel/reportes" className="text-primary font-label-sm text-label-sm flex items-center gap-1 hover:underline">Ver reporte detallado<I n="arrow_forward" className="text-[16px]" /></Link>}
            </div>
          </div>
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-space-xs"><I n="emoji_events" className="text-secondary text-[22px]" /><h2 className="font-headline-sm text-headline-sm text-on-surface">Más Vendidos</h2></div><span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant font-label-sm text-label-sm capitalize">{mes}</span></div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Productos con más unidades vendidas este mes.</p>
              {r.masVendidos.length === 0 ? <p className="mt-space-lg font-body-md text-body-md text-outline text-center py-space-lg">Aún no hay ventas este mes.</p> : (
                <div className="mt-space-md space-y-space-md">
                  {r.masVendidos.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-space-sm group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display text-[14px] font-black shrink-0 ${i === 0 ? 'bg-secondary-container/30 text-secondary' : 'bg-surface-container text-primary'}`}>{i + 1}</div>
                      <Foto id={t.imagenId} icono={iconoCat(t.icono)} className="w-11 h-11 rounded-xl bg-surface-container-high shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2"><span className="font-label-md text-label-md text-on-surface truncate">{t.nombre}</span><span className="font-label-sm text-label-sm text-primary font-bold shrink-0 tabular">{money(t.total)}</span></div>
                        <div className="flex items-center justify-between mt-0.5"><span className="font-body-sm text-body-sm text-outline">{t.cantidad} unidades</span><span className="font-body-sm text-body-sm text-tertiary-container truncate">{t.categoria}</span></div>
                        <div className="w-full bg-surface-container h-1 rounded-full mt-1"><div className="bg-primary h-full rounded-full" style={{ width: `${(t.cantidad / maxTop) * 100}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link to="/panel/productos" className="mt-space-md w-full py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-label-sm text-label-sm flex items-center justify-center gap-1 transition-all"><span>Ver catálogo y stock completo</span><I n="chevron_right" className="text-[16px]" /></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
              <div className="flex items-center gap-space-xs"><span className="w-2.5 h-2.5 rounded-full bg-tertiary" /><div><h2 className="font-headline-sm text-headline-sm text-on-surface">Pedidos Recientes</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Encargos para retiro en el local.</p></div></div>
              <label className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">Filtrar por:
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="bg-surface-container-low rounded-lg px-space-sm py-1.5 text-on-surface font-label-sm text-label-sm outline-none"><option value="">Todos los estados</option><option value="RECIBIDO">Recibido</option><option value="EN_PREPARACION">En preparación</option><option value="LISTO">Listo</option><option value="ENTREGADO">Entregado</option></select>
              </label>
            </div>
            {recientes.length === 0 ? <p className="py-space-xl text-center text-outline">No hay pedidos {filtro ? 'con ese estado' : 'registrados todavía'}.</p> : (
              <table className="w-full text-left border-collapse">
                <thead><tr className="text-outline font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low/50"><th className="py-3 px-space-sm rounded-l-lg">Boleta</th><th className="py-3 px-space-sm">Cliente &amp; contacto</th><th className="py-3 px-space-sm">Encargo</th><th className="py-3 px-space-sm">Entrega</th><th className="py-3 px-space-sm text-right">Monto</th><th className="py-3 px-space-sm text-center">Estado</th><th className="py-3 px-space-sm rounded-r-lg text-right">Acción</th></tr></thead>
                <tbody className="font-body-sm text-body-sm text-on-surface">
                  {recientes.map((p) => {
                    const e = estado(p.estado)
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors cursor-pointer" onClick={() => nav(`/panel/pedidos?q=${p.codigo}`)}>
                        <td className="py-3 px-space-sm font-label-md text-label-md font-bold text-primary whitespace-nowrap">#{p.codigo}</td>
                        <td className="py-3 px-space-sm"><div className="flex flex-col"><span className="font-label-md text-label-md font-semibold">{p.cliente}</span><span className="text-outline">{telBonito(p.telefono)}</span></div></td>
                        <td className="py-3 px-space-sm max-w-[220px]"><span className="font-label-md text-label-md block">{p.tipo}</span><span className="text-outline line-clamp-2">{p.descripcion}</span></td>
                        <td className="py-3 px-space-sm whitespace-nowrap"><span className="flex items-center gap-1 text-tertiary"><I n="schedule" className="text-[16px]" />{diaRelativo(p.fechaEntrega)}</span></td>
                        <td className="py-3 px-space-sm text-right font-label-md text-label-md font-bold tabular">{Number(p.total) > 0 ? money(p.total) : '—'}</td>
                        <td className="py-3 px-space-sm text-center"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold whitespace-nowrap ${e.chip}`}><span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />{e.t}</span></td>
                        <td className="py-3 px-space-sm text-right"><a onClick={(ev) => ev.stopPropagation()} href={linkWhatsApp(telInternacional(p.telefono), `Hola ${p.cliente.split(' ')[0]}, te escribimos de ALL DAY sobre tu pedido ${p.codigo}.`)} target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp" className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-tertiary hover:text-on-tertiary transition-all inline-flex items-center justify-center text-tertiary"><I n="chat" className="text-[18px]" /></a></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <div className="mt-space-md pt-space-sm flex items-center justify-between text-body-sm text-outline font-body-sm"><span>Mostrando los encargos más recientes</span><Link to="/panel/pedidos" className="text-primary hover:underline font-label-sm text-label-sm flex items-center gap-1"><span>Ver todos los pedidos en curso ({r.pedidosPendientes})</span><I n="arrow_forward" className="text-[16px]" /></Link></div>
          </div>
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-space-xs"><div className="flex items-center gap-space-xs"><I n="inventory" className="text-error text-[22px]" /><h2 className="font-headline-sm text-headline-sm text-on-surface">Bajo Stock</h2></div>{r.alertas.length > 0 && <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">{r.alertas.length} críticos</span>}</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Productos en o bajo su stock mínimo.</p>
              {r.alertas.length === 0 ? <p className="mt-space-lg text-center py-space-lg text-tertiary font-label-md text-label-md flex flex-col items-center gap-1"><I n="verified" className="text-[32px]" />Todo el inventario está sobre el mínimo</p> : (
                <div className="mt-space-md space-y-space-sm max-h-[360px] overflow-y-auto">
                  {r.alertas.map((p) => (
                    <div key={p.id} className="p-space-sm rounded-xl bg-surface-container-low/70 flex items-center justify-between gap-space-sm">
                      <div className="flex-1 min-w-0"><span className="font-label-md text-label-md text-on-surface font-semibold truncate block">{p.nombre}</span><span className="font-body-sm text-body-sm text-outline">Mínimo: {p.stockMinimo} · {p.codigo || p.categoria}</span></div>
                      <div className="flex flex-col items-end shrink-0"><span className="font-headline-sm text-headline-sm text-error font-extrabold">{p.stock}</span><span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-[10px] font-bold uppercase">{p.stock === 0 ? 'Agotado' : 'Bajo stock'}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-space-lg space-y-space-xs">
              <button type="button" disabled={!r.alertas.length} onClick={reposicion} className="w-full py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container font-label-md text-label-md font-bold shadow-sm transition-all flex items-center justify-center gap-space-xs disabled:opacity-50"><I n="shopping_cart_checkout" className="text-[18px]" /><span>Descargar lista de reposición</span></button>
              {esAdmin && <Link to="/panel/inventario" className="w-full py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-all flex items-center justify-center gap-1"><I n="tune" className="text-[16px]" /><span>Ajustar stock y mínimos</span></Link>}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary-fixed/40 via-surface-container-lowest to-surface-container-high/40 rounded-2xl p-space-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md"><I n="brush" /></div>
            <div><h3 className="font-headline-sm text-headline-sm text-on-surface">Herramientas Rápidas de Mostrador</h3><p className="font-body-sm text-body-sm text-on-surface-variant">Calculadora, comprobantes y corte de caja a un clic.</p></div>
          </div>
          <div className="flex flex-wrap gap-space-sm">
            <button type="button" onClick={abrirCalculadora} className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-sm font-label-sm text-label-sm hover:bg-surface-container-high"><I n="calculate" className="text-[18px] text-primary" />Calculadora</button>
            <Link to="/panel/ventas" className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-sm font-label-sm text-label-sm hover:bg-surface-container-high"><I n="print" className="text-[18px] text-primary" />Reimprimir comprobante</Link>
            <Link to="/panel/pedidos" className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-sm font-label-sm text-label-sm hover:bg-surface-container-high"><I n="calendar_month" className="text-[18px] text-primary" />Agenda de pedidos</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
