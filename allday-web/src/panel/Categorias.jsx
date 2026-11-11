import { useEffect, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useConfig } from '../config.jsx'
import { Campo, Cargando, Foto, I, ImagenInput, Modal, useToast } from '../components/ui.jsx'
import { iconoCat, OPCIONES_ICONO } from '../util.js'

export default function Categorias() {
  const { esAdmin } = useAuth()
  const { recargar } = useConfig()
  const toast = useToast()
  const [cats, setCats] = useState(null), [prods, setProds] = useState([])
  const [form, setForm] = useState(null)
  const cargar = () => { api.get('/categorias').then((r) => setCats(r.data)).catch((e) => toast(errorMsg(e), 'error')); api.get('/productos', { params: { soloActivos: false } }).then((r) => setProds(r.data)).catch(() => {}) }
  useEffect(cargar, []) // eslint-disable-line
  if (!cats) return <Cargando />
  const n = (id, f = () => true) => prods.filter((p) => p.categoriaId === id && f(p)).length

  async function guardar(e) {
    e.preventDefault()
    try { form.id ? await api.put(`/categorias/${form.id}`, form) : await api.post('/categorias', form); toast('Categoría guardada'); setForm(null); cargar(); recargar() } catch (err) { toast(errorMsg(err), 'error') }
  }
  async function eliminar(c) {
    if (!confirm(`¿Eliminar la categoría «${c.nombre}»?`)) return
    try { await api.delete(`/categorias/${c.id}`); toast('Categoría eliminada'); cargar(); recargar() } catch (err) { toast(errorMsg(err), 'error') }
  }
  return (
    <div className="px-margin-desktop py-space-lg space-y-space-lg max-w-[1600px]">
      <div className="flex items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-sm mb-1"><span className="w-8 h-8 rounded-lg bg-primary-fixed text-primary shadow-sm flex items-center justify-center"><I n="category" className="text-[20px]" /></span><span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Organización del catálogo</span></div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Categorías de la Tienda</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Líneas de negocio que se muestran en el menú de la web y en la caja. La foto es la que aparece en el inicio del catálogo.</p>
        </div>
        {esAdmin && <button type="button" onClick={() => setForm({ nombre: '', icono: 'note', imagenId: null })} className="whitespace-nowrap flex items-center gap-2 px-space-lg py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container transition-all"><I n="add_circle" />Nueva Categoría</button>}
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-space-md">
        {cats.map((c) => (
          <article key={c.id} className="group bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="relative"><Foto id={c.imagenId} alt={c.nombre} icono={iconoCat(c.icono)} className="w-full aspect-[16/10] bg-surface-container" imgClass="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <span className="absolute top-space-sm left-space-sm w-10 h-10 rounded-xl bg-surface-container-lowest/90 backdrop-blur text-primary-container flex items-center justify-center shadow-sm"><I n={iconoCat(c.icono)} /></span></div>
            <div className="p-space-md flex flex-col gap-space-sm flex-1">
              <h2 className="font-headline-sm text-headline-sm">{c.nombre}</h2>
              <div className="flex gap-space-xs flex-wrap font-label-sm text-label-sm">
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary">{n(c.id)} productos</span>
                <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/50 text-on-tertiary-fixed">{n(c.id, (p) => p.activo)} activos</span>
                {n(c.id, (p) => p.bajoMinimo && p.activo) > 0 && <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">{n(c.id, (p) => p.bajoMinimo && p.activo)} bajo stock</span>}
              </div>
              {esAdmin && <div className="mt-auto flex gap-space-xs pt-space-xs">
                <button type="button" onClick={() => setForm(c)} className="flex-1 py-2 rounded-lg bg-surface-container-low hover:bg-primary-fixed text-primary font-label-md text-label-md flex items-center justify-center gap-1"><I n="edit" className="text-[18px]" />Editar</button>
                <button type="button" aria-label="Eliminar" title={n(c.id) ? 'Tiene productos: no se puede eliminar' : 'Eliminar'} disabled={n(c.id) > 0} onClick={() => eliminar(c)} className="w-10 rounded-lg bg-surface-container-low hover:bg-error-container text-error disabled:opacity-30 flex items-center justify-center"><I n="delete" className="text-[18px]" /></button>
              </div>}
            </div>
          </article>
        ))}
      </div>
      {form && (
        <Modal titulo={form.id ? 'Editar Categoría' : 'Nueva Categoría'} subtitulo="Nombre, ícono y foto que verán los clientes" icono="category" onClose={() => setForm(null)} ancho="max-w-xl"
          pie={<><button type="button" className="btn-sec" onClick={() => setForm(null)}>Cancelar</button><button form="fcat" className="btn-pri"><I n="save" />Guardar</button></>}>
          <form id="fcat" onSubmit={guardar} className="flex flex-col gap-space-md">
            <Campo label="Nombre *"><input className="campo" required maxLength={60} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Campo>
            <div className="flex flex-col gap-space-xs"><span className="etiqueta">Ícono</span>
              <div className="flex flex-wrap gap-space-xs">{OPCIONES_ICONO.map(([k, m]) => <button key={k} type="button" onClick={() => setForm({ ...form, icono: k })} aria-label={m} className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.icono === k ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-primary-container hover:bg-primary-fixed'}`}><I n={m} /></button>)}</div></div>
            <div className="flex flex-col gap-space-xs"><span className="etiqueta">Foto de la categoría</span><ImagenInput value={form.imagenId} onChange={(id) => setForm({ ...form, imagenId: id })} /></div>
          </form>
        </Modal>
      )}
    </div>
  )
}
