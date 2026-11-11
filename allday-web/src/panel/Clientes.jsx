import { useEffect, useMemo, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { Cargando, I, useToast } from '../components/ui.jsx'
import { exportarCSV, fechaNum, iniciales, linkWhatsApp, money, telBonito, telInternacional } from '../util.js'

export default function Clientes() {
  const { esAdmin } = useAuth()
  const toast = useToast()
  const [l, setL] = useState(null), [q, setQ] = useState(''), [tipo, setTipo] = useState('')
  useEffect(() => { api.get('/clientes').then((r) => setL(r.data)).catch((e) => { toast(errorMsg(e), 'error'); setL([]) }) }, []) // eslint-disable-line
  const vis = useMemo(() => (l || []).filter((c) => (!tipo || (tipo === 'pedidos' ? c.pedidos > 0 : c.compras > 0)) &&
    (!q.trim() || `${c.nombre} ${c.telefono || ''} ${c.identificacion || ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [l, q, tipo])
  if (!l) return <Cargando />
  const mes = new Date().toISOString().slice(0, 7)
  const kpis = [['Clientes registrados', l.length, 'groups', 'bg-primary-fixed text-primary'], ['Con encargos', l.filter((c) => c.pedidos > 0).length, 'shopping_bag', 'bg-tertiary-fixed/50 text-tertiary'],
    ['Con comprobante a su nombre', l.filter((c) => c.compras > 0).length, 'receipt_long', 'bg-secondary-fixed text-secondary'], ['Nuevos este mes', l.filter((c) => c.creadoEn?.slice(0, 7) === mes).length, 'person_add', 'bg-primary-container text-on-primary']]
  return (
    <div className="px-margin-desktop py-space-lg space-y-space-lg max-w-[1600px]">
      <div className="flex items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm mb-1"><span className="w-8 h-8 rounded-lg bg-primary-fixed text-primary shadow-sm flex items-center justify-center"><I n="groups" className="text-[20px]" /></span><span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Relación con clientes</span></div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Clientes del Local</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Personas que dejaron encargos o pidieron comprobante con su cédula/RUC. Datos protegidos según la LOPDP.</p>
        </div>
        {esAdmin && <button type="button" disabled={!l.length} onClick={() => exportarCSV('clientes-allday.csv', [['Nombre', 'Teléfono', 'Cédula/RUC', 'Pedidos', 'Último pedido', 'Compras con datos', 'Total comprado', 'Última compra'], ...l.map((c) => [c.nombre, c.telefono || '', c.identificacion || '', c.pedidos, c.ultimoPedido ? fechaNum(c.ultimoPedido) : '', c.compras, c.totalCompras, c.ultimaCompra ? fechaNum(c.ultimaCompra) : ''])])} className="whitespace-nowrap flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-tertiary-container text-on-tertiary font-label-md text-label-md shadow-sm hover:bg-tertiary disabled:opacity-50"><I n="table_view" className="text-[18px]" />Exportar a Excel</button>}
      </div>
      <div className="grid grid-cols-4 gap-space-md">
        {kpis.map(([t, v, i, c]) => <div key={t} className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex items-center justify-between"><div><span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">{t}</span><div className="font-headline-md text-headline-md mt-1">{v}</div></div><span className={`w-12 h-12 rounded-xl flex items-center justify-center ${c}`}><I n={i} /></span></div>)}
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex items-center gap-space-md">
        <div className="relative flex-1"><I n="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cliente" placeholder="Buscar por nombre, teléfono o cédula" className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary-container/30" /></div>
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">{[['', 'Todos'], ['pedidos', 'Con encargos'], ['compras', 'Con comprobante']].map(([k, t]) => <button key={k} type="button" onClick={() => setTipo(k)} className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md ${tipo === k ? 'bg-primary text-on-primary' : 'hover:bg-surface-container'}`}>{t}</button>)}</div>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider"><th className="py-3.5 px-space-md">Cliente</th><th className="py-3.5 px-space-md">Contacto</th><th className="py-3.5 px-space-md text-center">Encargos</th><th className="py-3.5 px-space-md">Último encargo</th><th className="py-3.5 px-space-md text-right">Compras con datos</th><th className="py-3.5 px-space-md text-center">Acción</th></tr></thead>
          <tbody>{vis.length === 0 ? <tr><td colSpan={6} className="py-space-xl text-center text-outline">{l.length ? 'Ningún cliente coincide.' : 'Aún no hay clientes. Se registran al crear un pedido o al vender con cédula/RUC.'}</td></tr> : vis.map((c, k) => (
            <tr key={c.id ?? `v${c.identificacion}${k}`} className="border-t border-surface-container hover:bg-surface-container-low/40">
              <td className="py-3 px-space-md"><div className="flex items-center gap-space-sm"><span className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-label-md text-label-md flex items-center justify-center">{iniciales(c.nombre)}</span><div><span className="font-label-lg text-label-lg block">{c.nombre}</span><span className="font-body-sm text-body-sm text-on-surface-variant">Desde {c.creadoEn ? fechaNum(c.creadoEn) : '—'}</span></div></div></td>
              <td className="py-3 px-space-md font-body-md text-body-md">{c.telefono && <span className="block">{telBonito(c.telefono)}</span>}{c.identificacion && <span className="block text-on-surface-variant font-mono text-body-sm">C.I./RUC {c.identificacion}</span>}</td>
              <td className="py-3 px-space-md text-center"><span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-sm text-label-sm">{c.pedidos}</span></td>
              <td className="py-3 px-space-md font-body-md text-body-md">{c.ultimoPedido ? fechaNum(c.ultimoPedido) : '—'}</td>
              <td className="py-3 px-space-md text-right font-body-md text-body-md">{c.compras ? <><b className="tabular">{money(c.totalCompras)}</b><span className="block font-body-sm text-body-sm text-on-surface-variant">{c.compras} compras · {fechaNum(c.ultimaCompra)}</span></> : '—'}</td>
              <td className="py-3 px-space-md text-center">{c.telefono ? <a href={linkWhatsApp(telInternacional(c.telefono), `Hola ${c.nombre.split(' ')[0]}, te saludamos de ALL DAY Arte – Detalles.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-whatsapp/15 text-[#128c4a] font-label-sm text-label-sm hover:bg-whatsapp hover:text-white"><I n="chat" className="text-[16px]" />WhatsApp</a> : <span className="text-outline">—</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
