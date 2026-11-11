import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { Campo, Cargando, I, ImagenInput, Modal, useToast } from '../components/ui.jsx'
import { AvisoPrivacidad } from '../components/Privacidad.jsx'
import { diaRelativo, difDias, hoyISO, linkWhatsApp, money, SIGUIENTE, telBonito, telInternacional, TIPOS_PEDIDO } from '../util.js'

const COLS = [
  { k: 'RECIBIDO', t: 'Recibido', dot: 'bg-secondary-container', btn: ['Empezar preparación', 'arrow_forward', 'bg-primary-container hover:bg-primary text-on-primary'] },
  { k: 'EN_PREPARACION', t: 'En preparación', dot: 'bg-primary-container', btn: ['Marcar listo', 'check', 'bg-tertiary hover:bg-tertiary-container text-on-tertiary'] },
  { k: 'LISTO', t: 'Listo para retirar', dot: 'bg-tertiary', btn: ['Entregado', 'task_alt', 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container'] },
  { k: 'ENTREGADO', t: 'Entregados', dot: 'bg-outline' },
]
const TIPO_CHIP = { 'Detalle o arreglo': 'bg-primary-fixed text-primary', 'Impresión de fotos': 'bg-tertiary-fixed/60 text-on-tertiary-fixed', 'Impresión de documentos': 'bg-surface-container-high text-on-surface', 'Decoración para fiesta': 'bg-secondary-fixed text-on-secondary-fixed' }
const vacio = { cliente: '', telefono: '', tipo: TIPOS_PEDIDO[0], descripcion: '', fechaEntrega: hoyISO(), total: '', montoAnticipo: '', responsable: '', imagenId: null }

function FormPedido({ inicial, onClose, onGuardado }) {
  const toast = useToast()
  const [f, setF] = useState(inicial ? { ...inicial, total: inicial.total ?? '', montoAnticipo: inicial.montoAnticipo ?? '', responsable: inicial.responsable || '' } : vacio)
  const [acepta, setAcepta] = useState(!!inicial), [ver, setVer] = useState(false), [env, setEnv] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target ? e.target.value : e })
  const saldo = Math.max(0, (Number(f.total) || 0) - (Number(f.montoAnticipo) || 0))
  async function guardar(e) {
    e.preventDefault(); setEnv(true)
    const body = { ...f, total: f.total === '' ? null : Number(f.total), montoAnticipo: f.montoAnticipo === '' ? 0 : Number(f.montoAnticipo), aceptaPrivacidad: acepta }
    try { const { data } = inicial ? await api.put(`/pedidos/${inicial.id}`, body) : await api.post('/pedidos', body); toast(inicial ? 'Pedido actualizado' : `Pedido ${data.codigo} registrado`); onGuardado(data) }
    catch (err) { toast(errorMsg(err), 'error') } finally { setEnv(false) }
  }
  return (
    <Modal titulo={inicial ? `Editar pedido ${inicial.codigo}` : 'Nuevo Pedido / Encargo'} subtitulo="Registre el encargo; el cliente podrá seguirlo con su código en la web" icono="add_shopping_cart" onClose={onClose}
      pie={<><button type="button" className="btn-sec" onClick={onClose}>Cancelar</button><button form="fped" className="btn-pri" disabled={env || !acepta}><I n="save" />{env ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Registrar pedido'}</button></>}>
      <form id="fped" onSubmit={guardar} className="grid grid-cols-2 gap-space-md">
        <Campo label="Cliente *"><input className="campo" required maxLength={100} value={f.cliente} onChange={set('cliente')} placeholder="Nombre y apellido" /></Campo>
        <Campo label="Teléfono / WhatsApp *"><input className="campo" required inputMode="tel" pattern="[0-9 +]{7,20}" value={f.telefono} onChange={set('telefono')} placeholder="09XXXXXXXX" /></Campo>
        <Campo label="Tipo de encargo *"><select className="campo" value={f.tipo} onChange={set('tipo')}>{TIPOS_PEDIDO.map((t) => <option key={t}>{t}</option>)}</select></Campo>
        <Campo label="Fecha de entrega *"><input type="date" className="campo" required min={inicial ? undefined : hoyISO()} value={f.fechaEntrega} onChange={set('fechaEntrega')} /></Campo>
        <Campo label="Detalle del encargo *" className="col-span-2"><textarea className="campo" required rows={3} maxLength={1000} value={f.descripcion} onChange={set('descripcion')} placeholder="Ej.: caja sorpresa con 12 fotos, lazo morado, tarjeta «Feliz cumpleaños»" /></Campo>
        <Campo label="Valor total ($)" extra={<span className="font-label-sm text-label-sm text-outline normal-case">Opcional</span>}><input className="campo tabular" type="number" min="0" step="0.01" value={f.total} onChange={set('total')} placeholder="0.00" /></Campo>
        <Campo label="Anticipo recibido ($)"><input className="campo tabular" type="number" min="0" step="0.01" max={f.total || undefined} value={f.montoAnticipo} onChange={set('montoAnticipo')} placeholder="0.00" /></Campo>
        <div className="col-span-2 flex items-center justify-between bg-surface-container-low rounded-xl px-space-md py-space-sm"><span className="font-label-md text-label-md text-on-surface-variant">Saldo a cobrar al retirar</span><span className="font-headline-sm text-headline-sm text-primary tabular">{money(saldo)}</span></div>
        <Campo label="Responsable en taller" extra={<span className="font-label-sm text-label-sm text-outline normal-case">Opcional</span>}><input className="campo" maxLength={100} value={f.responsable} onChange={set('responsable')} placeholder="Quién lo prepara" /></Campo>
        <div className="flex flex-col gap-space-xs"><span className="etiqueta">Foto del encargo (opcional)</span><ImagenInput value={f.imagenId} onChange={(id) => setF({ ...f, imagenId: id })} texto="Foto de referencia o del trabajo" /></div>
        {!inicial && (
          <label className="col-span-2 flex items-start gap-space-sm bg-primary-fixed/30 rounded-xl p-space-sm font-body-sm text-body-sm text-on-surface cursor-pointer">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
            <span>El cliente autoriza que ALL DAY use su nombre y teléfono solo para gestionar este pedido y avisarle cuando esté listo (<button type="button" className="text-primary underline" onClick={() => setVer(true)}>aviso de privacidad</button>).</span>
          </label>
        )}
      </form>
      {ver && <AvisoPrivacidad onClose={() => setVer(false)} />}
    </Modal>
  )
}

function Tarjeta({ p, onAvanzar, onEditar, onAbono, onAnular, esAdmin }) {
  const d = difDias(p.fechaEntrega), activo = p.estado !== 'ENTREGADO'
  const col = COLS.find((c) => c.k === p.estado)
  const total = Number(p.total), pagado = Number(p.montoAnticipo), saldo = Number(p.saldo)
  const chipFecha = !activo ? 'bg-surface-container text-on-surface-variant' : d < 0 ? 'bg-error text-on-error' : d === 0 ? 'bg-error-container text-on-error-container' : d === 1 ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container-low text-on-surface-variant'
  const wa = (t) => linkWhatsApp(telInternacional(p.telefono), t)
  return (
    <article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all flex flex-col gap-space-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="font-label-lg text-label-lg text-primary font-mono">{p.codigo}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-label-sm text-label-sm ${chipFecha}`}><I n={d < 0 && activo ? 'warning' : p.estado === 'LISTO' ? 'done_all' : 'schedule'} className="text-[14px]" />{activo ? (d < 0 ? `Atrasado · ${diaRelativo(p.fechaEntrega)}` : diaRelativo(p.fechaEntrega)) : diaRelativo(p.historial.at(-1)?.fecha?.slice(0, 10) || p.fechaEntrega)}</span>
      </div>
      <span className={`w-fit px-2 py-0.5 rounded-md font-label-sm text-label-sm ${TIPO_CHIP[p.tipo] || 'bg-surface-container text-on-surface'}`}>{p.tipo}</span>
      <div><div className="flex items-center justify-between gap-1"><h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight">{p.cliente}</h3>
        <a href={wa(`Hola ${p.cliente.split(' ')[0]}, te escribimos de ALL DAY sobre tu pedido ${p.codigo}.`)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-primary hover:text-primary-container"><I n="chat" className="text-[20px]" /></a></div>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{telBonito(p.telefono)}{p.responsable ? ` · ${p.responsable}` : ''}</span></div>
      <p className="bg-surface-container-low rounded-lg p-space-sm font-body-sm text-body-sm text-on-surface-variant whitespace-pre-line line-clamp-5">{p.descripcion}</p>
      {total > 0 && (activo ? (
        <div className="flex items-center justify-between gap-2 font-body-sm text-body-sm">
          <div><span className="text-on-surface-variant">Anticipo:</span><br /><span className="tabular">{money(pagado)} de {money(total)}</span>{saldo > 0 && <><br /><span className="text-error font-bold">Saldo: {money(saldo)}</span></>}</div>
          <span className={`px-2 py-1 rounded-md font-label-sm text-label-sm text-center ${saldo === 0 ? 'bg-tertiary-fixed/60 text-on-tertiary-fixed' : pagado > 0 ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>{saldo === 0 ? 'Pagado' : pagado > 0 ? 'Anticipo pagado' : 'Pendiente cobro'}</span>
        </div>
      ) : <div className="flex items-center justify-between bg-tertiary-fixed/30 rounded-lg px-space-sm py-1.5 font-label-sm text-label-sm text-tertiary"><span>{saldo === 0 ? `Cobrado 100% (${money(total)})` : `Saldo pendiente ${money(saldo)}`}</span><I n={saldo === 0 ? 'check' : 'warning'} className="text-[16px]" /></div>)}
      {p.estado === 'LISTO' && <a href={wa(`Hola ${p.cliente.split(' ')[0]} 👋, tu pedido ${p.codigo} de ALL DAY ya está listo para retirar.${saldo > 0 ? ` Saldo a cancelar: ${money(saldo)}.` : ''} ¡Te esperamos!`)} target="_blank" rel="noopener noreferrer" className="btn-wa py-2 font-label-md text-label-md"><I n="send" className="text-[18px]" />Avisar por WhatsApp</a>}
      <div className="flex items-center gap-space-xs">
        {col?.btn && <button type="button" onClick={() => onAvanzar(p)} className={`flex-1 py-2 px-space-sm rounded-lg font-label-md text-label-md flex items-center justify-center gap-1 transition-colors ${col.btn[2]}`}>{col.btn[0]}<I n={col.btn[1]} className="text-[18px]" /></button>}
        {activo && (
          <details className="relative">
            <summary aria-label="Más opciones" className="list-none w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container-high flex items-center justify-center cursor-pointer"><I n="tune" className="text-[18px]" /></summary>
            <div className="absolute right-0 bottom-11 z-20 w-48 bg-surface-container-lowest rounded-xl shadow-xl p-1 flex flex-col">
              <button type="button" onClick={() => onEditar(p)} className="text-left px-space-sm py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2"><I n="edit" className="text-[18px]" />Editar</button>
              {total > 0 && saldo > 0 && <button type="button" onClick={() => onAbono(p)} className="text-left px-space-sm py-2 rounded-lg hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2"><I n="payments" className="text-[18px]" />Registrar abono</button>}
              {esAdmin && <button type="button" onClick={() => onAnular(p)} className="text-left px-space-sm py-2 rounded-lg hover:bg-error-container text-error font-label-md text-label-md flex items-center gap-2"><I n="block" className="text-[18px]" />Anular</button>}
            </div>
          </details>
        )}
      </div>
    </article>
  )
}

