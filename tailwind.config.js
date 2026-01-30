/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solo los colores que NECESITAS
        gray: {
          750: '#2d3748',
        },
        blue: {
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
        green: {
          400: '#4ade80',
          600: '#16a34a',
        },
        red: {
          400: '#f87171',
          600: '#dc2626',
        },
        yellow: {
          300: '#fde047',
          600: '#ca8a04',
        }
      }
    },
  },
  // Elimina plugins complejos temporalmente
  plugins: [],
}
