/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        status: {
          inwarded: '#94a3b8',
          assigned: '#fb923c',
          in_progress: '#3b82f6',
          completed: '#a855f7',
          qc_review: '#eab308',
          ready_for_sale: '#22c55e',
        }
      }
    },
  },
  plugins: [],
}
