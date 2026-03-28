/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#6366f1', // Electric Indigo
          600: '#4f46e5',
          900: '#312e81',
        },
        success: '#10b981', // Emerald Neon
        warning: '#f59e0b', // Amber
        danger: '#f43f5e',  // Rose
        dark: {
          bg: '#020617',    // Deep Navy
          card: '#0f172a',
        }
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          'from': { 'box-shadow': '0 0 10px -5px #6366f1' },
          'to': { 'box-shadow': '0 0 20px 2px #6366f1' },
        }
      }
    },
  },
  plugins: [],
}
