import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  base: '/Retrabajos-Kitteo/',
  
  plugins: [
    react({
      // Fuerza transformación JSX a JS
      jsxRuntime: 'automatic',
      babel: {
        presets: ['@babel/preset-react', '@babel/preset-typescript']
      }
    })
  ],
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    
    // Configuración específica para asegurar JS
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // Sirve archivos estáticos desde public/
  publicDir: 'public'
})
