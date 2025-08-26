/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9fa',
          100: '#daf1f4',
          200: '#b4e1e6',
          300: '#8dd1d8',
          400: '#6bb8c2',
          500: '#5f979d',
          600: '#4a7a80',
          700: '#3a6166',
          800: '#2d4d52',
          900: '#243e42',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        'arabic': ['Cairo', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(95, 151, 157, 0.1), 0 10px 20px -2px rgba(95, 151, 157, 0.04)',
        'medium': '0 4px 25px -5px rgba(95, 151, 157, 0.15), 0 10px 20px -5px rgba(95, 151, 157, 0.08)',
        'strong': '0 10px 40px -10px rgba(95, 151, 157, 0.25), 0 20px 25px -5px rgba(95, 151, 157, 0.1)',
      }
    },
  },
  plugins: [],
};
