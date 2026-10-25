/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tata: {
          dark: '#070E1E',
          navy: '#0B172E',
          card: '#122040',
          hover: '#182C58',
          border: '#1E3567',
          blue: '#1E40AF',
          lightBlue: '#3B82F6',
          sky: '#38BDF8',
          red: '#E11D48',
          accentRed: '#F43F5E',
          gold: '#F59E0B',
          emerald: '#10B981',
          textMuted: '#94A3B8',
          textMain: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
