import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { Campo, Cargando, Foto, I, ImagenInput, Modal, Toggle, subirImagen, useToast } from '../components/ui.jsx'
import { exportarCSV, iconoCat, money } from '../util.js'

const vacio = { nombre: '', categoriaId: '', precio: '', stock: 0, stockMinimo: 0, esServicio: false, destacado: false, activo: true, imagenId: null, codigo: '', costo: '', descripcion: '', iva: 15, galeria: [] }

function Galeria({ ids, onChange }) {
  const ref = useRef(); const toast = useToast(); const [sub, setSub] = useState(false)
  return (
    <div className="flex items-center gap-space-sm flex-wrap">
      {ids.map((id) => (
        <div key={id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface-container-low"><Foto id={id} className="w-full h-full" />
          <button type="button" aria-label="Quitar foto" onClick={() => onChange(ids.filter((x) => x !== id))} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-on-surface/70 text-white flex items-center justify-center"><I n="close" className="text-[14px]" /></button></div>
      ))}
      {ids.length < 4 && <button type="button" onClick={() => ref.current.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-outline-variant text-outline hover:bg-surface-container-low flex items-center justify-center"><I n={sub ? 'progress_activity' : 'add_photo_alternate'} className={sub ? 'animate-spin' : ''} /></button>}
      <input ref={ref} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; setSub(true); try { onChange([...ids, await subirImagen(f)]) } catch (err) { toast(err.response ? errorMsg(err) : err.message, 'error') } finally { setSub(false) } }} />
    </div>
  )
}

function FormProducto({ inicial, cats, onClose, onGuardado }) {
  const toast = useToast()
  const [f, setF] = useState(() => (inicial ? { ...vacio, ...inicial, codigo: inicial.codigo || '', costo: inicial.costo ?? '', descripcion: inicial.descripcion || '' } : { ...vacio, categoriaId: cats[0]?.id || '' }))
  const [env, setEnv] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const generar = () => { const c = cats.find((x) => x.id === Number(f.categoriaId)); const pre = (c?.nombre || 'GEN').normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3); setF({ ...f, codigo: `AD-${pre}-${String(Math.floor(Math.random() * 900) + 100)}` }) }
  const margen = Number(f.precio) > 0 && f.costo !== '' ? ((Number(f.precio) - Number(f.costo)) / Number(f.precio)) * 100 : null
  async function guardar(e) {
    e.preventDefault(); setEnv(true)
    const body = { ...f, categoriaId: Number(f.categoriaId), precio: Number(f.precio), stock: Number(f.stock) || 0, stockMinimo: Number(f.stockMinimo) || 0, costo: f.costo === '' ? null : Number(f.costo), iva: Number(f.iva), codigo: f.codigo.trim() }
    try { const { data } = inicial?.id ? await api.put(`/productos/${inicial.id}`, body) : await api.post('/productos', body); toast(inicial?.id ? 'Producto actualizado' : `Producto creado (${data.codigo})`); onGuardado() }
    catch (err) { toast(errorMsg(err), 'error') } finally { setEnv(false) }
  }
  return (
    <Modal titulo={inicial?.id ? 'Editar Producto' : 'Nuevo Producto / Detalle'} subtitulo="Información comercial, inventario y fotos para la caja y el catálogo web" icono="add_box" onClose={onClose}
      pie={<><button type="button" className="px-space-lg py-3 font-label-lg text-label-lg text-on-surface hover:underline" onClick={onClose}>Cancelar</button><button form="fprod" className="btn-pri px-space-xl" disabled={env}><I n="save" />{env ? 'Guardando…' : 'Guardar Producto'}</button></>}>
      <form id="fprod" onSubmit={guardar} className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-space-xs"><span className="etiqueta">Foto principal del producto</span><ImagenInput value={f.imagenId} onChange={set('imagenId')} /></div>
        <div className="grid grid-cols-[1fr_260px] gap-space-md">
          <Campo label="Nombre del producto *"><input className="campo" required maxLength={150} value={f.nombre} onChange={set('nombre')} placeholder="Ej.: Cuaderno universitario 100 hojas" /></Campo>
          <Campo label="Categoría *"><select className="campo" required value={f.categoriaId} onChange={set('categoriaId')}>{cats.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Campo>
        </div>
        <div className="grid grid-cols-4 gap-space-md">
          <Campo label="Precio de venta *"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant">$</span><input className="campo pl-7 font-headline-sm tabular" type="number" required min="0.01" step="0.01" value={f.precio} onChange={set('precio')} /></div></Campo>
          <Campo label="Costo" extra={margen !== null && <span className={`font-label-sm text-label-sm normal-case ${margen < 0 ? 'text-error' : 'text-tertiary'}`}>Margen {margen.toFixed(0)}%</span>}><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant">$</span><input className="campo pl-7 tabular" type="number" min="0" step="0.01" value={f.costo} onChange={set('costo')} placeholder="Opcional" /></div></Campo>
          <Campo label="IVA"><select className="campo" value={f.iva} onChange={set('iva')}><option value={15}>15 %</option><option value={5}>5 %</option><option value={0}>0 %</option></select></Campo>
          <Campo label="Código / SKU" extra={<button type="button" onClick={generar} className="font-label-sm text-label-sm text-primary normal-case hover:underline">Generar</button>}><input className="campo font-mono uppercase" maxLength={40} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} placeholder="Auto o lector" /></Campo>
        </div>
        <div className="flex items-center gap-space-md bg-surface-container-low rounded-xl p-space-md">
          <span className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center"><I n="construction" /></span>
          <div className="flex-1"><p className="font-label-lg text-label-lg">Es un servicio (no maneja stock)</p><p className="font-body-sm text-body-sm text-on-surface-variant">Para copias, impresiones, fotos o armado artesanal.</p></div>
          <Toggle checked={f.esServicio} onChange={set('esServicio')} label="Es servicio" color="bg-tertiary" />
        </div>
        {!f.esServicio && (
          <div className="grid grid-cols-2 gap-space-md">
            <Campo label="Stock actual disponible" extra={<span className="font-label-sm text-label-sm text-tertiary normal-case">{inicial?.id ? 'Un cambio queda en el kárdex' : 'Unidades físicas'}</span>}><input className="campo font-headline-sm tabular" type="number" min="0" required value={f.stock} onChange={set('stock')} /></Campo>
            <Campo label="Stock mínimo de alerta" extra={<span className="font-label-sm text-label-sm text-secondary normal-case">Aviso de reposición</span>}><input className="campo font-headline-sm tabular" type="number" min="0" required value={f.stockMinimo} onChange={set('stockMinimo')} /></Campo>
          </div>
        )}
        <Campo label="Descripción para el catálogo web" extra={<span className="font-label-sm text-label-sm text-outline normal-case">{f.descripcion.length}/2000</span>}><textarea className="campo" rows={3} maxLength={2000} value={f.descripcion} onChange={set('descripcion')} placeholder="Medidas, materiales, colores disponibles, qué incluye…" /></Campo>
        <div className="flex flex-col gap-space-xs"><span className="etiqueta">Fotos adicionales (galería, máx. 4)</span><Galeria ids={f.galeria || []} onChange={set('galeria')} /></div>
        <div className="grid grid-cols-2 gap-space-md">
          <div className="flex items-center gap-space-sm bg-surface-container-low rounded-xl p-space-md"><I n="star" className="text-primary" /><div className="flex-1"><p className="font-label-md text-label-md">Mostrar en Destacados</p><p className="font-body-sm text-body-sm text-on-surface-variant">Aparece en el inicio de la web</p></div><Toggle checked={f.destacado} onChange={set('destacado')} label="Destacado" /></div>
          <div className="flex items-center gap-space-sm bg-surface-container-low rounded-xl p-space-md"><I n="check_circle" className="text-tertiary" /><div className="flex-1"><p className="font-label-md text-label-md">Producto activo</p><p className="font-body-sm text-body-sm text-on-surface-variant">Visible en caja y catálogo web</p></div><Toggle checked={f.activo} onChange={set('activo')} label="Activo" color="bg-tertiary" /></div>
        </div>
      </form>
    </Modal>
  )
}

