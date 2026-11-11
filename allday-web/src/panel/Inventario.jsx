import { useEffect, useMemo, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { Campo, Cargando, Foto, I, Modal, useToast } from '../components/ui.jsx'
import { diaRelativoHora, exportarCSV, fechaNum, horaTxt, hoyISO, iconoCat, money } from '../util.js'

const nivel = (p) => (p.stock <= p.stockMinimo ? 'critico' : p.stock <= p.stockMinimo * 2 ? 'revisar' : 'bien')
const NIV = {
  bien: { t: 'Bien', chip: 'bg-tertiary-fixed/40 text-tertiary', bar: 'bg-tertiary', txt: 'Cap. normal' },
  revisar: { t: 'Revisar', chip: 'bg-secondary-fixed text-on-secondary-fixed', bar: 'bg-secondary-container', txt: 'Bajando' },
  critico: { t: 'Pedir ya', chip: 'bg-error-container text-error', bar: 'bg-error', txt: 'Urgente reposición' },
}
const TIPOS = { ENTRADA: ['+ Entrada', 'bg-tertiary-fixed/50 text-tertiary'], SALIDA: ['− Salida', 'bg-error-container text-error'], AJUSTE: ['± Ajuste', 'bg-secondary-fixed text-on-secondary-fixed'] }

export default function Inventario() {
  const toast = useToast()
  const [prods, setProds] = useState(null), [movs, setMovs] = useState([]), [cats, setCats] = useState([])
  const [q, setQ] = useState(''), [cat, setCat] = useState(null), [est, setEst] = useState('')
  const [mov, setMov] = useState(null), [pag, setPag] = useState(1), [fMov, setFMov] = useState('')
  const cargar = () => {
    api.get('/productos', { params: { soloActivos: true } }).then((r) => setProds(r.data.filter((p) => !p.esServicio))).catch((e) => { toast(errorMsg(e), 'error'); setProds([]) })
    api.get('/inventario/movimientos').then((r) => setMovs(r.data)).catch(() => {})
  }
  useEffect(() => { cargar(); api.get('/categorias').then((r) => setCats(r.data)).catch(() => {}) }, []) // eslint-disable-line
  useEffect(() => setPag(1), [q, cat, est])
  const lista = useMemo(() => (prods || []).filter((p) => (!q.trim() || `${p.nombre} ${p.codigo || ''}`.toLowerCase().includes(q.trim().toLowerCase())) && (!cat || p.categoriaId === cat) && (!est || nivel(p) === est))
    .sort((a, b) => ['critico', 'revisar', 'bien'].indexOf(nivel(a)) - ['critico', 'revisar', 'bien'].indexOf(nivel(b)) || a.nombre.localeCompare(b.nombre)), [prods, q, cat, est])
  if (!prods) return <Cargando />
  const cuenta = (k) => prods.filter((p) => nivel(p) === k).length
  const conCosto = prods.filter((p) => p.costo != null)
  const valorCosto = conCosto.reduce((s, p) => s + p.costo * p.stock, 0)
  const valorVenta = prods.reduce((s, p) => s + p.precio * p.stock, 0)
  const POR = 8, paginas = Math.max(1, Math.ceil(lista.length / POR)), vis = lista.slice((pag - 1) * POR, pag * POR)
  const movsVis = movs.filter((m) => !fMov || m.fecha.slice(0, 10) === fMov)
  const pctN = (k) => (prods.length ? Math.round((cuenta(k) / prods.length) * 100) : 0)
  const kardex = () => exportarCSV(`kardex-${hoyISO()}.csv`, [['Fecha', 'Hora', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Motivo', 'Responsable'], ...movs.map((m) => [fechaNum(m.fecha), horaTxt(m.fecha), m.codigo || '', m.producto, m.tipo, m.cantidad, m.motivo, m.usuario])])

  return (
    <div className="px-margin-desktop py-space-md space-y-space-lg max-w-[1600px]">
      <div className="flex items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm"><span className="text-primary-container uppercase tracking-wider font-bold">Bodega &amp; mostrador</span><span className="w-1.5 h-1.5 rounded-full bg-secondary-container" /><span className="text-on-surface-variant">ALL DAY · Cuenca</span></div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Control de Inventario y Almacén</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Existencias físicas del local. Cada venta, anulación y ajuste queda registrado en el kárdex.</p>
        </div>
        <div className="flex items-center gap-space-sm">
          <button type="button" onClick={kardex} disabled={!movs.length} className="whitespace-nowrap flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high font-label-md text-label-md disabled:opacity-50"><I n="download" className="text-[18px]" />Exportar Kárdex</button>
          <button type="button" onClick={() => setMov({ productoId: prods[0]?.id || '', tipo: 'ENTRADA', cantidad: '', motivo: '' })} disabled={!prods.length} className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-container disabled:opacity-50"><I n="add_box" className="text-[18px]" />Ajuste de Stock</button>
        </div>
      </div>
      {cuenta('critico') > 0 && (
        <div className="bg-secondary-fixed/60 rounded-2xl px-space-lg py-space-md flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md"><span className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center"><I n="warning" /></span>
            <div><p className="font-headline-sm text-headline-sm text-on-secondary-fixed flex items-center gap-1">Reponer pronto: {cuenta('critico')} productos en o bajo su mínimo<span className="w-2 h-2 rounded-full bg-error" /></p><p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">Llegaron o están por debajo de su stock mínimo. Conviene pedirlos al proveedor.</p></div></div>
          <button type="button" onClick={() => setEst('critico')} className="px-space-md py-2 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md shrink-0">Ver productos críticos</button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
          <div className="flex items-start justify-between"><span className="font-label-md text-label-md text-on-surface-variant">Valor del inventario (a costo)</span><span className="w-10 h-10 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-center"><I n="payments" /></span></div>
          <div className="font-display-mobile text-display-mobile mt-space-sm tabular">{money(valorCosto)}</div>
          <div className="font-body-sm text-body-sm text-on-surface-variant mt-1"><span className="text-primary font-bold">{prods.length} referencias</span> · a precio de venta {money(valorVenta)}{conCosto.length < prods.length && <span className="block text-secondary">{prods.length - conCosto.length} sin costo registrado</span>}</div>
        </div>
        {[['bien', 'Nivel óptimo (Bien)', 'verified', 'bg-tertiary-fixed/40 text-tertiary'], ['revisar', 'Umbral preventivo (Revisar)', 'schedule', 'bg-secondary-fixed text-secondary'], ['critico', 'Stock crítico (Pedir ya)', 'notifications_active', 'bg-error-container text-error']].map(([k, t, i, c]) => (
          <button key={k} type="button" onClick={() => setEst(est === k ? '' : k)} className={`text-left bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all ${est === k ? 'ring-2 ring-primary-container' : ''}`}>
            <div className="flex items-start justify-between"><span className="font-label-md text-label-md text-on-surface-variant">{t}</span><span className={`w-10 h-10 rounded-xl flex items-center justify-center ${c}`}><I n={i} /></span></div>
            <div className="mt-space-sm"><span className={`font-display-mobile text-display-mobile ${k === 'critico' ? 'text-error' : ''}`}>{cuenta(k)}</span> <span className="font-label-md text-label-md text-on-surface-variant">({pctN(k)}%)</span></div>
            <div className="h-1.5 rounded-full bg-surface-container mt-space-sm"><div className={`h-full rounded-full ${NIV[k].bar}`} style={{ width: `${pctN(k)}%` }} /></div>
          </button>
        ))}
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-space-md">
        <div className="flex items-center gap-space-md">
          <div className="relative w-72"><I n="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" placeholder="Buscar por producto o código" className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary-container/30" /></div>
          <div className="flex-1 flex items-center gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button type="button" onClick={() => setCat(null)} className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md shrink-0 ${!cat ? 'bg-primary text-on-primary' : 'hover:bg-surface-container'}`}>Todos</button>
            {cats.map((c) => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md shrink-0 ${cat === c.id ? 'bg-primary text-on-primary' : 'hover:bg-surface-container'}`}>{c.nombre}</button>)}
          </div>
          <select value={est} onChange={(e) => setEst(e.target.value)} aria-label="Estado" className="h-11 px-space-md rounded-xl bg-surface-container-low font-label-md text-label-md outline-none"><option value="">Todos los estados</option><option value="bien">Bien</option><option value="revisar">Revisar</option><option value="critico">Pedir ya</option></select>
        </div>
        <table className="w-full text-left">
          <thead><tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider"><th className="py-3.5 px-space-md rounded-l-xl">Producto / código</th><th className="py-3.5 px-space-md">Categoría</th><th className="py-3.5 px-space-md">Stock actual / mínimo</th><th className="py-3.5 px-space-md w-56">Nivel de almacén</th><th className="py-3.5 px-space-md text-center">Estado</th><th className="py-3.5 px-space-md rounded-r-xl text-center">Acciones</th></tr></thead>
          <tbody>
            {vis.length === 0 ? <tr><td colSpan={6} className="py-space-xl text-center text-outline">{prods.length ? 'Ningún producto coincide.' : 'No hay productos físicos registrados (los servicios no manejan stock).'}</td></tr> : vis.map((p) => {
              const nv = nivel(p), porc = Math.min(100, Math.round((p.stock / Math.max(1, p.stockMinimo * 3)) * 100))
              return (
                <tr key={p.id} className="border-b border-surface-container last:border-0">
                  <td className="py-3 px-space-md"><div className="flex items-center gap-space-sm"><Foto id={p.imagenId} icono={iconoCat(p.icono)} className="w-11 h-11 rounded-lg shrink-0" /><div><span className="font-label-lg text-label-lg block">{p.nombre}</span><span className={`font-body-sm text-body-sm font-mono ${nv === 'critico' ? 'text-error' : 'text-on-surface-variant'}`}>{p.codigo ? `SKU: ${p.codigo}` : 'Sin código'}</span></div></div></td>
                  <td className="py-3 px-space-md font-body-md text-body-md text-on-surface-variant">{p.categoria}</td>
                  <td className="py-3 px-space-md"><span className={`font-headline-sm text-headline-sm tabular ${nv === 'critico' ? 'text-error' : nv === 'revisar' ? 'text-secondary' : ''}`}>{p.stock}</span><span className="text-on-surface-variant font-body-md text-body-md"> / {p.stockMinimo} un.</span></td>
                  <td className="py-3 px-space-md"><div className="flex justify-between font-label-sm text-label-sm mb-1"><span className={nv === 'critico' ? 'text-error' : 'text-on-surface-variant'}>{porc}%</span><span className={nv === 'critico' ? 'text-error' : 'text-on-surface-variant'}>{NIV[nv].txt}</span></div><div className="h-2 rounded-full bg-surface-container"><div className={`h-full rounded-full ${NIV[nv].bar}`} style={{ width: `${Math.max(3, porc)}%` }} /></div></td>
                  <td className="py-3 px-space-md text-center"><span className={`whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm ${NIV[nv].chip}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{NIV[nv].t}</span></td>
                  <td className="py-3 px-space-md text-center"><button type="button" onClick={() => setMov({ productoId: p.id, tipo: 'ENTRADA', cantidad: '', motivo: '' })} className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-label-sm text-label-sm ${nv === 'critico' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary hover:bg-primary-fixed'}`}>+ Stock</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between"><span className="font-body-sm text-body-sm text-on-surface-variant">Mostrando {vis.length} de {lista.length} productos</span>
          <div className="flex items-center gap-1">{Array.from({ length: paginas }, (_, i) => i + 1).map((n) => <button key={n} type="button" onClick={() => setPag(n)} className={`w-8 h-8 rounded-lg font-label-md text-label-md ${n === pag ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container'}`}>{n}</button>)}</div></div>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm"><span className="w-10 h-10 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-center"><I n="history" /></span><div><h2 className="font-headline-sm text-headline-sm">Últimos Movimientos de Almacén</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Entradas, ventas, anulaciones y ajustes (últimos 50).</p></div></div>
          <label className="flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-low font-label-sm text-label-sm"><I n="calendar_today" className="text-[16px]" />Filtrar por fecha<input type="date" value={fMov} max={hoyISO()} onChange={(e) => setFMov(e.target.value)} className="bg-transparent outline-none" />{fMov && <button type="button" aria-label="Quitar fecha" onClick={() => setFMov('')}><I n="close" className="text-[14px]" /></button>}</label>
        </div>
        <table className="w-full text-left">
          <thead><tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider"><th className="py-3 px-space-md rounded-l-xl">Fecha y hora</th><th className="py-3 px-space-md">Producto &amp; código</th><th className="py-3 px-space-md text-center">Tipo</th><th className="py-3 px-space-md text-right">Cantidad</th><th className="py-3 px-space-md">Motivo / documento</th><th className="py-3 px-space-md rounded-r-xl">Responsable</th></tr></thead>
          <tbody>{movsVis.length === 0 ? <tr><td colSpan={6} className="py-space-lg text-center text-outline">Sin movimientos.</td></tr> : movsVis.map((m) => (
            <tr key={m.id} className="border-b border-surface-container last:border-0">
              <td className="py-3 px-space-md font-body-md text-body-md whitespace-nowrap">{diaRelativoHora(m.fecha)}</td>
              <td className="py-3 px-space-md"><span className="font-label-lg text-label-lg block">{m.producto}</span>{m.codigo && <span className="font-body-sm text-body-sm text-on-surface-variant font-mono">SKU: {m.codigo}</span>}</td>
              <td className="py-3 px-space-md text-center"><span className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm ${TIPOS[m.tipo][1]}`}>{TIPOS[m.tipo][0]}</span></td>
              <td className={`py-3 px-space-md text-right font-headline-sm text-label-lg tabular ${m.cantidad < 0 ? 'text-error' : 'text-tertiary'}`}>{m.cantidad > 0 ? '+' : ''}{m.cantidad} un.</td>
              <td className="py-3 px-space-md font-body-md text-body-md text-on-surface-variant">{m.motivo}</td>
              <td className="py-3 px-space-md font-body-md text-body-md">{m.usuario}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {mov && <AjusteStock mov={mov} prods={prods} onClose={() => setMov(null)} onHecho={() => { setMov(null); cargar() }} />}
    </div>
  )
}

function AjusteStock({ mov, prods, onClose, onHecho }) {
  const toast = useToast()
  const [f, setF] = useState(mov)
  const p = prods.find((x) => x.id === Number(f.productoId))
  const delta = f.tipo === 'ENTRADA' ? Math.abs(+f.cantidad || 0) : f.tipo === 'SALIDA' ? -Math.abs(+f.cantidad || 0) : +f.cantidad || 0
  async function guardar(e) {
    e.preventDefault()
    try { await api.post('/inventario/movimientos', { ...f, productoId: Number(f.productoId), cantidad: Number(f.cantidad) }); toast('Movimiento registrado en el kárdex'); onHecho() } catch (err) { toast(errorMsg(err), 'error') }
  }
  return (
    <Modal titulo="Ajuste de Stock" subtitulo="Registre una compra al proveedor, un consumo interno, merma o corrección de conteo" icono="inventory" onClose={onClose} ancho="max-w-xl"
      pie={<><button type="button" className="btn-sec" onClick={onClose}>Cancelar</button><button form="fmov" className="btn-pri" disabled={!delta}><I n="save" />Registrar movimiento</button></>}>
      <form id="fmov" onSubmit={guardar} className="flex flex-col gap-space-md">
        <Campo label="Producto *"><select className="campo" value={f.productoId} onChange={(e) => setF({ ...f, productoId: e.target.value })}>{prods.map((x) => <option key={x.id} value={x.id}>{x.nombre}{x.codigo ? ` · ${x.codigo}` : ''} (stock {x.stock})</option>)}</select></Campo>
        <div className="grid grid-cols-3 gap-space-sm">
          {[['ENTRADA', '+ Entrada', 'Compra o devolución', 'add_circle'], ['SALIDA', '− Salida', 'Consumo, merma o daño', 'remove_circle'], ['AJUSTE', '± Ajuste', 'Corrección de conteo', 'tune']].map(([k, t, s, i]) => (
            <button key={k} type="button" onClick={() => setF({ ...f, tipo: k })} className={`p-space-sm rounded-xl flex flex-col items-center text-center gap-1 ${f.tipo === k ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low hover:bg-surface-container'}`}><I n={i} /><span className="font-label-lg text-label-lg">{t}</span><span className="font-body-sm text-body-sm opacity-80">{s}</span></button>
          ))}
        </div>
        <Campo label={f.tipo === 'AJUSTE' ? 'Cantidad (+ suma, − resta)' : 'Cantidad *'}><input className="campo font-headline-sm tabular" type="number" required step="1" value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} autoFocus /></Campo>
        <Campo label="Motivo / documento *"><input className="campo" required maxLength={150} value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} placeholder={f.tipo === 'ENTRADA' ? 'Ej.: Compra a proveedor, factura N.º…' : 'Ej.: Usado para un arreglo del taller'} /></Campo>
        {p && <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-space-md py-space-sm font-label-lg text-label-lg"><span>Stock resultante</span><span className={`tabular ${p.stock + delta < 0 ? 'text-error' : 'text-primary'}`}>{p.stock} → {p.stock + delta} un.</span></div>}
      </form>
    </Modal>
  )
}
