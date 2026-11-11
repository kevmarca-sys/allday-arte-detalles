import { useState } from 'react'
import { money } from '../util.js'

/** Curva suave (Catmull-Rom → Bézier) para el gráfico de área del diseño. */
function curva(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return d
}

/** Gráfico de área de ventas por día. datos: [{ etiqueta, valor, sub? }] */
export function AreaVentas({ datos, alto = 240 }) {
  const [sel, setSel] = useState(null)
  const W = 640, H = alto, pl = 46, pr = 16, pt = 28, pb = 34
  const max = Math.max(1, ...datos.map((d) => d.valor)) * 1.15
  const paso = datos.length > 1 ? (W - pl - pr) / (datos.length - 1) : 0
  const pts = datos.map((d, i) => [pl + i * paso, pt + (H - pt - pb) * (1 - d.valor / max)])
  const pico = datos.reduce((m, d, i) => (d.valor > (datos[m]?.valor ?? -1) ? i : m), 0)
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((k) => max * k)
  const cada = Math.ceil(datos.length / 10)
  const activo = sel ?? (datos[pico]?.valor > 0 ? pico : null)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Ventas por día">
      <defs>
        <linearGradient id="gArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7b2cbf" stopOpacity="0.28" /><stop offset="100%" stopColor="#7b2cbf" stopOpacity="0.02" /></linearGradient>
      </defs>
      {marcas.map((m) => { const y = pt + (H - pt - pb) * (1 - m / max); return <g key={m}><line x1={pl} x2={W - pr} y1={y} y2={y} stroke="#e7eeff" /><text x={pl - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#7e7384">${m >= 1000 ? (m / 1000).toFixed(1) + 'k' : max < 10 ? m.toFixed(2) : Math.round(m)}</text></g> })}
      {pts.length > 1 && <path d={`${curva(pts)} L${pts.at(-1)[0]},${H - pb} L${pts[0][0]},${H - pb} Z`} fill="url(#gArea)" />}
      {pts.length > 1 && <path d={curva(pts)} fill="none" stroke="#6100a4" strokeWidth="3" strokeLinecap="round" />}
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setSel(i)} onMouseLeave={() => setSel(null)} onClick={() => setSel(i)} className="cursor-pointer">
          <rect x={p[0] - paso / 2} y={pt} width={Math.max(paso, 20)} height={H - pt - pb} fill="transparent" />
          <circle cx={p[0]} cy={p[1]} r={i === activo ? 7 : 4} fill={i === activo ? '#fdc416' : '#ffffff'} stroke="#6100a4" strokeWidth="2.5" />
          {(i % cada === 0 || i === datos.length - 1) && <text x={p[0]} y={H - 10} textAnchor="middle" fontSize="11" fill={i === activo ? '#6100a4' : '#4c4353'} fontWeight={i === activo ? 700 : 400}>{datos[i].etiqueta}</text>}
        </g>
      ))}
      {activo !== null && pts[activo] && (() => {
        const [x, y] = pts[activo], t = `${datos[activo].etiqueta}: ${money(datos[activo].valor)}`, w = t.length * 6.4 + 16
        const bx = Math.min(Math.max(x - w / 2, pl), W - pr - w)
        return <g pointerEvents="none"><rect x={bx} y={Math.max(2, y - 34)} width={w} height={22} rx="6" fill="#263143" /><text x={bx + w / 2} y={Math.max(2, y - 34) + 15} textAnchor="middle" fontSize="11" fill="#ecf1ff" fontWeight="700">{t}</text></g>
      })()}
    </svg>
  )
}
