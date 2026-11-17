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
        gym: {
          bg: '#0B0D10',        // Deep gym-friendly charcoal
          surface: '#161A21',   // Card background
          raised: '#20252E',    // Raised surface (cards on cards, active tabs)
          text: '#F5F7FA',      // Crisp high-contrast white
          muted: '#9AA3B2',     // Labels & secondary info
          accent: '#C6FF3D',    // Electric Lime (buttons, active states, CTA)
          secondary: '#4DA3FF', // Bright sky blue (charts & data)
          success: '#3DDC84',   // Positive status
          warning: '#FFB020',   // Cautionary metrics
          danger: '#FF5A5F',    // Fatigue/Strain
        },
        background: {
          dark: '#0B0D10',
          card: '#161A21',
          raised: '#20252E',
          hover: '#20252E',
          light: '#F8FAFC',
          lightCard: '#FFFFFF',
        },
        brand: {
          primary: '#C6FF3D',   // Electric Lime
          accent: '#4DA3FF',    // Data Blue
          violet: '#8B5CF6',    // Recovery Violet
          amber: '#FFB020',     // Warning
          rose: '#FF5A5F',      // Danger
          lime: '#C6FF3D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
