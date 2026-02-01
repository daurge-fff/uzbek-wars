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
        // Uzbek cultural color palette
        primary: {
          DEFAULT: '#D4AF37', // Gold
          light: '#E5C158',
          dark: '#B8941F'
        },
        secondary: {
          DEFAULT: '#8B4513', // Brown
          light: '#A0522D',
          dark: '#654321'
        },
        accent: {
          DEFAULT: '#FF6B35', // Orange
          light: '#FF8C5A',
          dark: '#E54A1A'
        },
        background: {
          primary: '#FFF8DC', // Cream
          secondary: '#F5E6D3' // Light beige
        },
        text: {
          primary: '#2C1810', // Dark brown
          secondary: '#5D4E37' // Medium brown
        },
        // Status colors
        success: '#4CAF50', // Green
        danger: '#F44336', // Red
        warning: '#FF9800' // Orange
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      // Mobile-first breakpoints
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px'
      },
      // Minimum touch target size for mobile
      minHeight: {
        'touch': '44px'
      },
      minWidth: {
        'touch': '44px'
      }
    },
  },
  plugins: [],
}
