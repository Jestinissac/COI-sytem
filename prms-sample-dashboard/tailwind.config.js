// Tailwind CSS configuration (ESM)
import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Midone-like accent palette for demo
        primary: {
          DEFAULT: '#4C6FFF',
          50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC',
          400: '#818CF8', 500: '#6366F1', 600: '#4C6FFF', 700: '#3E4ECC', 800: '#2F3A99', 900: '#1F2766'
        },
        audit: {
          DEFAULT: '#2563EB', // blue-600
          soft: '#DBEAFE'
        },
        tax: {
          DEFAULT: '#F59E0B', // amber-500
          soft: '#FEF3C7'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)'
      },
      borderRadius: {
        xl: '0.75rem'
      }
    },
  },
  plugins: [forms],
}
