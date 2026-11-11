import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { errorMsg } from '../api.js'
import { useAuth } from '../auth.jsx'
import { I } from '../components/ui.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [email, setEmail] = useState(''), [pass, setPass] = useState(''), [ver, setVer] = useState(false), [recordar, setRecordar] = useState(false)
  const [error, setError] = useState(sp.get('expirada') ? 'Su sesión expiró. Ingrese nuevamente.' : ''), [cargando, setCargando] = useState(false)
  if (user) return <Navigate to="/panel/inicio" replace />
  async function enviar(e) {
    e.preventDefault(); setError(''); setCargando(true)
    try { await login(email.trim(), pass, recordar); nav('/panel/inicio') } catch (err) { setError(err.response?.status === 401 ? 'Correo o contraseña incorrectos.' : errorMsg(err)) } finally { setCargando(false) }
  }
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen relative flex flex-col justify-between overflow-x-hidden selection:bg-primary-fixed">
      <div className="fixed inset-0 pointer-events-none -z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-fixed opacity-40 blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-secondary-container opacity-25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full bg-surface-container-high opacity-60 blur-3xl" />
        <svg viewBox="0 0 200 200" className="hidden lg:block absolute top-16 right-[4%] w-[26rem] h-[26rem] opacity-90"><path fill="#fdc416" d="M45.7,-62.3C58.5,-53.3,67.6,-39.2,72.7,-23.6C77.8,-8,78.8,9.1,72.9,23.2C67,37.3,54.2,48.3,40.1,57.7C26,67.1,10.7,74.9,-5.6,77.5C-21.9,80.1,-39.1,77.5,-51.9,68.3C-64.7,59.1,-73.1,43.3,-76.7,26.8C-80.3,10.3,-79.1,-6.9,-72.6,-21.3C-66.1,-35.7,-54.3,-47.3,-41.1,-56.2C-27.9,-65.1,-13.9,-71.2,1.2,-72.8C16.3,-74.5,32.9,-71.3,45.7,-62.3Z" transform="translate(100 100)" /></svg>
        <svg viewBox="0 0 200 200" className="hidden lg:block absolute bottom-10 left-[3%] w-80 h-80 opacity-70"><path fill="#f1dbff" d="M39.5,-53.6C51.4,-45.5,61.2,-33.9,66.3,-20.1C71.4,-6.3,71.8,9.7,65.8,22.8C59.8,35.9,47.4,46.1,33.7,54.4C20,62.7,5,69.1,-10.6,69.6C-26.2,70.1,-42.4,64.7,-53.8,53.9C-65.2,43.1,-71.8,26.9,-72.1,10.7C-72.4,-5.5,-66.4,-21.7,-56.4,-33.6C-46.4,-45.5,-32.4,-53.1,-18.8,-60.3C-5.2,-67.5,8,-74.3,20.4,-71.8C32.8,-69.3,27.6,-61.7,39.5,-53.6Z" transform="translate(100 100)" /></svg>
      </div>
      <header className="relative w-full pt-space-xl px-margin lg:px-margin-desktop flex items-center justify-between gap-space-sm">
        <Link to="/" className="flex items-center gap-space-sm">
          <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm"><I n="palette" className="text-headline-sm" /></span>
          <span><span className="font-headline-sm text-headline-sm text-primary tracking-tight block">ALL DAY Arte</span><span className="font-label-sm text-label-sm text-on-surface-variant block tracking-wider uppercase">Detalles · Cuenca</span></span>
        </Link>
        <div className="hidden sm:flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md bg-surface-container-lowest/80 backdrop-blur-md px-space-md py-space-xs rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><I n="store" className="text-headline-sm text-tertiary" /><span>Acceso a Panel Administrativo</span></div>
      </header>
      <main className="relative flex-1 flex items-center justify-center w-full px-margin lg:px-margin-desktop py-space-xl">
        <div className="w-full max-w-[500px] z-10 flex flex-col items-center">
          <div className="w-full bg-surface-container-lowest rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(97,0,164,0.18),0_10px_25px_-5px_rgba(17,28,45,0.06)] flex flex-col">
            <div className="flex items-center justify-between w-full mb-space-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm tracking-wide"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><span>Acceso Interno Exclusivo</span></div>
              <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm"><I n="location_on" className="text-[15px] text-tertiary" /><span>Taller · Cuenca</span></div>
            </div>
            <div className="flex flex-col items-center text-center mb-space-lg">
              <div className="relative w-28 h-28 mb-space-sm flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container via-primary-fixed to-surface-container rounded-3xl rotate-3 scale-95 opacity-80 shadow-inner" />
                <div className="relative z-10 w-24 h-24 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm p-3"><img src="/logo-mark.png" alt="Logo ALL DAY" className="w-full h-full object-contain" /></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary-container shadow-sm flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-on-secondary-fixed" /></div>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-space-xs">Panel del negocio</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-snug">Acceso exclusivo para el personal de <span className="font-bold text-primary">ALL DAY Arte · Detalles</span></p>
            </div>
            <form onSubmit={enviar} className="flex flex-col gap-space-md w-full">
              <div className="flex flex-col gap-1.5 w-full text-left">
                <label htmlFor="email" className="font-label-lg text-label-lg text-on-surface">Correo electrónico</label>
                <div className="relative flex items-center w-full">
                  <I n="alternate_email" className="absolute left-3.5 text-on-surface-variant pointer-events-none text-headline-sm" />
                  <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@correo.com" className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl transition-all outline-none border border-transparent focus:bg-surface-container-lowest focus:border-primary-container/40 focus:ring-4 focus:ring-primary-container/10" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 w-full text-left">
                <label htmlFor="pass" className="font-label-lg text-label-lg text-on-surface flex items-center justify-between">Contraseña<span className="font-label-sm text-label-sm text-primary-container">¿Olvidó su clave? Pídala al administrador</span></label>
                <div className="relative flex items-center w-full">
                  <I n="lock" className="absolute left-3.5 text-on-surface-variant pointer-events-none text-headline-sm" />
                  <input id="pass" type={ver ? 'text' : 'password'} required autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className="w-full h-12 pl-11 pr-12 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-xl transition-all outline-none border border-transparent focus:bg-surface-container-lowest focus:border-primary-container/40 focus:ring-4 focus:ring-primary-container/10" />
                  <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary"><I n={ver ? 'visibility_off' : 'visibility'} /></button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="w-4 h-4 rounded accent-primary cursor-pointer" />
                <span className="font-body-sm text-body-sm text-on-surface-variant">Recordar sesión en este equipo del local</span>
              </label>
              {error && <p role="alert" className="flex items-center gap-space-xs bg-error-container text-on-error-container rounded-lg px-space-md py-space-sm font-body-md text-body-md"><I n="error" />{error}</p>}
              <button disabled={cargando} className="group w-full h-12 px-6 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2.5 shadow-[0_8px_20px_-4px_rgba(97,0,164,0.4)] transition-all disabled:opacity-60">
                <span>{cargando ? 'Verificando…' : 'Ingresar al Sistema'}</span><I n={cargando ? 'progress_activity' : 'arrow_forward'} className={`text-headline-sm transition-transform group-hover:translate-x-1 ${cargando ? 'animate-spin' : ''}`} />
              </button>
            </form>
            <div className="w-full flex items-center gap-3 my-space-md"><div className="flex-1 h-px bg-outline-variant/60" /><span className="w-2 h-2 rounded-full bg-secondary-container" /><div className="flex-1 h-px bg-outline-variant/60" /></div>
            <Link to="/" className="self-center inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary font-label-md text-label-md transition-colors group p-1"><I n="arrow_back" className="text-headline-sm transition-transform group-hover:-translate-x-1 text-primary" /><span>Volver al catálogo público</span></Link>
          </div>
          <div className="w-full flex flex-col sm:flex-row items-center justify-between mt-space-md px-4 gap-2 text-on-surface-variant text-center sm:text-left">
            <div className="flex items-center gap-1.5 font-label-sm text-label-sm"><I n="shield" className="text-[16px] text-tertiary" /><span>Conexión cifrada · Sesión con token JWT</span></div>
            <div className="font-body-sm text-[11px] text-outline">En equipos compartidos no marque “Recordar sesión”.</div>
          </div>
        </div>
      </main>
      <footer className="relative w-full pb-space-lg px-margin lg:px-margin-desktop flex flex-col sm:flex-row items-center justify-between text-on-surface-variant font-body-sm text-body-sm gap-space-sm">
        <div className="flex items-center gap-space-xs"><I n="pin_drop" className="text-headline-sm text-outline" /><span>Cuenca, Ecuador • Sistema de Gestión y Catálogo</span></div>
        <span>© {new Date().getFullYear()} ALL DAY Arte • Todos los derechos reservados</span>
      </footer>
    </div>
  )
}
