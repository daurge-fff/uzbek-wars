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
        // Modern gradient color palette (indigo-purple-pink)
        primary: {
          DEFAULT: '#6366f1', // Indigo
          light: '#818cf8',
          dark: '#4f46e5'
        },
        secondary: {
          DEFAULT: '#a855f7', // Purple
          light: '#c084fc',
          dark: '#9333ea'
        },
        accent: {
          DEFAULT: '#ec4899', // Pink
          light: '#f472b6',
          dark: '#db2777'
        },
        background: {
          primary: '#ffffff', // White
          secondary: '#f9fafb' // Light gray
        },
        text: {
          primary: '#111827', // Dark gray
          secondary: '#6b7280' // Medium gray
        },
        // Status colors
        success: '#10b981', // Green
        danger: '#ef4444', // Red
        warning: '#f59e0b' // Amber
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
