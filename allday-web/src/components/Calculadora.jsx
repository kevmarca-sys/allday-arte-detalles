import { useEffect, useState } from 'react'
import { I, Modal } from './ui.jsx'

/** Evalúa + − × ÷ con precedencia (sin usar eval). */
export function calcular(expr) {
  const t = expr.replace(/×/g, '*').replace(/÷/g, '/').match(/\d+(\.\d+)?|[+\-*/]/g)
  if (!t) return 0
  const nums = [], ops = [], prec = { '+': 1, '-': 1, '*': 2, '/': 2 }
  const aplicar = () => { const b = nums.pop(), a = nums.pop() ?? 0, o = ops.pop(); nums.push(o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : b === 0 ? NaN : a / b) }
  t.forEach((x) => { if (/\d/.test(x)) nums.push(parseFloat(x)); else { while (ops.length && prec[ops.at(-1)] >= prec[x]) aplicar(); ops.push(x) } })
  while (ops.length && nums.length > 1) aplicar()
  return Math.round((nums[0] ?? 0) * 100) / 100
}

export default function Calculadora({ onClose, onUsar, textoUsar = 'Usar como efectivo recibido' }) {
  const [e, setE] = useState('')
  const res = (() => { try { return calcular(e) } catch { return NaN } })()
  const tecla = (k) => {
    if (k === 'C') return setE('')
    if (k === '⌫') return setE((x) => x.slice(0, -1))
    if (k === '=') return setE(Number.isFinite(res) ? String(res) : '')
    setE((x) => (/[+\-×÷]/.test(k) && /[+\-×÷]$/.test(x) ? x.slice(0, -1) + k : x + k))
  }
  useEffect(() => {
    const h = (ev) => {
      const m = { '*': '×', '/': '÷', Enter: '=', Backspace: '⌫', Delete: 'C', ',': '.' }
      const k = ev.key in m ? m[ev.key] : ev.key
      if (/^[0-9.+\-×÷=⌫C]$/.test(k)) { ev.preventDefault(); ev.stopPropagation(); tecla(k) }
    }
    window.addEventListener('keydown', h, true); return () => window.removeEventListener('keydown', h, true)
  })
  const teclas = ['C', '⌫', '÷', '×', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.']
  return (
    <Modal titulo="Calculadora" subtitulo="Funciona también con el teclado numérico" icono="calculate" onClose={onClose} ancho="max-w-sm">
      <div className="rounded-xl bg-surface-container-low p-space-md text-right mb-space-md">
        <div className="font-body-md text-body-md text-on-surface-variant min-h-5 break-all">{e || '0'}</div>
        <div className="font-display-mobile text-display-mobile text-on-surface tabular">{Number.isFinite(res) ? res.toFixed(2) : 'Error'}</div>
      </div>
      <div className="grid grid-cols-4 gap-space-sm">
        {teclas.map((k) => (
          <button key={k} type="button" onClick={() => tecla(k)}
            className={`h-14 rounded-xl font-headline-sm text-headline-sm transition-colors ${k === '=' ? 'row-span-2 h-auto bg-primary-container text-on-primary hover:bg-primary' : /[+\-×÷]/.test(k) ? 'bg-primary-fixed text-primary hover:bg-primary-fixed-dim' : k === 'C' || k === '⌫' ? 'bg-error-container/60 text-error' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'} ${k === '0' ? 'col-span-2' : ''}`}>{k}</button>
        ))}
      </div>
      {onUsar && <button type="button" className="btn-pri w-full mt-space-md" disabled={!Number.isFinite(res) || res <= 0} onClick={() => onUsar(res)}><I n="check" />{textoUsar} {Number.isFinite(res) && res > 0 ? `($${res.toFixed(2)})` : ''}</button>}
    </Modal>
  )
}
