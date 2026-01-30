import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // o el plugin que uses

export default defineConfig({
  base: '/Retrabajos-Kitteo/', // <- importante para GitHub Pages (project site)
  plugins: [react()],
})
