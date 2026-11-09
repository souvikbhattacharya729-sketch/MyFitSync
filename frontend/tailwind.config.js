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
        background: {
          dark: '#0B0F17',
          card: '#131B2A',
          hover: '#1B263B',
          light: '#F8FAFC',
          lightCard: '#FFFFFF',
        },
        brand: {
          primary: '#10B981', // Athletic Emerald
          accent: '#06B6D4',  // Electric Cyan
          violet: '#8B5CF6',  // Recovery Violet
          amber: '#F59E0B',   // Warning/Caution
          rose: '#F43F5E',    // Strain/High Load
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
