import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import { Cargando } from './components/ui.jsx'
import PublicLayout from './publico/PublicLayout.jsx'
import Inicio from './publico/Inicio.jsx'
import Catalogo from './publico/Catalogo.jsx'
import Producto from './publico/Producto.jsx'
import Consulta from './publico/Consulta.jsx'

// El panel se carga aparte: los clientes del catálogo no descargan su código.
const Login = lazy(() => import('./panel/Login.jsx'))
const AdminLayout = lazy(() => import('./panel/AdminLayout.jsx'))
const PInicio = lazy(() => import('./panel/Inicio.jsx'))
const Caja = lazy(() => import('./panel/Caja.jsx'))
const Ventas = lazy(() => import('./panel/Ventas.jsx'))
const Pedidos = lazy(() => import('./panel/Pedidos.jsx'))
const Productos = lazy(() => import('./panel/Productos.jsx'))
const Categorias = lazy(() => import('./panel/Categorias.jsx'))
const Inventario = lazy(() => import('./panel/Inventario.jsx'))
const Clientes = lazy(() => import('./panel/Clientes.jsx'))
const Reportes = lazy(() => import('./panel/Reportes.jsx'))
const Configuracion = lazy(() => import('./panel/Configuracion.jsx'))

function Privada({ children, admin }) {
  const { user, esAdmin } = useAuth()
  if (!user) return <Navigate to="/admin" replace />
  if (admin && !esAdmin) return <Navigate to="/panel/inicio" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/categoria/:id" element={<Catalogo />} />
          <Route path="/producto/:id" element={<Producto />} />
          <Route path="/pedido" element={<Consulta />} />
        </Route>
        <Route path="/admin" element={<Login />} />
        <Route path="/login" element={<Navigate to="/admin" replace />} />
        <Route path="/panel" element={<Privada><AdminLayout /></Privada>}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<PInicio />} />
          <Route path="caja" element={<Caja />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="productos" element={<Productos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="inventario" element={<Privada admin><Inventario /></Privada>} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="reportes" element={<Privada admin><Reportes /></Privada>} />
          <Route path="configuracion" element={<Privada admin><Configuracion /></Privada>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
