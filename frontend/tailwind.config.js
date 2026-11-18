/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark-never-enabled"]'],
  theme: {
    extend: {
      colors: {
        // Mint & Sage Color System (Light Theme Only)
        sage: {
          bg: '#F6FAF7',          // Primary background
          subtle: '#EDF5EF',      // Secondary background
          surface: '#FFFFFF',     // Card surface
          card: '#FFFFFF',        // Card surface
          mint: '#DCEFE3',        // Primary mint (activity indicators & progress)
          sage: '#A8D5B5',        // Sage green
          green: '#A8D5B5',       // Sage green (workout statistics & performance)
          action: '#6BA985',      // Action green (buttons, active states, CTA)
          actionHover: '#5A9473', // Action green hover
          primary: '#6BA985',     // Primary action button
          primaryHover: '#263D32',// Primary hover
          forest: '#263D32',      // Deep forest (primary text & important actions)
          text: '#263D32',        // Primary text
          muted: '#77847C',       // Secondary text
          border: '#E5EDE7',      // Borders
          highlight: '#EBF4EE',   // Pale green highlights
          lightMint: '#F0F8F3',   // Lightest mint surface
          glass: 'rgba(255, 255, 255, 0.85)',
        },
        // Backward compatibility mappings
        gym: {
          bg: '#F6FAF7',
          surface: '#FFFFFF',
          raised: '#EDF5EF',
          text: '#263D32',
          muted: '#77847C',
          accent: '#6BA985',
          secondary: '#A8D5B5',
          success: '#6BA985',
          warning: '#D99B4B',
          danger: '#D96565',
        },
        background: {
          dark: '#F6FAF7',
          card: '#FFFFFF',
          raised: '#EDF5EF',
          hover: '#EBF4EE',
          light: '#F6FAF7',
          lightCard: '#FFFFFF',
        },
        brand: {
          primary: '#6BA985',
          accent: '#A8D5B5',
          violet: '#6BA985',
          amber: '#D99B4B',
          rose: '#D96565',
          lime: '#6BA985',
          forest: '#263D32',
          mint: '#DCEFE3',
        }
      },
      boxShadow: {
        '3d': '0 20px 40px -15px rgba(38, 61, 50, 0.07), 0 0 0 1px #E5EDE7',
        '3d-hover': '0 30px 60px -12px rgba(38, 61, 50, 0.12), 0 0 0 1px #A8D5B5',
        'card': '0 4px 20px -2px rgba(38, 61, 50, 0.04), 0 0 0 1px #E5EDE7',
        'card-hover': '0 12px 30px -4px rgba(38, 61, 50, 0.08), 0 0 0 1px #A8D5B5',
        'float': '0 25px 50px -12px rgba(38, 61, 50, 0.15)',
        'glass': '0 8px 32px 0 rgba(38, 61, 50, 0.05)',
        'inner-mint': 'inset 0 2px 4px 0 rgba(107, 169, 133, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