export default function Pedidos() {
  const { esAdmin } = useAuth()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const [activos, setActivos] = useState(null), [entregados, setEntregados] = useState([])
  const [tipo, setTipo] = useState(''), [q, setQ] = useState(sp.get('q') || '')
  const [form, setForm] = useState(sp.get('nuevo') ? 'nuevo' : null)
  const [abono, setAbono] = useState(null), [monto, setMonto] = useState('')
  const [cobrarEntrega, setCobrarEntrega] = useState(null)
  const cargar = () => {
    api.get('/pedidos').then((r) => setActivos(r.data)).catch((e) => { toast(errorMsg(e), 'error'); setActivos([]) })
    api.get('/pedidos/entregados').then((r) => setEntregados(r.data)).catch(() => {})
  }
  useEffect(cargar, []) // eslint-disable-line
  useEffect(() => { if (sp.get('nuevo')) { setForm('nuevo'); sp.delete('nuevo'); setSp(sp, { replace: true }) } }, [sp]) // eslint-disable-line
  useEffect(() => { if (sp.get('q')) setQ(sp.get('q')) }, [sp])

  const todos = useMemo(() => [...(activos || []), ...entregados], [activos, entregados])
  const filtrar = (l) => l.filter((p) => (!tipo || p.tipo === tipo) && (!q.trim() || `${p.codigo} ${p.cliente} ${p.telefono} ${p.descripcion}`.toLowerCase().includes(q.trim().toLowerCase())))
  if (!activos) return <Cargando />

  async function cambiar(p, estado) {
    try { await api.patch(`/pedidos/${p.id}/estado`, { estado }); toast(`${p.codigo}: ${estado === 'ANULADO' ? 'anulado' : 'estado actualizado'}`); cargar() } catch (e) { toast(errorMsg(e), 'error') }
  }
  const avanzar = (p) => { if (p.estado === 'LISTO' && Number(p.saldo) > 0) setCobrarEntrega(p); else cambiar(p, SIGUIENTE[p.estado]) }
  async function registrarAbono(p, m, luego) {
    try { await api.post(`/pedidos/${p.id}/pagos`, { monto: Number(m) }); if (luego) await api.patch(`/pedidos/${p.id}/estado`, { estado: 'ENTREGADO' }); toast(luego ? `${p.codigo} entregado y cobrado` : 'Abono registrado'); setAbono(null); setCobrarEntrega(null); setMonto(''); cargar() }
    catch (e) { toast(errorMsg(e), 'error') }
  }
  const saldos = (activos || []).reduce((s, p) => s + Number(p.saldo || 0), 0)
  const urgentes = (activos || []).filter((p) => p.estado !== 'LISTO' && difDias(p.fechaEntrega) <= 0).length
  const enCurso = activos.filter((p) => p.estado !== 'LISTO').length

  return (
    <div className="px-margin-desktop py-space-md space-y-space-lg max-w-[1600px]">
      <div className="bg-primary-fixed/40 rounded-xl px-space-md py-2.5 flex items-center justify-between font-label-md text-label-md">
        <span className="flex items-center gap-space-xs text-primary"><I n="storefront" className="text-[18px]" />Encargos para retiro en el local · el cliente sigue el estado con su código en la web</span>
        <span className="flex items-center gap-space-xs text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-secondary-container" />{enCurso} en curso · {activos.length - enCurso} listos · {entregados.filter((p) => difDias(p.historial.at(-1).fecha.slice(0, 10)) === 0).length} entregados hoy</span>
      </div>
      <div className="flex items-end justify-between gap-space-md">
        <div><h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight flex items-center gap-space-sm"><span className="w-1.5 h-8 rounded-full bg-primary-container" />Gestión de Pedidos y Taller</h1><p className="font-body-md text-body-md text-on-surface-variant">Tablero de encargos y trabajos personalizados.</p></div>
        <button type="button" onClick={() => setForm('nuevo')} className="btn-pri"><I n="add" />Nuevo Pedido</button>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl p-space-sm shadow-sm flex items-center gap-space-sm overflow-x-auto no-scrollbar">
        <div className="relative shrink-0 w-64"><I n="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedido" placeholder="Buscar código, cliente, teléfono…" className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface-container-low font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary-container/30" /></div>
        <button type="button" onClick={() => setTipo('')} className={`px-space-md py-2 rounded-full font-label-md text-label-md shrink-0 ${!tipo ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container-high'}`}>Todos ({todos.length})</button>
        {TIPOS_PEDIDO.map((t) => <button key={t} type="button" onClick={() => setTipo(t)} className={`px-space-md py-2 rounded-full font-label-md text-label-md shrink-0 ${tipo === t ? 'bg-primary text-on-primary' : 'bg-surface-container-low hover:bg-surface-container-high'}`}>{t} ({todos.filter((p) => p.tipo === t).length})</button>)}
      </div>
      <div className="grid grid-cols-4 gap-space-md items-start">
        {COLS.map((c) => {
          const l = filtrar(c.k === 'ENTREGADO' ? entregados : activos.filter((p) => p.estado === c.k))
          return (
            <section key={c.k} className="bg-surface-container-low rounded-2xl p-space-sm flex flex-col gap-space-sm min-h-[300px]">
              <div className="flex items-center justify-between px-space-xs py-space-xs"><h2 className="flex items-center gap-space-xs font-headline-sm text-headline-sm"><span className={`w-3 h-3 rounded-full ${c.dot}`} />{c.t}</h2><span className="px-2 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-primary">{l.length}</span></div>
              {l.length === 0 ? <p className="text-center font-body-sm text-body-sm text-outline py-space-lg">Sin pedidos</p> : l.map((p) => <Tarjeta key={p.id} p={p} esAdmin={esAdmin} onAvanzar={avanzar} onEditar={(x) => setForm(x)} onAbono={(x) => { setAbono(x); setMonto(String(x.saldo)) }} onAnular={(x) => { if (confirm(`¿Anular el pedido ${x.codigo}? Esta acción no se puede deshacer.`)) cambiar(x, 'ANULADO') }} />)}
            </section>
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-space-md">
        {[['palette', 'bg-primary-fixed text-primary-container', `${enCurso} encargos`, 'Activos en la mesa de trabajo'], ['payments', 'bg-secondary-fixed text-secondary', money(saldos), 'Saldos pendientes por cobrar en mostrador'], ['timer', 'bg-tertiary-fixed/60 text-tertiary', `${urgentes} urgencias`, 'Con entrega hoy o atrasados']].map(([i, c, t, s]) => (
          <div key={s} className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex items-center gap-space-md"><span className={`w-12 h-12 rounded-xl flex items-center justify-center ${c}`}><I n={i} /></span><div><div className="font-headline-md text-headline-md tabular">{t}</div><div className="font-body-sm text-body-sm text-on-surface-variant">{s}</div></div></div>
        ))}
      </div>

      {form && <FormPedido inicial={form === 'nuevo' ? null : form} onClose={() => setForm(null)} onGuardado={() => { setForm(null); cargar() }} />}
      {abono && (
        <Modal titulo={`Registrar abono · ${abono.codigo}`} subtitulo={`Saldo pendiente ${money(abono.saldo)}`} icono="payments" onClose={() => setAbono(null)} ancho="max-w-md"
          pie={<><button type="button" className="btn-sec" onClick={() => setAbono(null)}>Cancelar</button><button type="button" className="btn-pri" disabled={!(Number(monto) > 0)} onClick={() => registrarAbono(abono, monto)}>Registrar</button></>}>
          <Campo label="Monto recibido ($)"><input className="campo tabular" type="number" min="0.01" step="0.01" max={abono.saldo} value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus /></Campo>
        </Modal>
      )}
      {cobrarEntrega && (
        <Modal titulo={`Entregar ${cobrarEntrega.codigo}`} subtitulo={`El cliente tiene un saldo de ${money(cobrarEntrega.saldo)}`} icono="task_alt" onClose={() => setCobrarEntrega(null)} ancho="max-w-md"
          pie={<><button type="button" className="btn-sec" onClick={() => { const p = cobrarEntrega; setCobrarEntrega(null); cambiar(p, 'ENTREGADO') }}>Entregar sin cobrar</button><button type="button" className="btn-pri" onClick={() => registrarAbono(cobrarEntrega, cobrarEntrega.saldo, true)}><I n="payments" />Cobrar {money(cobrarEntrega.saldo)} y entregar</button></>}>
          <p className="font-body-md text-body-md text-on-surface-variant">Registre el cobro del saldo para que el pedido quede pagado al 100 %. Si el cliente pagará después, puede entregarlo sin cobrar y el saldo quedará pendiente.</p>
        </Modal>
      )}
    </div>
  )
}
