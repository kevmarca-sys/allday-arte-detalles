import { useState } from 'react'
import { Modal } from './ui.jsx'

export function AvisoPrivacidad({ onClose }) {
  const P = ({ t, children }) => <p className="font-body-md text-body-md text-on-surface-variant"><b className="text-on-surface">{t}</b> {children}</p>
  return (
    <Modal titulo="Aviso de privacidad" subtitulo="Ley Orgánica de Protección de Datos Personales del Ecuador" icono="shield_person" onClose={onClose}
      pie={<button className="btn-pri" onClick={onClose}>Entendido</button>}>
      <div className="flex flex-col gap-space-sm">
        <P t="Responsable:">ALL DAY Arte – Detalles, Cuenca, Ecuador.</P>
        <P t="Datos que recogemos:">en el local, su nombre y teléfono (WhatsApp) cuando deja un encargo; y, si pide comprobante con datos, su cédula o RUC y correo.</P>
        <P t="Finalidad:">registrar su encargo, avisarle cuando esté listo y emitir su comprobante de compra. No usamos sus datos para publicidad ni los compartimos con terceros.</P>
        <P t="Base legal:">su consentimiento, conforme a la Ley Orgánica de Protección de Datos Personales (Registro Oficial Suplemento 459, 26 de mayo de 2021).</P>
        <P t="Conservación:">mientras sea necesario para atender su encargo y cumplir obligaciones legales.</P>
        <P t="Sus derechos:">puede pedir acceso, rectificación, eliminación u oposición escribiendo al WhatsApp del negocio o acercándose al local.</P>
        <P t="Seguridad:">la información viaja cifrada (HTTPS) y solo el personal autorizado la consulta.</P>
        <p className="font-body-sm text-body-sm text-outline">La consulta pública por código muestra solo el estado, el detalle del encargo, el saldo y el primer nombre con la inicial del apellido; nunca el teléfono.</p>
      </div>
    </Modal>
  )
}

export function LinkPrivacidad({ className = '' }) {
  const [ver, setVer] = useState(false)
  return <><button type="button" className={className} onClick={() => setVer(true)}>Aviso de privacidad</button>{ver && <AvisoPrivacidad onClose={() => setVer(false)} />}</>
}
