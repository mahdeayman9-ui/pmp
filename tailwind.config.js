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
          50: '#f0f9fa',
          100: '#daf2f5',
          200: '#b4e1e6',
          300: '#8ed0d7',
          400: '#68bfc8',
          500: '#5f979d',
          600: '#4c7a7e',
          700: '#395c5f',
          800: '#263d40',
          900: '#131f20',
        },
        accent: {
          light: '#b4e1e6',
          dark: '#5f979d',
        }
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(95, 151, 157, 0.12), 0 10px 20px -2px rgba(95, 151, 157, 0.06)',
        'medium': '0 4px 25px -5px rgba(95, 151, 157, 0.18), 0 10px 20px -5px rgba(95, 151, 157, 0.1)',
        'strong': '0 10px 40px -10px rgba(95, 151, 157, 0.3), 0 20px 25px -5px rgba(95, 151, 157, 0.15)',
        'glow': '0 0 20px rgba(180, 225, 230, 0.4)',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}