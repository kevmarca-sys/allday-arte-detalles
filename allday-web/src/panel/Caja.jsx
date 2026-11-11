import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useConfig } from '../config.jsx'
import { Foto, I, Modal, useToast } from '../components/ui.jsx'
import Calculadora from '../components/Calculadora.jsx'
import { imprimir, textoWhatsApp, Ticket } from '../components/Ticket.jsx'
import { iconoCat, money } from '../util.js'

/** Cédula ecuatoriana (módulo 10) o RUC de 13 dígitos. */
export function idValida(id) {
  if (!id || id === '9999999999999') return true
  if (!/^\d{10}$|^\d{13}$/.test(id)) return false
  const ced = id.slice(0, 10), prov = +ced.slice(0, 2)
  if (id.length === 13 && (id[2] === '9' || id[2] === '6')) return !id.endsWith('000')
  if (!((prov >= 1 && prov <= 24) || prov === 30) || +ced[2] > 5) return false
  let s = 0
  for (let i = 0; i < 9; i++) { let d = +ced[i] * (i % 2 === 0 ? 2 : 1); if (d > 9) d -= 9; s += d }
  return (10 - (s % 10)) % 10 === +ced[9] && (id.length === 10 || !id.endsWith('000'))
}
const r2 = (n) => Math.round(n * 100) / 100
const ESPERA = 'allday_ventas_espera'
const leerEspera = () => { try { return JSON.parse(localStorage.getItem(ESPERA)) || [] } catch { return [] } }

