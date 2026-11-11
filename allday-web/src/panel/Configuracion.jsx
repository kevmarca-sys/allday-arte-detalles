import { useEffect, useState } from 'react'
import { api, errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useConfig } from '../config.jsx'
import { Campo, Cargando, I, Modal, Toggle, useToast } from '../components/ui.jsx'
import { Ticket } from '../components/Ticket.jsx'
import { iniciales, waInternacional } from '../util.js'

const RED = { instagram: 'https://instagram.com/', tiktok: 'https://www.tiktok.com/@', facebook: 'https://facebook.com/' }
const usuarioDe = (url, k) => (url || '').replace(RED[k], '').replace(/^https?:\/\/(www\.)?[^/]+\/@?/, '')
const urlDe = (v, k) => { const t = (v || '').trim().replace(/^@/, ''); return !t ? '' : /^https:\/\//.test(t) ? t : RED[k] + t }

function Usuarios() {
  const { user } = useAuth()
  const toast = useToast()
  const [us, setUs] = useState(null), [ed, setEd] = useState(null)
  const cargar = () => api.get('/usuarios').then((r) => setUs(r.data)).catch((e) => toast(errorMsg(e), 'error'))
  useEffect(() => { cargar() }, []) // eslint-disable-line
  if (!us) return <Cargando />
  async function guardar(e) {
    e.preventDefault()
    const body = { nombre: ed.nombre, email: ed.email, rol: ed.rol, activo: ed.activo, password: ed.password || null }
    try { ed.id ? await api.put(`/usuarios/${ed.id}`, body) : await api.post('/usuarios', body); toast('Usuario guardado'); setEd(null); cargar() } catch (err) { toast(errorMsg(err), 'error') }
  }
  return (
    <div className="flex flex-col gap-space-lg">
      <div className="grid grid-cols-2 gap-space-md">
        {[['admin_panel_settings', 'Administrador', 'Todo el sistema: productos, inventario, reportes, configuración, anulaciones y usuarios.', 'bg-primary-fixed text-primary'], ['badge', 'Empleado de mostrador', 'Caja, ventas, pedidos, clientes y consulta del catálogo. No anula ni cambia precios.', 'bg-tertiary-fixed/50 text-tertiary']].map(([i, t, d, c]) => (
          <div key={t} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex gap-space-md"><span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c}`}><I n={i} /></span><div><h3 className="font-headline-sm text-headline-sm">{t}</h3><p className="font-body-sm text-body-sm text-on-surface-variant">{d}</p></div></div>
        ))}
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-space-md"><h2 className="font-headline-sm text-headline-sm">Personal con acceso al panel</h2><button type="button" onClick={() => setEd({ nombre: '', email: '', rol: 'EMPLEADO', activo: true, password: '' })} className="btn-pri py-2"><I n="person_add" />Nuevo usuario</button></div>
        <table className="w-full text-left">
          <thead><tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider"><th className="py-3 px-space-md">Usuario</th><th className="py-3 px-space-md">Correo</th><th className="py-3 px-space-md">Rol</th><th className="py-3 px-space-md text-center">Estado</th><th className="py-3 px-space-md text-right">Acciones</th></tr></thead>
          <tbody>{us.map((u) => (
            <tr key={u.id} className="border-t border-surface-container">
              <td className="py-3 px-space-md"><span className="flex items-center gap-space-sm"><span className={`w-9 h-9 rounded-full flex items-center justify-center font-label-md text-label-md ${u.rol === 'ADMIN' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-primary'}`}>{iniciales(u.nombre)}</span><span className="font-label-lg text-label-lg">{u.nombre}{u.id === user?.id && <span className="ml-2 font-label-sm text-label-sm text-primary">(usted)</span>}</span></span></td>
              <td className="py-3 px-space-md font-body-md text-body-md">{u.email}</td>
              <td className="py-3 px-space-md"><span className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm ${u.rol === 'ADMIN' ? 'bg-primary-fixed text-primary' : 'bg-tertiary-fixed/50 text-tertiary'}`}>{u.rol === 'ADMIN' ? 'Administrador' : 'Empleado'}</span></td>
              <td className="py-3 px-space-md text-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${u.activo ? 'bg-tertiary-fixed/40 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{u.activo ? 'Activo' : 'Inactivo'}</span></td>
              <td className="py-3 px-space-md text-right"><button type="button" onClick={() => setEd({ ...u, password: '' })} className="p-2 rounded-lg text-primary hover:bg-primary-fixed/50" aria-label="Editar"><I n="edit" /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {ed && (
        <Modal titulo={ed.id ? 'Editar usuario' : 'Nuevo usuario'} subtitulo="La contraseña se guarda cifrada (BCrypt)" icono="person" onClose={() => setEd(null)} ancho="max-w-lg"
          pie={<><button type="button" className="btn-sec" onClick={() => setEd(null)}>Cancelar</button><button form="fusr" className="btn-pri"><I n="save" />Guardar</button></>}>
          <form id="fusr" onSubmit={guardar} className="grid grid-cols-2 gap-space-md">
            <Campo label="Nombre *" className="col-span-2"><input className="campo" required maxLength={100} value={ed.nombre} onChange={(e) => setEd({ ...ed, nombre: e.target.value })} /></Campo>
            <Campo label="Correo *" className="col-span-2"><input className="campo" type="email" required maxLength={120} value={ed.email} onChange={(e) => setEd({ ...ed, email: e.target.value })} /></Campo>
            <Campo label="Rol"><select className="campo" value={ed.rol} disabled={ed.id === user?.id} onChange={(e) => setEd({ ...ed, rol: e.target.value })}><option value="EMPLEADO">Empleado</option><option value="ADMIN">Administrador</option></select></Campo>
            <Campo label={ed.id ? 'Nueva contraseña' : 'Contraseña *'} extra={ed.id && <span className="font-label-sm text-label-sm text-outline normal-case">vacía = no cambiar</span>}><input className="campo" type="password" autoComplete="new-password" required={!ed.id} minLength={8} maxLength={72} value={ed.password} onChange={(e) => setEd({ ...ed, password: e.target.value })} placeholder="Mínimo 8 caracteres" /></Campo>
            <label className="col-span-2 flex items-center justify-between bg-surface-container-low rounded-xl p-space-md"><span className="font-label-lg text-label-lg">Usuario activo (puede iniciar sesión)</span><Toggle checked={ed.activo} onChange={(v) => setEd({ ...ed, activo: v })} label="Activo" color="bg-tertiary" /></label>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default function Configuracion() {
  const { recargar } = useConfig()
  const toast = useToast()
  const [tab, setTab] = useState('negocio')
  const [orig, setOrig] = useState(null), [f, setF] = useState(null), [nUs, setNUs] = useState(null), [env, setEnv] = useState(false)
  useEffect(() => {
    api.get('/public/configuracion').then((r) => { const d = { ...r.data, instagram: usuarioDe(r.data.instagram, 'instagram'), tiktok: usuarioDe(r.data.tiktok, 'tiktok'), facebook: usuarioDe(r.data.facebook, 'facebook') }; setOrig(d); setF(d) })
    api.get('/usuarios').then((r) => setNUs(r.data.filter((u) => u.activo).length)).catch(() => {})
  }, [])
  if (!f) return <Cargando />
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e })
  const cambios = JSON.stringify(f) !== JSON.stringify(orig)
  async function guardar() {
    setEnv(true)
    const body = { ...f, whatsapp: waInternacional(f.whatsapp), ruc: (f.ruc || '').trim(), instagram: urlDe(f.instagram, 'instagram'), tiktok: urlDe(f.tiktok, 'tiktok'), facebook: urlDe(f.facebook, 'facebook'), ivaPorcentaje: Number(f.ivaPorcentaje) }
    try { await api.put('/configuracion', body); setOrig(f); recargar(); toast('Configuración guardada: ya se refleja en la web y en los comprobantes') } catch (e) { toast(errorMsg(e), 'error') } finally { setEnv(false) }
  }
  const ejemplo = { numero: '001-001-000000000', fecha: new Date().toISOString(), usuario: 'Vista previa', clienteNombre: 'Consumidor final', clienteIdentificacion: '9999999999999', detalles: [{ cantidad: 1, producto: 'Producto de ejemplo', precioUnitario: 1, subtotal: 1 }], subtotal: 1, descuento: 0, iva: (1 - 1 / (1 + (Number(f.ivaPorcentaje) || 0) / 100)).toFixed(2), total: 1, formaPago: 'EFECTIVO', montoRecibido: 1, cambio: 0 }
  const IconoCampo = ({ i, children }) => <div className="relative">{children}<I n={i} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" /></div>

  return (
    <div className="px-margin-desktop py-space-md space-y-space-lg max-w-[1600px]">
      <div className="flex items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm"><span className="text-primary-container uppercase tracking-wider font-bold">Administración general</span><span className="w-1.5 h-1.5 rounded-full bg-secondary-container" /><span className="text-on-surface-variant">ALL DAY · Cuenca</span></div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Configuración del Negocio y Equipo</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">Identidad comercial del local, datos de los comprobantes de caja y control de acceso de usuarios.</p>
        </div>
        {tab === 'negocio' && <div className="flex items-center gap-space-sm"><button type="button" disabled={!cambios} onClick={() => setF(orig)} className="px-space-md py-2 font-label-lg text-label-lg text-on-surface hover:underline disabled:opacity-40">Descartar</button><button type="button" disabled={!cambios || env} onClick={guardar} className="btn-pri"><I n="save" />{env ? 'Guardando…' : 'Guardar Cambios'}</button></div>}
      </div>
      <div className="inline-flex bg-surface-container-low p-1.5 rounded-2xl gap-1">
        <button type="button" onClick={() => setTab('negocio')} className={`flex items-center gap-space-xs px-space-lg py-2.5 rounded-xl font-label-lg text-label-lg ${tab === 'negocio' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}><I n="storefront" />Negocio y Comprobantes</button>
        <button type="button" onClick={() => setTab('usuarios')} className={`flex items-center gap-space-xs px-space-lg py-2.5 rounded-xl font-label-lg text-label-lg ${tab === 'usuarios' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}><I n="group" />Usuarios y Permisos{nUs !== null && <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-[10px] font-bold">{nUs} activos</span>}</button>
      </div>
      {tab === 'usuarios' ? <Usuarios /> : (<>
        <div className="bg-primary-fixed/30 rounded-2xl p-space-md flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md"><span className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center"><I n="store" /></span><div><p className="font-label-lg text-label-lg text-primary">Local y mostrador en operación presencial</p><p className="font-body-sm text-body-sm text-on-surface">Estos datos se muestran en el catálogo web (encabezado, pie, botones de WhatsApp) y en los comprobantes de caja.</p></div></div>
          <span className="flex items-center gap-1 px-space-md py-1.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-tertiary shrink-0"><span className="w-2 h-2 rounded-full bg-tertiary" />Cambios al guardar</span>
        </div>
        <div className="grid grid-cols-12 gap-space-lg items-start">
          <div className="col-span-7 flex flex-col gap-space-lg">
            <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-space-md"><div className="flex gap-space-sm"><I n="badge" className="text-primary text-[28px]" /><div><h2 className="font-headline-md text-headline-md">Información Comercial y Legal</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Identificación del local para la web y los comprobantes</p></div></div><span className="px-space-sm py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm shrink-0">Cuenca · Azuay</span></div>
              <div className="flex items-center gap-space-md bg-surface-container-low rounded-2xl p-space-md">
                <div className="relative w-20 h-20 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center p-2"><img src="/logo-allday.png" alt="Logo oficial" className="max-w-full max-h-full object-contain" /><span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center"><I n="check" className="text-[14px]" /></span></div>
                <div><p className="font-label-lg text-label-lg">Isotipo &amp; logotipo oficial</p><p className="font-body-sm text-body-sm text-on-surface-variant">Se usa en la web, el panel y el comprobante. Para cambiarlo reemplace los archivos <code>logo-*.png</code> de la carpeta <code>public</code>.</p></div>
              </div>
              <Campo label="Nombre comercial *"><IconoCampo i="palette"><input className="campo pr-10" required maxLength={100} value={f.nombre || ''} onChange={set('nombre')} /></IconoCampo></Campo>
              <div className="grid grid-cols-2 gap-space-md">
                <Campo label="RUC" extra={<span className="font-label-sm text-label-sm text-outline normal-case">13 dígitos</span>}><IconoCampo i="pin"><input className="campo pr-10 font-mono" inputMode="numeric" maxLength={13} value={f.ruc || ''} onChange={(e) => setF({ ...f, ruc: e.target.value.replace(/\D/g, '') })} placeholder="Opcional" /></IconoCampo></Campo>
                <Campo label="Teléfono fijo / local"><IconoCampo i="call"><input className="campo pr-10" maxLength={20} value={f.telefono || ''} onChange={set('telefono')} placeholder="Opcional" /></IconoCampo></Campo>
              </div>
              <Campo label="WhatsApp oficial de atención" extra={f.whatsapp && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-sm text-label-sm normal-case"><I n="verified" className="text-[14px]" />Activo en el catálogo</span>}>
                <div className="relative"><I n="chat" className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" /><input className="campo pl-10" inputMode="numeric" value={f.whatsapp || ''} onChange={(e) => setF({ ...f, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 15) })} placeholder="5939XXXXXXXX (código de país, sin + ni espacios)" /></div>
              </Campo>
              <p className="-mt-space-sm font-body-sm text-body-sm text-on-surface-variant">Este número recibe las consultas de los botones «Consultar por WhatsApp» del catálogo. Use un número del negocio, no uno personal.</p>
              <Campo label="Dirección física del local"><div className="relative"><I n="location_on" className="absolute left-3 top-1/2 -translate-y-1/2 text-error" /><input className="campo pl-10" maxLength={200} value={f.direccion || ''} onChange={set('direccion')} placeholder="Calle, número e intersección, Cuenca" /></div></Campo>
              <Campo label="Horario de atención"><div className="relative"><I n="schedule" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" /><input className="campo pl-10" maxLength={120} value={f.horario || ''} onChange={set('horario')} placeholder="Lun - Sáb: 08:30 - 19:00" /></div></Campo>
            </section>
            <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex gap-space-sm"><I n="share" className="text-primary text-[28px]" /><div><h2 className="font-headline-md text-headline-md">Presencia Digital y Redes Sociales</h2><p className="font-body-sm text-body-sm text-on-surface-variant">Enlaces del pie de página del catálogo web</p></div></div>
              <div className="grid grid-cols-2 gap-space-md">
                {[['instagram', 'Instagram', '@'], ['tiktok', 'TikTok', '@'], ['facebook', 'Facebook', '/']].map(([k, t, p]) => (
                  <Campo key={k} label={t}><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">{p}</span><input className="campo pl-8" value={f[k] || ''} onChange={set(k)} placeholder="usuario o enlace https://" /></div></Campo>
                ))}
                <Campo label="Catálogo web público"><div className="campo flex items-center gap-2 text-primary"><I n="link" className="text-[18px]" /><span className="truncate">{location.origin}</span></div></Campo>
              </div>
            </section>
          </div>
          <div className="col-span-5 flex flex-col gap-space-lg">
            <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex items-start justify-between"><div className="flex gap-space-sm"><I n="receipt_long" className="text-primary text-[28px]" /><h2 className="font-headline-md text-headline-md">Comprobante Térmico (80 mm)</h2></div><span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-sm text-label-sm">Interno</span></div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Texto de despedida, políticas de cambio y opciones del ticket de caja. No reemplaza a la factura electrónica del SRI.</p>
              <Campo label="Mensaje de pie de página" extra={<span className="font-label-sm text-label-sm text-outline normal-case">{(f.pieComprobante || '').length}/200</span>}><textarea className="campo" rows={4} maxLength={200} value={f.pieComprobante || ''} onChange={set('pieComprobante')} placeholder="¡Gracias por su compra!" /></Campo>
              <Campo label="Tarifa de IVA vigente (%)"><input className="campo w-32" type="number" min="0" max="30" value={f.ivaPorcentaje ?? 15} onChange={set('ivaPorcentaje')} /></Campo>
              <label className="flex items-center justify-between bg-surface-container-low rounded-xl px-space-md py-space-sm"><span className="flex items-center gap-space-sm font-label-md text-label-md"><I n="qr_code_2" className="text-primary" />Imprimir QR de WhatsApp en el pie</span><Toggle checked={f.qrWhatsapp !== false} onChange={set('qrWhatsapp')} label="QR WhatsApp" /></label>
            </section>
            <div className="flex items-center justify-center gap-space-xs font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"><I n="visibility" className="text-[18px]" />Vista previa en papel térmico (ejemplo)</div>
            <div className="bg-white shadow-lg border border-neutral-200 p-6 mx-auto w-full max-w-[380px]"><Ticket v={ejemplo} cfg={{ ...f, whatsapp: waInternacional(f.whatsapp) }} /></div>
          </div>
        </div>
      </>)}
    </div>
  )
}