/** Lee un CSV (separado por ; o ,) con encabezados. */
function leerCSV(texto) {
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  const sep = (lineas[0].match(/;/g) || []).length >= (lineas[0].match(/,/g) || []).length ? ';' : ','
  const cab = lineas[0].split(sep).map((h) => h.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
  return lineas.slice(1).map((l) => Object.fromEntries(l.split(sep).map((v, i) => [cab[i], v.trim().replace(/^"|"$/g, '')])))
}

export default function Productos() {
  const { esAdmin } = useAuth()
  const toast = useToast()
  const [sp] = useSearchParams()
  const [lista, setLista] = useState(null), [cats, setCats] = useState([])
  const [q, setQ] = useState(sp.get('q') || ''), [cat, setCat] = useState(null), [est, setEst] = useState(''), [tipo, setTipo] = useState('')
  const [form, setForm] = useState(null), [pag, setPag] = useState(1)
  const [importando, setImportando] = useState(null)
  const archivo = useRef()
  const cargar = () => api.get('/productos', { params: { soloActivos: false } }).then((r) => setLista(r.data)).catch((e) => { toast(errorMsg(e), 'error'); setLista([]) })
  useEffect(() => { cargar(); api.get('/categorias').then((r) => setCats(r.data)).catch(() => {}) }, []) // eslint-disable-line
  useEffect(() => { setQ(sp.get('q') || '') }, [sp])
  useEffect(() => setPag(1), [q, cat, est, tipo])

  const filtrada = useMemo(() => (lista || []).filter((p) => {
    const t = q.trim().toLowerCase()
    return (!t || p.nombre.toLowerCase().includes(t) || (p.codigo || '').toLowerCase().includes(t)) && (!cat || p.categoriaId === cat) &&
      (!est || (est === 'activos' ? p.activo : est === 'inactivos' ? !p.activo : est === 'bajo' ? p.bajoMinimo && p.activo : p.destacado)) &&
      (!tipo || (tipo === 'servicio') === p.esServicio)
  }), [lista, q, cat, est, tipo])
  if (!lista) return <Cargando />
  const POR = 12, paginas = Math.max(1, Math.ceil(filtrada.length / POR)), vis = filtrada.slice((pag - 1) * POR, pag * POR)

  async function cambiarActivo(p) {
    try { await api.put(`/productos/${p.id}`, { ...p, activo: !p.activo }); toast(p.activo ? 'Producto desactivado (no se muestra en caja ni web)' : 'Producto activado'); cargar() } catch (e) { toast(errorMsg(e), 'error') }
  }
  const exportar = () => exportarCSV('productos-allday.csv', [['nombre', 'categoria', 'precio', 'costo', 'iva', 'stock', 'stockMinimo', 'codigo', 'servicio', 'destacado', 'activo', 'descripcion'],
    ...lista.map((p) => [p.nombre, p.categoria, p.precio, p.costo ?? '', p.iva, p.stock, p.stockMinimo, p.codigo || '', p.esServicio ? 'si' : 'no', p.destacado ? 'si' : 'no', p.activo ? 'si' : 'no', p.descripcion || ''])])
  const plantilla = () => exportarCSV('plantilla-productos.csv', [['nombre', 'categoria', 'precio', 'costo', 'iva', 'stock', 'stockMinimo', 'codigo', 'servicio', 'destacado', 'descripcion']])
  async function importar(file) {
    const filas = leerCSV(await file.text())
    if (!filas.length) { toast('El archivo no tiene filas', 'error'); return }
    const errores = []; let ok = 0
    setImportando({ total: filas.length, hechos: 0 })
    for (const [i, r] of filas.entries()) {
      const c = cats.find((x) => x.nombre.toLowerCase() === (r.categoria || '').toLowerCase())
      const si = (v) => /^(si|sí|true|1|x)$/i.test(v || '')
      try {
        if (!c) throw new Error(`categoría «${r.categoria}» no existe`)
        await api.post('/productos', { nombre: r.nombre, categoriaId: c.id, precio: Number(String(r.precio).replace(',', '.')), costo: r.costo ? Number(String(r.costo).replace(',', '.')) : null, iva: r.iva ? Number(r.iva) : 15, stock: Number(r.stock) || 0, stockMinimo: Number(r.stockminimo) || 0, codigo: r.codigo || '', esServicio: si(r.servicio), destacado: si(r.destacado), activo: true, descripcion: r.descripcion || '' })
        ok++
      } catch (e) { errores.push(`Fila ${i + 2}: ${e.response ? errorMsg(e) : e.message}`) }
      setImportando({ total: filas.length, hechos: i + 1 })
    }
    setImportando({ total: filas.length, hechos: filas.length, ok, errores }); cargar()
  }
  const kpis = [['Total catálogo', lista.length, 'Productos y servicios', 'inventory_2', 'bg-primary-fixed text-primary'], ['Activos en web y caja', lista.filter((p) => p.activo).length, `${lista.filter((p) => !p.activo).length} inactivos`, 'storefront', 'bg-tertiary-fixed/60 text-tertiary'],
    ['Bajo stock', lista.filter((p) => p.bajoMinimo && p.activo).length, 'Requieren reposición', 'warning', 'bg-secondary-fixed text-secondary'], ['Destacados web', lista.filter((p) => p.destacado && p.activo).length, 'Se muestran en el inicio', 'star', 'bg-primary-container text-on-primary']]

  return (
    <div className="px-margin-desktop py-space-lg space-y-space-lg max-w-[1600px] relative">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
        <div>
          <div className="flex items-center gap-space-sm mb-1"><span className="w-8 h-8 rounded-lg bg-primary-fixed text-primary shadow-sm flex items-center justify-center"><I n="palette" className="text-[20px]" /></span><span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Inventario &amp; Mostrador</span></div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Catálogo de Productos y Servicios</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Artículos de mostrador, papelería, bazar y servicios. Lo que registre aquí aparece en la caja y en la web.</p>
        </div>
        {esAdmin && (
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center bg-surface-container-lowest rounded-xl p-1 shadow-sm">
              <button type="button" onClick={exportar} className="flex items-center gap-1.5 px-space-md py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md"><I n="file_download" className="text-[18px] text-tertiary" />Exportar</button>
              <button type="button" onClick={() => setImportando({ abierto: true })} className="flex items-center gap-1.5 px-space-md py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md"><I n="file_upload" className="text-[18px] text-primary" />Importar</button>
            </div>
            <button type="button" onClick={() => setForm({})} className="whitespace-nowrap flex items-center gap-2 px-space-lg py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container hover:-translate-y-0.5 transition-all"><I n="add_circle" className="text-[20px]" />Nuevo Producto</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-space-md">
        {kpis.map(([t, v, s, i, c]) => (
          <div key={t} className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
            <div className="flex flex-col z-10"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">{t}</span><span className="font-headline-md text-headline-md mt-1 tabular">{v}</span><span className="font-body-sm text-body-sm text-on-surface-variant">{s}</span></div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center z-10 shadow-sm ${c}`}><I n={i} /></div>
          </div>
        ))}
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center gap-space-md">
          <div className="flex-1 relative"><I n="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px]" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" placeholder="Buscar por nombre o código / escanear con el lector…" className="w-full h-12 pl-12 pr-10 rounded-xl bg-surface-container-low placeholder:text-outline font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary-container/30" /><I n="barcode_scanner" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" /></div>
          <label className="flex items-center gap-1.5 bg-surface-container-low px-3 py-2 rounded-xl"><I n="filter_list" className="text-[18px] text-on-surface-variant" /><span className="font-label-sm text-label-sm text-on-surface-variant">Estado:</span><select value={est} onChange={(e) => setEst(e.target.value)} className="bg-transparent font-label-md text-label-md outline-none"><option value="">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option><option value="bajo">Bajo stock</option><option value="destacados">Destacados</option></select></label>
          <label className="flex items-center gap-1.5 bg-surface-container-low px-3 py-2 rounded-xl"><I n="category" className="text-[18px] text-on-surface-variant" /><span className="font-label-sm text-label-sm text-on-surface-variant">Tipo:</span><select value={tipo} onChange={(e) => setTipo(e.target.value)} className="bg-transparent font-label-md text-label-md outline-none"><option value="">Todos</option><option value="producto">Productos</option><option value="servicio">Servicios</option></select></label>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button type="button" onClick={() => setCat(null)} className={`px-space-md py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap ${!cat ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container'}`}>Todas ({lista.length})</button>
          {cats.map((c) => <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`px-space-md py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap ${cat === c.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container'}`}>{c.nombre} ({lista.filter((p) => p.categoriaId === c.id).length})</button>)}
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider"><th className="py-3.5 pl-6 pr-3 w-16 text-center">Foto</th><th className="py-3.5 px-4">Producto &amp; código</th><th className="py-3.5 px-4">Categoría</th><th className="py-3.5 px-4 text-right">PVP (USD)</th><th className="py-3.5 px-4 text-center">Stock</th><th className="py-3.5 px-4 text-center">Estado</th>{esAdmin && <th className="py-3.5 pl-3 pr-6 text-right">Acciones</th>}</tr></thead>
          <tbody className="divide-y divide-surface-container-high/40 font-body-md text-body-md">
            {vis.length === 0 ? <tr><td colSpan={7} className="py-space-xl text-center text-outline">{lista.length ? 'Ningún producto coincide con los filtros.' : 'Aún no hay productos. Use «Nuevo Producto» o «Importar» para cargar el inventario real del local.'}</td></tr> : vis.map((p) => {
              const st = p.esServicio ? ['bg-primary-fixed text-primary', 'bg-primary', 'Servicio'] : p.stock === 0 ? ['bg-surface-container-high text-on-surface-variant', 'bg-outline', '0 un. (Agotado)'] : p.bajoMinimo ? ['bg-secondary-fixed text-on-secondary-fixed', 'bg-secondary', `${p.stock} un. (Bajo)`] : ['bg-tertiary-fixed/50 text-on-tertiary-fixed', 'bg-tertiary', `${p.stock} un.`]
              return (
                <tr key={p.id} className={`hover:bg-surface-container-low/40 transition-colors group ${p.activo ? '' : 'opacity-70'}`}>
                  <td className="py-3.5 pl-6 pr-3"><div className="relative w-12 h-12"><Foto id={p.imagenId} icono={iconoCat(p.icono)} className={`w-12 h-12 rounded-xl bg-surface-container-high shadow-inner ${p.activo ? '' : 'grayscale'}`} imgClass="w-full h-full object-cover group-hover:scale-105 transition-transform" />{!p.activo && <span className="absolute inset-0 bg-surface/60 rounded-xl flex items-center justify-center"><I n="block" className="text-[18px] text-outline" /></span>}</div></td>
                  <td className="py-3.5 px-4"><div className="flex flex-col"><div className="flex items-center gap-1.5"><span className={`font-label-lg text-label-lg font-bold ${p.activo ? '' : 'line-through'}`}>{p.nombre}</span>{p.destacado && <I n="star" fill className="text-[16px] text-secondary-container" />}</div>
                    <div className="flex items-center gap-2 mt-0.5 font-body-sm text-body-sm text-on-surface-variant"><span className="font-mono">{p.codigo ? `SKU: ${p.codigo}` : 'Sin código'}</span><span className="w-1 h-1 rounded-full bg-outline-variant" /><span>IVA {p.iva}%</span>{p.costo != null && <><span className="w-1 h-1 rounded-full bg-outline-variant" /><span>Costo {money(p.costo)}</span></>}</div></div></td>
                  <td className="py-3.5 px-4"><span className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant"><I n={iconoCat(p.icono)} className="text-[16px] text-primary-container" />{p.categoria}</span></td>
                  <td className="py-3.5 px-4 text-right"><span className="font-headline-sm text-headline-sm font-bold font-mono">{money(p.precio)}</span></td>
                  <td className="py-3.5 px-4 text-center"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold whitespace-nowrap ${st[0]}`}><span className={`w-2 h-2 rounded-full ${st[1]}`} />{st[2]}</span></td>
                  <td className="py-3.5 px-4 text-center">{p.activo ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-sm text-label-sm"><I n="visibility" className="text-[14px]" />Visible</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm"><I n="visibility_off" className="text-[14px]" />Inactivo</span>}</td>
                  {esAdmin && <td className="py-3.5 pl-3 pr-6 text-right"><div className="inline-flex items-center gap-1">
                    <button type="button" title="Editar" aria-label="Editar" onClick={() => setForm(p)} className="p-2 rounded-lg text-primary hover:bg-primary-fixed/50"><I n="edit" className="text-[18px]" /></button>
                    <button type="button" title="Duplicar" aria-label="Duplicar" onClick={() => setForm({ ...p, id: undefined, codigo: '', nombre: `${p.nombre} (copia)`, stock: 0 })} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"><I n="content_copy" className="text-[18px]" /></button>
                    <button type="button" title={p.activo ? 'Desactivar' : 'Activar'} aria-label={p.activo ? 'Desactivar' : 'Activar'} onClick={() => cambiarActivo(p)} className={`p-2 rounded-lg hover:bg-surface-container ${p.activo ? 'text-on-surface-variant' : 'text-tertiary'}`}><I n={p.activo ? 'toggle_on' : 'toggle_off'} className="text-[18px]" /></button>
                  </div></td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="p-space-md flex items-center justify-between gap-space-md border-t border-surface-container-high/40">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Mostrando <b className="text-on-surface">{filtrada.length ? (pag - 1) * POR + 1 : 0} - {Math.min(pag * POR, filtrada.length)}</b> de <b className="text-on-surface">{filtrada.length}</b> productos</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={pag === 1} onClick={() => setPag(1)} aria-label="Primera" className="p-2 rounded-xl text-outline hover:bg-surface-container disabled:opacity-40"><I n="first_page" className="text-[18px]" /></button>
            {Array.from({ length: paginas }, (_, i) => i + 1).filter((n) => Math.abs(n - pag) < 3 || n === paginas).map((n) => <button key={n} type="button" onClick={() => setPag(n)} className={`w-8 h-8 rounded-xl font-label-md text-label-md ${n === pag ? 'bg-primary text-on-primary font-bold shadow-sm' : 'hover:bg-surface-container'}`}>{n}</button>)}
            <button type="button" disabled={pag === paginas} onClick={() => setPag(paginas)} aria-label="Última" className="p-2 rounded-xl text-on-surface hover:bg-surface-container disabled:opacity-40"><I n="last_page" className="text-[18px]" /></button>
          </div>
        </div>
      </div>
      <div className="bg-tertiary-container/10 rounded-2xl p-space-lg flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md"><span className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary flex items-center justify-center"><I n="sync" /></span><div><h3 className="font-headline-sm text-headline-sm">Sincronización con la tienda web y WhatsApp</h3><p className="font-body-sm text-body-sm text-on-surface-variant">Los productos activos aparecen al instante en el catálogo público con su botón «Consultar por WhatsApp». El stock exacto nunca se muestra al público.</p></div></div>
        <span className="flex items-center gap-1 font-label-sm text-label-sm text-tertiary shrink-0"><span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />Catálogo en línea</span>
      </div>

      {form && <FormProducto inicial={form.nombre !== undefined ? form : null} cats={cats} onClose={() => setForm(null)} onGuardado={() => { setForm(null); cargar() }} />}
      {importando && (
        <Modal titulo="Importar productos desde Excel" subtitulo="Archivo CSV (Excel → Guardar como → CSV UTF-8)" icono="file_upload" onClose={() => setImportando(null)} ancho="max-w-lg"
          pie={<button type="button" className="btn-sec" onClick={() => setImportando(null)}>Cerrar</button>}>
          {importando.abierto ? (
            <div className="flex flex-col gap-space-md">
              <ol className="list-decimal pl-5 font-body-md text-body-md text-on-surface-variant space-y-1"><li>Descargue la plantilla y llénela en Excel (una fila por producto).</li><li>La columna <b>categoria</b> debe coincidir con una categoría existente.</li><li>Guarde como CSV y súbalo aquí.</li></ol>
              <div className="flex gap-space-sm"><button type="button" className="btn-sec" onClick={plantilla}><I n="download" />Descargar plantilla</button><button type="button" className="btn-pri" onClick={() => archivo.current.click()}><I n="upload_file" />Elegir archivo CSV</button></div>
              <input ref={archivo} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importar(f) }} />
            </div>
          ) : (
            <div className="flex flex-col gap-space-sm">
              <div className="h-2 rounded-full bg-surface-container overflow-hidden"><div className="h-full bg-primary-container transition-all" style={{ width: `${(importando.hechos / importando.total) * 100}%` }} /></div>
              <p className="font-label-lg text-label-lg">{importando.hechos} de {importando.total} filas procesadas{importando.ok !== undefined && ` · ${importando.ok} productos creados`}</p>
              {importando.errores?.length > 0 && <div className="max-h-48 overflow-y-auto bg-error-container/40 rounded-lg p-space-sm font-body-sm text-body-sm text-on-error-container">{importando.errores.map((e) => <div key={e}>{e}</div>)}</div>}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
