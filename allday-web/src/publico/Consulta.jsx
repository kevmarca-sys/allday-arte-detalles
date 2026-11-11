import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, errorMsg } from '../api.js'
import { useConfig } from '../config.jsx'
import { Foto, I } from '../components/ui.jsx'
import { ESTADOS, linkWhatsApp, money, parseFecha } from '../util.js'
import { mapsUrl } from './Inicio.jsx'

const fechaHoraCorta = (iso) => new Date(iso).toLocaleString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
const DESC = {
  RECIBIDO: 'Encargo registrado en el sistema con los detalles acordados.',
  EN_PREPARACION: 'Estamos trabajando en tu encargo en el taller.',
  LISTO: 'Esperando por ti en el mostrador, listo para retirar.',
  ENTREGADO: 'Retirado en el local. ¡Gracias por tu compra!',
}
const ICONO_TIPO = { 'Detalle o arreglo': 'redeem', 'Impresión de fotos': 'photo_camera', 'Impresión de documentos': 'print', 'Decoración para fiesta': 'celebration' }

function Faq({ q, children }) {
  return (
    <details className="group bg-surface-container-lowest rounded-xl shadow-sm">
      <summary className="list-none cursor-pointer flex items-center justify-between gap-space-sm p-space-md font-label-lg text-label-lg text-on-surface">{q}<I n="expand_more" className="text-primary-container transition-transform group-open:rotate-180" /></summary>
      <p className="px-space-md pb-space-md font-body-md text-body-md text-on-surface-variant">{children}</p>
    </details>
  )
}

