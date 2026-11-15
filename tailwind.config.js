/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          dark: '#0f172a',
          gray: '#64748b',
          light: '#f8fafc',
          orange: '#f97316',
        },
        admin: {
          500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d',
        },
        primary: {
          500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af',
        }
      }
    },
  },
  plugins: [],
}