export default function Caja() {
  const { user } = useAuth()
  const { cfg } = useConfig()
  const toast = useToast()
  const [productos, setProductos] = useState([])
  const [cats, setCats] = useState([])
  const [cat, setCat] = useState(null)
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [desc, setDesc] = useState(''), [descPct, setDescPct] = useState(false)
  const [forma, setForma] = useState('EFECTIVO')
  const [recibido, setRecibido] = useState('')
  const [conDatos, setConDatos] = useState(false)
  const [cli, setCli] = useState({ nombre: '', id: '', email: '', obs: '' })
  const [enviando, setEnviando] = useState(false)
  const [hecha, setHecha] = useState(null)
  const [ultima, setUltima] = useState(null)
  const [calc, setCalc] = useState(false)
  const [espera, setEspera] = useState(leerEspera)
  const [verEspera, setVerEspera] = useState(false)
  const busca = useRef(), descRef = useRef(), recRef = useRef()

  const cargar = () => api.get('/productos').then((r) => setProductos(r.data)).catch((e) => toast(errorMsg(e), 'error'))
  useEffect(() => { cargar(); api.get('/categorias').then((r) => setCats(r.data)).catch(() => {}); busca.current?.focus() }, []) // eslint-disable-line

  const enCarrito = (id) => items.find((i) => i.p.id === id)?.cant || 0
  const agregar = useCallback((p, n = 1) => {
    setItems((l) => {
      const ya = l.find((i) => i.p.id === p.id)
      const nueva = (ya?.cant || 0) + n
      if (!p.esServicio && nueva > p.stock) { toast(`Solo hay ${p.stock} unidades de ${p.nombre}`, 'error'); return l }
      if (nueva <= 0) return l.filter((i) => i.p.id !== p.id)
      return ya ? l.map((i) => (i.p.id === p.id ? { ...i, cant: nueva } : i)) : [...l, { p, cant: nueva }]
    })
  }, [toast])
  const fijar = (p, v) => {
    const n = Math.max(0, Math.floor(Number(v) || 0))
    if (!p.esServicio && n > p.stock) { toast(`Solo hay ${p.stock} unidades`, 'error'); return }
    setItems((l) => (n === 0 ? l.filter((i) => i.p.id !== p.id) : l.map((i) => (i.p.id === p.id ? { ...i, cant: n } : i))))
  }

  const subtotal = r2(items.reduce((s, i) => s + i.cant * Number(i.p.precio), 0))
  const descuento = r2(Math.min(subtotal, descPct ? (subtotal * (Number(desc) || 0)) / 100 : Number(desc) || 0))
  const total = r2(subtotal - descuento)
  const iva = r2(items.reduce((s, i) => { const t = i.p.iva ?? 15; if (!t || !subtotal) return s; const neto = (i.cant * Number(i.p.precio) * total) / subtotal; return s + neto - neto / (1 + t / 100) }, 0))
  const tarifas = [...new Set(items.map((i) => i.p.iva ?? 15))]
  const rec = Number(recibido) || 0
  const cambio = r2(rec - total)
  const unidades = items.reduce((s, i) => s + i.cant, 0)
  const idOk = idValida(cli.id.trim())
  const puedeCobrar = items.length > 0 && !enviando && (forma !== 'EFECTIVO' || recibido === '' || rec >= total) && (!conDatos || idOk)

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return productos.filter((p) => (!cat || p.categoriaId === cat) && (!t || p.nombre.toLowerCase().includes(t) || (p.codigo || '').toLowerCase().includes(t)))
  }, [productos, cat, q])

  /** Lector de código de barras: escribe el código y envía Enter. */
  const enterBusqueda = (e) => {
    e.preventDefault()
    const t = q.trim().toLowerCase(); if (!t) return
    const exacto = productos.find((p) => (p.codigo || '').toLowerCase() === t)
    const unico = filtrados.length === 1 ? filtrados[0] : null
    const p = exacto || unico
    if (p) { agregar(p); setQ('') } else toast('No se encontró un producto con ese código', 'error')
  }

  async function cobrar() {
    if (!puedeCobrar) return
    setEnviando(true)
    try {
      const body = {
        items: items.map((i) => ({ productoId: i.p.id, cantidad: i.cant })), descuento, formaPago: forma,
        montoRecibido: forma === 'EFECTIVO' && recibido !== '' ? rec : null,
        clienteNombre: conDatos ? cli.nombre.trim() || null : null, clienteIdentificacion: conDatos ? cli.id.trim() || null : null,
        clienteEmail: conDatos ? cli.email.trim() || null : null, observacion: cli.obs.trim() || null,
      }
      const { data } = await api.post('/ventas', body)
      setHecha(data); setUltima(data)
      if (data.alertas?.length) toast(`Stock bajo: ${data.alertas.join(', ')}`, 'error')
      cargar()
    } catch (e) { toast(errorMsg(e), 'error') } finally { setEnviando(false) }
  }
  const nueva = () => {
    setHecha(null); setItems([]); setDesc(''); setRecibido(''); setForma('EFECTIVO'); setConDatos(false); setCli({ nombre: '', id: '', email: '', obs: '' })
    setTimeout(() => busca.current?.focus(), 50)
  }
  const ponerEnEspera = () => {
    if (!items.length) return
    const l = [...espera, { t: Date.now(), items: items.map((i) => ({ id: i.p.id, cant: i.cant })), desc, descPct, cli, conDatos }]
    localStorage.setItem(ESPERA, JSON.stringify(l)); setEspera(l); nueva(); toast('Venta puesta en espera')
  }
  const retomar = (k) => {
    const v = espera[k]
    setItems(v.items.map((x) => ({ p: productos.find((p) => p.id === x.id), cant: x.cant })).filter((x) => x.p))
    setDesc(v.desc); setDescPct(v.descPct); setCli(v.cli); setConDatos(v.conDatos)
    const l = espera.filter((_, i) => i !== k); localStorage.setItem(ESPERA, JSON.stringify(l)); setEspera(l); setVerEspera(false)
  }

  useEffect(() => {
    const h = (e) => {
      if (calc) return
      const enCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (e.key === 'F2') { e.preventDefault(); if (hecha) nueva(); else busca.current?.focus() }
      else if (e.key === 'F4') { e.preventDefault(); descRef.current?.focus() }
      else if (e.key === 'F8') { e.preventDefault(); setCalc(true) }
      else if (e.key === 'F9') { e.preventDefault(); setForma('EFECTIVO'); setTimeout(() => recRef.current?.focus(), 30) }
      else if (e.key === 'F12') { e.preventDefault(); if (ultima) imprimir(ultima) }
      else if ((e.key === ' ' && !enCampo) || (e.key === 'Enter' && e.ctrlKey)) { if (!hecha) { e.preventDefault(); cobrar() } }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  })

  const Tecla = ({ k, t }) => <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-surface-container-highest font-mono text-[10px] text-on-surface">{k}</span>{t}</span>
  const totalCat = (id) => productos.filter((p) => p.categoriaId === id).length

  return (
    <div className="p-space-lg flex flex-col xl:flex-row gap-space-lg items-start max-w-[1720px] mx-auto w-full">
      <section className="w-full xl:w-[62%] flex flex-col gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><I n="point_of_sale" className="text-[24px]" /></div>
            <div>
              <div className="flex items-center gap-2"><h1 className="font-headline-sm text-headline-sm text-on-surface">Caja · Venta de Mostrador</h1><span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm"><span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />En servicio</span></div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Cajero: {user?.nombre} · {cfg.direccion || 'Cuenca'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {espera.length > 0 && <button type="button" onClick={() => setVerEspera(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm"><I n="pause_circle" className="text-[18px]" />En espera ({espera.length})</button>}
            <button type="button" onClick={() => busca.current?.focus()} title="Haga clic y escanee el código de barras" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high"><I n="barcode_scanner" className="text-[18px]" /><span>Lector USB</span></button>
            <button type="button" onClick={() => setCalc(true)} aria-label="Calculadora (F8)" title="Calculadora (F8)" className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface"><I n="dialpad" className="text-[18px]" /></button>
          </div>
        </div>
        <form onSubmit={enterBusqueda} className="relative w-full">
          <I n="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[22px]" />
          <input ref={busca} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto o escanear código" placeholder="Buscar por nombre o escanear código (AD-UTI-001)…" className="w-full h-12 pl-11 pr-28 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline" />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-outline font-label-sm text-label-sm bg-surface-container-low px-2 py-1 rounded-lg"><I n="keyboard" className="text-[15px]" />F2 Buscar</span>
        </form>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button type="button" onClick={() => setCat(null)} className={`px-4 py-2 rounded-xl font-label-md text-label-md shrink-0 shadow-sm transition-all ${cat === null ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'}`}>Todos ({productos.length})</button>
          {cats.map((c) => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`px-3.5 py-2 rounded-xl font-label-md text-label-md shrink-0 shadow-sm transition-all ${cat === c.id ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'}`}>{c.nombre} ({totalCat(c.id)})</button>)}
        </div>
        {filtrados.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-space-xl text-center text-on-surface-variant flex flex-col items-center gap-2"><I n="inventory_2" className="text-[40px] text-primary-container" />{productos.length ? 'Ningún producto coincide con la búsqueda.' : 'Aún no hay productos. Regístrelos en Productos para venderlos aquí.'}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3.5">
            {filtrados.map((p) => {
              const n = enCarrito(p.id), sin = !p.esServicio && p.stock <= 0
              return (
                <button key={p.id} type="button" disabled={sin} onClick={() => agregar(p)} className={`group text-left bg-surface-container-lowest rounded-xl p-3 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between active:scale-[0.98] ${sin ? 'opacity-50 cursor-not-allowed' : ''} ${n ? 'ring-2 ring-primary-container' : ''}`}>
                  {n > 0 && <span className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-primary text-on-primary font-headline-sm text-label-md flex items-center justify-center shadow-md">{n}</span>}
                  <div>
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-surface-container mb-2.5">
                      <Foto id={p.imagenId} icono={iconoCat(p.icono)} className="w-full h-full" imgClass="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-surface-container-lowest/90 backdrop-blur font-label-sm text-label-sm ${p.esServicio ? 'text-primary' : p.bajoMinimo ? 'text-error' : 'text-tertiary'}`}>{p.esServicio ? 'Servicio' : `Stock: ${p.stock} un.`}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">{p.categoria}</span>
                    <h3 className="font-headline-sm text-label-lg text-on-surface line-clamp-2 leading-tight mt-0.5">{p.nombre}</h3>
                    {p.codigo && <span className="font-mono text-[10px] text-outline">{p.codigo}</span>}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between pt-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold tabular">{money(p.precio)}</span>
                    <span className="w-8 h-8 rounded-lg bg-surface-container-high text-primary group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center transition-colors"><I n="add" className="text-[18px]" /></span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        <div className="bg-surface-container-low p-space-sm rounded-xl flex flex-wrap items-center justify-between text-on-surface-variant font-label-sm text-label-sm gap-2">
          <div className="flex items-center gap-3 flex-wrap"><Tecla k="F2" t="Buscar / nueva" /><Tecla k="F4" t="Descuento" /><Tecla k="F8" t="Calculadora" /><Tecla k="F9" t="Efectivo" /><Tecla k="Espacio" t="Cobrar" /><Tecla k="F12" t="Reimprimir" /></div>
          <div className="text-tertiary font-semibold flex items-center gap-1"><I n="print" className="text-[16px]" /><span>Ticket 80 mm · impresora del navegador</span></div>
        </div>
      </section>

      <aside className="w-full xl:w-[38%] xl:sticky xl:top-24 bg-surface-container-lowest rounded-2xl shadow-md p-space-md sm:p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
          <div className="flex items-center gap-2"><I n="receipt" className="text-primary text-[22px]" /><div><h2 className="font-headline-sm text-headline-sm text-on-surface leading-none">Venta Actual</h2><span className="font-mono text-body-sm text-primary font-bold">{unidades} unidad{unidades === 1 ? '' : 'es'} · {new Date().toLocaleDateString('es-EC')}</span></div></div>
          <button type="button" disabled={!items.length} onClick={() => setItems([])} className="flex items-center gap-1 text-error hover:bg-error-container/50 px-2.5 py-1.5 rounded-lg transition-colors font-label-sm text-label-sm disabled:opacity-40"><I n="delete_sweep" className="text-[18px]" /><span>Vaciar</span></button>
        </div>
        {items.length === 0 ? <div className="py-space-lg text-center text-on-surface-variant font-body-md text-body-md flex flex-col items-center gap-1"><I n="shopping_basket" className="text-[36px] text-outline-variant" />Toque un producto o escanee su código para agregarlo.</div> : (
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {items.map(({ p, cant }) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="min-w-0 flex-1 mr-3"><h4 className="font-label-lg text-label-lg text-on-surface truncate">{p.nombre}</h4><div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm"><span>{money(p.precio)} c/u</span><span>•</span><span className="text-tertiary font-medium truncate">{p.categoria}</span></div></div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-surface-container-lowest rounded-lg shadow-sm p-0.5">
                    <button type="button" aria-label="Quitar uno" onClick={() => agregar(p, -1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high"><I n="remove" className="text-[14px]" /></button>
                    <input value={cant} onChange={(e) => fijar(p, e.target.value)} aria-label="Cantidad" inputMode="numeric" className="w-9 text-center font-label-md text-label-md font-bold bg-transparent outline-none" />
                    <button type="button" aria-label="Agregar uno" onClick={() => agregar(p, 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high"><I n="add" className="text-[14px]" /></button>
                  </div>
                  <span className="w-16 text-right font-headline-sm text-label-lg text-on-surface font-extrabold tabular">{money(cant * p.precio)}</span>
                  <button type="button" aria-label="Eliminar" onClick={() => fijar(p, 0)} className="text-outline hover:text-error p-1"><I n="delete" className="text-[18px]" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm"><span>Subtotal ({unidades} unidades)</span><span className="font-semibold text-on-surface tabular">{money(subtotal)}</span></div>
          <div className="flex justify-between items-center text-secondary font-body-sm text-body-sm gap-2">
            <span className="flex items-center gap-1"><I n="sell" className="text-[16px]" /><span>Descuento (F4)</span></span>
            <span className="flex items-center gap-1">
              <input ref={descRef} value={desc} onChange={(e) => setDesc(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="0" aria-label="Descuento" className="w-16 h-7 px-2 text-right rounded-md bg-surface-container-lowest text-on-surface outline-none focus:ring-1 focus:ring-primary" />
              <button type="button" onClick={() => setDescPct(!descPct)} className="h-7 px-2 rounded-md bg-surface-container-lowest text-on-surface font-bold" title="Cambiar entre $ y %">{descPct ? '%' : '$'}</button>
              <span className="font-bold w-16 text-right tabular">-{money(descuento)}</span>
            </span>
          </div>
          <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm"><span>IVA incluido ({tarifas.length ? tarifas.map((t) => `${t}%`).join(' / ') : '—'})</span><span className="tabular">{money(iva)}</span></div>
          <div className="pt-2 border-t border-surface-container-high flex justify-between items-baseline">
            <div><span className="font-headline-sm text-headline-sm text-on-surface block leading-tight">TOTAL A PAGAR</span><span className="font-label-sm text-label-sm text-outline">Precios con IVA incluido</span></div>
            <span className="font-display text-display text-primary font-extrabold leading-none tabular">{money(total)}</span>
          </div>
        </div>
        <div>
          <span className="block font-label-sm text-label-sm text-outline uppercase font-bold tracking-wider mb-2">Forma de pago</span>
          <div className="grid grid-cols-3 gap-2">
            {[['EFECTIVO', 'payments', 'Efectivo'], ['TRANSFERENCIA', 'account_balance', 'Transferencia'], ['TARJETA', 'credit_card', 'Tarjeta']].map(([k, i, t]) => (
              <button key={k} type="button" onClick={() => setForma(k)} aria-pressed={forma === k} className={`flex flex-col items-center justify-center p-2.5 rounded-xl font-label-sm text-label-sm gap-1 transition-all active:scale-95 ${forma === k ? 'bg-primary text-on-primary shadow-sm font-bold' : 'bg-surface-container text-on-surface hover:bg-surface-container-high font-semibold'}`}><I n={i} className="text-[20px]" /><span>{t}</span></button>
            ))}
          </div>
        </div>
        {forma === 'EFECTIVO' && (
          <div className="p-3.5 rounded-xl bg-surface-container-low space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="recibido" className="font-label-md text-label-md text-on-surface font-bold shrink-0">Efectivo recibido (F9):</label>
              <div className="relative w-40"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-headline-sm text-headline-sm text-on-surface-variant font-bold">$</span>
                <input id="recibido" ref={recRef} value={recibido} onChange={(e) => setRecibido(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="0.00" className="w-full h-11 pl-8 pr-3 text-right rounded-xl bg-surface-container-lowest font-headline-sm text-headline-sm text-on-surface font-extrabold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm tabular" /></div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button type="button" disabled={!total} onClick={() => setRecibido(total.toFixed(2))} className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm hover:bg-primary-fixed font-bold shadow-sm">Exacto ({money(total)})</button>
              {[1, 5, 10, 20].map((n) => <button key={n} type="button" onClick={() => setRecibido(r2((Number(recibido) || 0) + n).toFixed(2))} className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-label-sm hover:bg-primary-fixed font-semibold shadow-sm">+${n}</button>)}
              {[20, 50].filter((b) => b > total && total > 0).map((b) => <button key={'b' + b} type="button" onClick={() => setRecibido(b.toFixed(2))} className="px-2.5 py-1 rounded-lg bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold shadow-sm">${b}</button>)}
              {recibido && <button type="button" onClick={() => setRecibido('')} className="px-2 py-1 rounded-lg text-outline font-label-sm text-label-sm hover:text-error">Borrar</button>}
            </div>
            {recibido !== '' && (rec >= total ? (
              <div className="p-3 rounded-xl bg-[#e6fbf4] text-[#047857] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2"><I n="price_check" className="text-[26px]" /><div><span className="font-label-sm text-label-sm uppercase font-bold tracking-wider block">Cambio / Vuelto:</span><span className="font-body-sm text-body-sm opacity-90">Entregar al cliente</span></div></div>
                <span className="font-display text-display font-extrabold tracking-tight leading-none tabular">{money(cambio)}</span>
              </div>
            ) : <div className="p-3 rounded-xl bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-2"><I n="error" />Faltan {money(-cambio)} para completar el pago</div>)}
          </div>
        )}
        <div className="p-3 rounded-xl bg-surface-container-low space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface font-bold"><I n="person" className="text-[18px] text-primary" />Datos del cliente</span>
            <label className="flex items-center gap-1.5 cursor-pointer"><span className="font-label-sm text-label-sm text-on-surface-variant">Con datos</span><input type="checkbox" checked={conDatos} onChange={(e) => setConDatos(e.target.checked)} className="accent-primary w-4 h-4 rounded cursor-pointer" /></label>
          </div>
          {conDatos ? (
            <>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label><span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Nombre / Razón social</span><input value={cli.nombre} onChange={(e) => setCli({ ...cli, nombre: e.target.value })} maxLength={120} className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary" /></label>
                <label><span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">C.I. / RUC</span><input value={cli.id} onChange={(e) => setCli({ ...cli, id: e.target.value.replace(/\D/g, '').slice(0, 13) })} inputMode="numeric" className={`w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-1 ${idOk ? 'focus:ring-primary' : 'ring-1 ring-error'}`} /></label>
              </div>
              {!idOk && <p className="font-body-sm text-body-sm text-error">Cédula o RUC no válido.</p>}
              <label className="block"><span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Correo (opcional)</span><input type="email" value={cli.email} onChange={(e) => setCli({ ...cli, email: e.target.value })} placeholder="cliente@correo.com" className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary" /></label>
            </>
          ) : <p className="font-body-sm text-body-sm text-on-surface-variant">Consumidor final · 9999999999999</p>}
          <label className="block"><span className="block font-label-sm text-label-sm text-on-surface-variant mb-1">Observación (opcional)</span><input value={cli.obs} onChange={(e) => setCli({ ...cli, obs: e.target.value })} maxLength={250} className="w-full h-9 px-2.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary" /></label>
        </div>
        <div className="space-y-2 pt-1">
          <button type="button" onClick={cobrar} disabled={!puedeCobrar} className="w-full py-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:shadow-none">
            <I n={enviando ? 'progress_activity' : 'check_circle'} className={`text-[26px] ${enviando ? 'animate-spin' : ''}`} /><span>{enviando ? 'Registrando…' : `Cobrar ${money(total)} (Espacio)`}</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={!items.length} onClick={ponerEnEspera} className="w-full py-2.5 px-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm flex items-center justify-center gap-1.5 disabled:opacity-50"><I n="pause_circle" className="text-[18px]" />Poner en espera</button>
            <button type="button" disabled={!ultima} onClick={() => imprimir(ultima)} className="w-full py-2.5 px-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm flex items-center justify-center gap-1.5 disabled:opacity-50"><I n="print" className="text-[18px]" />Último ticket (F12)</button>
          </div>
        </div>
      </aside>

      {hecha && <VentaRegistrada v={hecha} cfg={cfg} onNueva={nueva} />}
      {calc && <Calculadora onClose={() => setCalc(false)} onUsar={(n) => { setRecibido(n.toFixed(2)); setForma('EFECTIVO'); setCalc(false) }} />}
      {verEspera && (
        <Modal titulo="Ventas en espera" subtitulo="Retome una venta que dejó pendiente en este equipo" icono="pause_circle" onClose={() => setVerEspera(false)} ancho="max-w-lg">
          <div className="flex flex-col gap-space-sm">
            {espera.map((v, k) => (
              <div key={v.t} className="flex items-center justify-between bg-surface-container-low rounded-xl p-space-sm">
                <div><b className="font-label-lg text-label-lg">{new Date(v.t).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</b> · {v.items.reduce((s, i) => s + i.cant, 0)} unidades{v.cli?.nombre ? ` · ${v.cli.nombre}` : ''}</div>
                <div className="flex gap-2"><button type="button" className="btn-pri py-2 px-space-md" onClick={() => retomar(k)}>Retomar</button><button type="button" aria-label="Descartar" className="btn-sec py-2 px-3" onClick={() => { const l = espera.filter((_, i) => i !== k); localStorage.setItem(ESPERA, JSON.stringify(l)); setEspera(l) }}><I n="delete" /></button></div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function VentaRegistrada({ v, cfg, onNueva }) {
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') onNueva() }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [onNueva])
  return (
    <div className="fixed inset-0 z-[80] bg-on-surface/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex flex-col items-center py-space-lg px-space-md gap-space-md">
        <div role="status" className="w-full max-w-[600px] bg-surface-container-lowest rounded-2xl shadow-xl px-space-lg py-space-md flex items-center gap-space-md">
          <span className="w-12 h-12 rounded-full bg-[#e6fbf4] text-[#047857] flex items-center justify-center shrink-0"><I n="check_circle" className="text-[28px]" /></span>
          <div className="flex-1"><h2 className="font-headline-sm text-headline-sm text-on-surface">¡Venta registrada exitosamente!</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Comprobante {v.numero} · {money(v.total)}{v.cambio != null ? ` · Cambio ${money(v.cambio)}` : ''}</p></div>
          <button type="button" aria-label="Cerrar" onClick={onNueva} className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center"><I n="close" /></button>
        </div>
        <div className="w-full max-w-[400px] bg-white rounded-lg shadow-2xl p-6 border border-neutral-200"><Ticket v={v} cfg={cfg} /></div>
        <div className="w-full max-w-[400px] grid grid-cols-2 gap-space-sm">
          <button type="button" onClick={() => imprimir(v)} className="py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md hover:bg-primary-container"><I n="print" />Imprimir (80mm)</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(textoWhatsApp(v, cfg))}`} target="_blank" rel="noopener noreferrer" className="py-3 rounded-xl bg-[#10b981] text-white font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md hover:bg-[#059669]"><I n="send_to_mobile" />Enviar WhatsApp</a>
          <button type="button" autoFocus onClick={onNueva} className="col-span-2 py-3 rounded-xl bg-surface-container-lowest border-2 border-primary-fixed text-primary font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-primary-fixed/40"><I n="add_circle" />Iniciar nueva venta (F2)</button>
        </div>
      </div>
    </div>
  )
}