export default function Consulta() {
  const [sp, setSp] = useSearchParams()
  const { whatsapp, cfg, horario } = useConfig()
  const [codigo, setCodigo] = useState(sp.get('codigo') || '')
  const [p, setP] = useState(null), [error, setError] = useState(''), [cargando, setCargando] = useState(false)

  async function buscar(c) {
    const cod = c.trim().toUpperCase()
    if (!/^AD-\d{4,}$/.test(cod)) { setError('El código tiene el formato AD-0000 (por ejemplo AD-1001).'); setP(null); return }
    setCargando(true); setError('')
    try { const r = await api.get(`/public/pedidos/${encodeURIComponent(cod)}`); setP(r.data); setSp({ codigo: cod }, { replace: true }) }
    catch (e) { setP(null); setError(e.response?.status === 404 ? `No encontramos el pedido ${cod}. Revisa el código de tu comprobante.` : errorMsg(e)) }
    finally { setCargando(false) }
  }
  useEffect(() => { if (sp.get('codigo')) buscar(sp.get('codigo')) }, []) // eslint-disable-line

  const anulado = p?.estado === 'ANULADO'
  const paso = p ? ESTADOS.findIndex((e) => e.k === p.estado) : -1
  const hist = (k) => p?.historial.find((h) => h.estado === k)
  const listo = p?.estado === 'LISTO'
  const badge = p && (anulado ? ['bg-error-container text-on-error-container', 'bg-error', 'Pedido anulado']
    : { RECIBIDO: ['bg-secondary-fixed text-on-secondary-fixed', 'bg-secondary', 'Recibido'], EN_PREPARACION: ['bg-primary-fixed text-primary', 'bg-primary-container', 'En preparación'], LISTO: ['bg-tertiary-fixed text-on-tertiary-fixed', 'bg-tertiary', '¡Listo para retirar!'], ENTREGADO: ['bg-surface-container text-on-surface-variant', 'bg-outline', 'Entregado'] }[p.estado])

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full overflow-hidden pb-space-lg lg:pb-space-xl">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-72 -right-24 w-80 h-80 bg-secondary-fixed/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="max-w-7xl mx-auto px-margin lg:px-margin-desktop w-full pt-space-sm lg:pt-space-lg flex flex-col gap-space-lg lg:gap-space-xl">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant"><Link to="/" className="hover:text-primary-container transition-colors">Inicio</Link><I n="chevron_right" className="text-[16px] text-outline" /><span className="text-primary-container font-semibold">Seguimiento de pedido</span></div>
            <div className="hidden sm:flex items-center gap-space-xs px-space-md py-space-xs bg-primary-fixed/40 rounded-full text-primary-container font-label-sm text-label-sm"><I n="verified" className="text-[16px]" /><span>Estado actualizado por el local · Cuenca</span></div>
          </div>

          <section className="flex flex-col items-center text-center max-w-4xl mx-auto w-full gap-space-md">
            <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-high rounded-full font-label-sm text-label-sm text-primary-container"><I n="receipt_long" className="text-[18px]" /><span>Taller &amp; Bazar Creativo</span></div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile lg:font-display lg:text-display text-on-surface tracking-tight">Rastrea el estado de tu pedido o encargo personalizado</h1>
            <p className="font-body-md text-body-md lg:font-body-lg lg:text-body-lg text-on-surface-variant max-w-2xl">Ingresa el código que te dimos en el local o por WhatsApp al momento de dejar tu encargo.</p>
            <div className="w-full mt-space-sm bg-surface-container-lowest rounded-xl p-space-sm lg:p-space-md shadow-md shadow-primary/5 flex flex-col gap-space-sm">
              <form onSubmit={(e) => { e.preventDefault(); buscar(codigo) }} className="flex flex-col sm:flex-row items-stretch gap-space-sm w-full">
                <label className="relative flex-1 flex items-center bg-surface-container-low rounded-xl px-space-md focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary-container/30 transition-colors">
                  <I n="tag" className="text-primary-container mr-space-sm text-[22px]" />
                  <input value={codigo} onChange={(e) => setCodigo(e.target.value)} aria-label="Código del pedido" placeholder="Ingresa tu código (ej. AD-1001)" autoComplete="off"
                    className="w-full bg-transparent border-none outline-none font-headline-sm text-headline-sm text-on-surface placeholder:text-outline placeholder:font-body-md placeholder:text-body-md uppercase tracking-wider py-space-sm" />
                  <span className="text-xs font-label-sm text-outline hidden md:inline">ENTER</span>
                </label>
                <button disabled={cargando} className="flex items-center justify-center gap-space-xs px-space-xl py-space-md bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg shadow-sm transition-all disabled:opacity-60">
                  <I n={cargando ? 'progress_activity' : 'search'} className={`text-[20px] ${cargando ? 'animate-spin' : ''}`} /><span>Consultar Estado</span>
                </button>
              </form>
              {error && <p role="alert" className="flex items-center gap-space-xs text-left px-space-xs font-body-md text-body-md text-error"><I n="error" className="text-[18px]" />{error}</p>}
              <div className="flex flex-wrap items-center justify-between gap-space-xs pt-space-xs px-space-xs text-on-surface-variant font-body-sm text-body-sm text-left">
                <div className="flex items-center gap-space-xs"><I n="info" className="text-[16px] text-primary-container" /><span>¿Olvidaste o perdiste tu código? Escríbenos por WhatsApp con tu nombre.</span></div>
                {whatsapp && <a href={linkWhatsApp(whatsapp, 'Hola ALL DAY, perdí el código de mi pedido. Mi nombre es: ')} target="_blank" rel="noopener noreferrer" className="font-label-sm text-label-sm text-primary-container hover:underline inline-flex items-center gap-1 font-semibold"><span>Recuperar por WhatsApp</span><I n="arrow_outward" className="text-[14px]" /></a>}
              </div>
            </div>
          </section>

          {p && (
            <section className="w-full max-w-5xl mx-auto flex flex-col gap-space-lg" aria-live="polite">
              <div className="relative bg-surface-container-lowest rounded-xl shadow-xl shadow-on-surface/5 overflow-hidden">
                <div className="bg-surface-container-high px-space-md lg:px-space-xl py-space-md flex flex-wrap items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md">
                    <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center"><I n="design_services" className="text-[24px]" /></div>
                    <div className="flex flex-col"><span className="font-headline-sm text-headline-sm text-on-surface">Boleta de Encargo</span><span className="font-body-sm text-body-sm text-on-surface-variant">Taller ALL DAY · Cuenca</span></div>
                  </div>
                  <div className={`flex items-center gap-space-sm px-space-lg py-space-xs rounded-full shadow-sm ${badge[0]}`}><span className={`w-2.5 h-2.5 rounded-full ${badge[1]} ${listo ? 'animate-pulse' : ''}`} /><span className="font-label-lg text-label-lg tracking-wide uppercase">{badge[2]}</span></div>
                </div>
                <div className="p-space-md lg:p-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl">
                  <div className={`${p.imagenId || (listo && whatsapp) ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-space-lg justify-between`}>
                    <div>
                      <div className="grid grid-cols-2 gap-space-md pb-space-md">
                        <div className="flex flex-col"><span className="font-label-sm text-label-sm uppercase text-outline">Código de Encargo</span><span className="font-headline-lg-mobile text-headline-lg-mobile sm:font-display-mobile sm:text-display-mobile text-primary-container tracking-wider font-extrabold">{p.codigo}</span></div>
                        <div className="flex flex-col"><span className="font-label-sm text-label-sm uppercase text-outline">Recepción en local</span><span className="font-label-lg text-label-lg text-on-surface mt-1">{new Date(p.creadoEn).toLocaleString('es-EC', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                          <span className="font-label-sm text-label-sm uppercase text-outline mt-space-sm">Entrega acordada</span><span className="font-label-lg text-label-lg text-on-surface">{parseFecha(p.fechaEntrega).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
                      </div>
                      <div className="flex flex-col gap-space-xs bg-surface-container-low p-space-md rounded-xl">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Cliente</span>
                        <div className="flex items-center gap-space-xs font-headline-sm text-headline-sm text-on-surface"><I n="person" className="text-primary-container text-[20px]" /><span>{p.cliente}</span></div>
                      </div>
                      <div className="mt-space-md flex flex-col gap-space-xs">
                        <span className="font-label-sm text-label-sm uppercase text-outline">Detalle del encargo · {p.tipo}</span>
                        <div className="bg-surface p-space-md rounded-xl flex items-start gap-space-md">
                          <div className="p-space-xs bg-primary-fixed rounded-lg text-primary-container"><I n={ICONO_TIPO[p.tipo] || 'redeem'} className="text-[24px]" /></div>
                          <p className="font-label-lg text-label-lg text-on-surface whitespace-pre-line flex-1">{p.descripcion}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
                      <div className="flex items-center gap-space-sm">
                        <I n="store" className="text-primary-container text-[26px]" />
                        <div className="flex flex-col"><span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Local de Retiro</span><span className="font-label-md text-label-md text-on-surface">{cfg.nombre || 'ALL DAY Arte – Detalles'}</span><span className="font-body-sm text-body-sm text-outline">{cfg.direccion || 'Cuenca, Ecuador'}</span></div>
                      </div>
                      {Number(p.total) > 0 && (
                        <div className="text-center sm:text-right flex flex-col items-center sm:items-end sm:pl-space-md">
                          <span className="font-label-sm text-label-sm uppercase text-secondary">{Number(p.saldo) > 0 ? 'Saldo a cancelar al retirar' : 'Pedido pagado'}</span>
                          <span className="font-display-mobile text-display-mobile lg:font-display lg:text-display text-primary leading-none tabular">{money(Number(p.saldo) > 0 ? p.saldo : p.total)}</span>
                          <span className="font-body-sm text-body-sm text-outline mt-1">{Number(p.saldo) > 0 ? `Valor total ${money(p.total)} · efectivo o transferencia en caja` : 'Cancelado en su totalidad'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {(p.imagenId || (listo && whatsapp)) && (
                    <div className="lg:col-span-5 flex flex-col justify-between gap-space-lg bg-surface-container rounded-xl p-space-md lg:p-space-lg">
                      {p.imagenId && (
                        <div className="flex flex-col gap-space-sm">
                          <div className="flex items-center justify-between"><span className="font-label-md text-label-md text-on-surface-variant">Foto del encargo</span><span className="px-space-xs py-0.5 bg-secondary-container text-on-secondary-container rounded font-label-sm text-label-sm">Taller ALL DAY</span></div>
                          <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-inner bg-surface-dim">
                            <Foto id={p.imagenId} alt="Foto del encargo" className="w-full h-full" />
                            <div className="absolute bottom-2 left-2 px-space-sm py-space-xs bg-inverse-surface/80 backdrop-blur-sm rounded-lg text-inverse-on-surface font-label-sm text-label-sm flex items-center gap-1"><I n="photo_camera" className="text-[14px]" /><span>Foto de Taller</span></div>
                          </div>
                        </div>
                      )}
                      {listo && whatsapp && (
                        <div className="flex flex-col gap-space-xs">
                          <a href={linkWhatsApp(whatsapp, `Hola ALL DAY, voy a retirar mi pedido ${p.codigo}.`)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-space-sm w-full py-space-md px-space-lg bg-whatsapp hover:bg-whatsapp-dark text-white rounded-xl font-label-lg text-label-lg shadow-md transition-all text-center"><I n="chat" className="text-[22px]" /><span>Avisar por WhatsApp que voy a retirar</span></a>
                          <span className="text-center font-body-sm text-body-sm text-outline">Nos ayuda a tenerlo listo en el mostrador antes de que llegues.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative py-2 bg-surface-container-low flex items-center justify-between px-4" aria-hidden="true">
                  <div className="w-6 h-6 -ml-7 rounded-full bg-surface" /><div className="flex-1 border-t-2 border-dashed border-outline-variant mx-4" /><div className="w-6 h-6 -mr-7 rounded-full bg-surface" />
                </div>
                <div className="p-space-md lg:p-space-xl bg-surface-container-lowest">
                  <div className="flex items-center justify-between mb-space-lg">
                    <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs"><I n="timeline" className="text-primary-container text-[20px]" />Línea de Vida del Trabajo</span>
                    <span className="font-label-sm text-label-sm text-outline">{anulado ? 'Anulado' : `Paso ${paso + 1} de 4`}</span>
                  </div>
                  <ol className="grid grid-cols-1 md:grid-cols-4 gap-space-md relative">
                    {ESTADOS.map((e, i) => {
                      const h = hist(e.k)
                      const hecho = !anulado && i < paso, actual = !anulado && i === paso
                      return (
                        <li key={e.k} className={`flex flex-col gap-space-xs relative ${actual ? 'bg-surface-container-high/50 p-space-sm rounded-xl' : ''} ${!hecho && !actual ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-space-sm mb-space-xs">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-label-md text-label-md shrink-0 ${hecho ? 'bg-tertiary-fixed text-on-tertiary-fixed shadow-sm' : actual ? 'bg-primary-container text-on-primary shadow-md' : 'bg-surface-container-high text-outline'}`}>
                              <I n={hecho ? 'check' : actual ? (e.k === 'ENTREGADO' ? 'check_circle' : 'star') : 'radio_button_unchecked'} className="text-[18px]" />
                            </div>
                            {i < 3 && <div className={`hidden md:block flex-1 h-1 rounded ${hecho ? 'bg-tertiary-fixed' : 'bg-outline-variant'}`} />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-label-md text-label-md ${actual ? 'text-primary-container font-extrabold' : 'text-on-surface font-bold'}`}>{i + 1}. {e.t}</span>
                            <span className={`font-body-sm text-body-sm ${h ? 'text-primary-container font-semibold' : 'text-outline'}`}>{h ? fechaHoraCorta(h.fecha) : 'Pendiente'}</span>
                            <span className={`font-body-sm text-body-sm ${actual ? 'text-on-surface' : 'text-outline'}`}>{DESC[e.k]}</span>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                  {anulado && <p className="mt-space-md p-space-sm rounded-lg bg-error-container text-on-error-container font-body-md text-body-md flex items-center gap-space-xs"><I n="cancel" />Este pedido fue anulado. Si tienes dudas, escríbenos por WhatsApp.</p>}
                </div>
              </div>
            </section>
          )}

          <section className="max-w-7xl mx-auto w-full pt-space-md lg:pt-space-xl flex flex-col gap-space-lg lg:gap-space-xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs"><span className="font-label-sm text-label-sm text-primary-container uppercase font-bold tracking-wider">Metodología ALL DAY</span><h2 className="font-headline-lg-mobile text-headline-lg-mobile lg:font-headline-lg lg:text-headline-lg text-on-surface">Cómo pedir un detalle personalizado en 3 pasos</h2></div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Sin registros ni pasarelas de pago: trato cálido de persona a persona.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md lg:gap-space-lg">
              {[['01', 'text-secondary-container', 'palette', 'Elige tu idea o inspírate', 'Revisa nuestro catálogo en línea o trae tu propia foto de referencia para cuadernos, cajas o detalles.', 'Ver catálogo', '/catalogo'],
                ['02', 'text-primary-container', 'forum', 'Coordina en el local o por WhatsApp', 'Acordamos colores, dedicatorias, fotografías y fecha de entrega. En ese momento te damos tu código de pedido.', 'Atención 1 a 1', null],
                ['03', 'text-tertiary', 'storefront', 'Retira y paga en tienda', 'Consulta aquí cuándo está listo. Vienes al local, revisas tu trabajo terminado y pagas el saldo.', 'Sin cobros en línea', null]].map(([n, c, i, t, d, l, to]) => (
                <div key={n} className="bg-surface-container-lowest rounded-xl p-space-lg lg:p-space-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-space-lg group">
                  <div className="flex items-start justify-between"><span className={`font-display text-display leading-none group-hover:scale-110 transition-transform ${c}`}>{n}</span><div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container"><I n={i} className="text-[28px]" /></div></div>
                  <div className="flex flex-col gap-space-xs"><h3 className="font-headline-sm text-headline-sm text-on-surface">{t}</h3><p className="font-body-md text-body-md text-on-surface-variant">{d}</p></div>
                  {to ? <Link to={to} className="pt-space-xs font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><span>{l}</span><I n="arrow_forward" className="text-[16px]" /></Link>
                    : <div className="pt-space-xs font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1"><span>{l}</span><I n="arrow_forward" className="text-[16px]" /></div>}
                </div>
              ))}
            </div>
          </section>

          <section className="max-w-7xl mx-auto w-full">
            <div className="bg-surface-container-low rounded-xl p-space-lg lg:p-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg lg:gap-space-xl">
              <div className="flex flex-col gap-space-sm max-w-lg">
                <span className="font-label-sm text-label-sm uppercase text-primary-container font-bold">Hecho con amor y dedicación</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Cada encargo es una pieza única</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Desde impresiones fotográficas hasta lazos atados a mano: nuestro equipo en Cuenca cuida cada detalle de tu sorpresa.</p>
              </div>
              <div className="grid grid-cols-2 gap-space-sm w-full md:w-auto">
                <Foto src="/img/c-regalos.jpg" alt="Detalles y regalos del taller" className="w-full md:w-44 aspect-[4/3] rounded-xl shadow-sm" />
                <Foto src="/img/c-fotos.jpg" alt="Fotos impresas" className="w-full md:w-44 aspect-[4/3] rounded-xl shadow-sm md:mt-space-lg" />
              </div>
            </div>
          </section>

          <section className="max-w-3xl mx-auto w-full flex flex-col gap-space-md">
            <div className="text-center"><h2 className="font-headline-lg-mobile text-headline-lg-mobile lg:font-headline-lg lg:text-headline-lg text-on-surface">Preguntas frecuentes sobre encargos</h2><p className="font-body-md text-body-md text-on-surface-variant">Resolvemos tus dudas sobre tiempos, retiros y consultas.</p></div>
            <Faq q="¿Cuánto tiempo tarda la preparación de un pedido?">Depende del tipo de trabajo. La fecha de entrega se acuerda al dejar el encargo y aparece en esta consulta.</Faq>
            <Faq q="¿Puedo enviar a otra persona a retirar por mí?">Sí. La persona debe indicar en el mostrador el código del pedido (AD-0000).</Faq>
            <Faq q="¿Cuál es el horario de atención para retiros?">{horario}. No realizamos envíos a domicilio; los retiros son en el local.</Faq>
            <Faq q="¿Qué hago si el estado no cambia a «Listo para retirar»?">Escríbenos por WhatsApp con tu código y te contamos cómo va tu encargo.</Faq>
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md mt-space-sm">
              <div className="flex items-center gap-space-sm"><span className="w-12 h-12 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center"><I n="support_agent" /></span><div><p className="font-label-lg text-label-lg text-on-surface">¿Tienes una consulta específica sobre tu diseño?</p><p className="font-body-sm text-body-sm text-on-surface-variant">Atendemos en horario: {horario}.</p></div></div>
              <div className="flex gap-space-sm">
                {whatsapp && <a href={linkWhatsApp(whatsapp, 'Hola ALL DAY, tengo una consulta sobre mi encargo.')} target="_blank" rel="noopener noreferrer" className="btn-pri py-space-sm"><I n="chat" className="text-[18px]" />Hablar con el Taller</a>}
                <a href={mapsUrl(cfg.direccion)} target="_blank" rel="noopener noreferrer" className="btn-sec py-space-sm"><I n="near_me" className="text-[18px]" />Cómo llegar</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
