import { defineConfig } from 'vite'

export default defineConfig(async () => {
  // Import dinámico para cargar el plugin ESM-only sin requerir "type":"module"
  const reactPlugin = (await import('@vitejs/plugin-react')).default

  return {
    base: '/Retrabajos-Kitteo/',
    plugins: [reactPlugin()],
  }
})
