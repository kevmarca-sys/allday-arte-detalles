import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En desarrollo, /api se redirige a la API local (puerto 8080).
// Se quita el encabezado Origin para poder probar desde el celular en la misma red.
const api = {
  target: process.env.VITE_API_PROXY || 'http://localhost:8080',
  changeOrigin: true,
  configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
}

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy: { '/api': api } },
  preview: { host: true, port: 4173, proxy: { '/api': api } },
})
