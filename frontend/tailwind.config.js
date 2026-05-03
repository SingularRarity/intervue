/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent — emerald (ownable in HR tech)
        primary: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Dark surface scale — deep slate (sidebar, nav, hero)
        dark: {
          50:  '#f8f7f5',
          100: '#e8ebf4',
          200: '#d0d6e8',
          300: '#a8b4d0',
          400: '#7a8aad',
          500: '#5a6a8a',
          600: '#4a5472',
          700: '#2e3650',
          800: '#252c42',
          900: '#1e2235',
          950: '#0d1117',
        },
        // Warm gray canvas — main content background
        canvas: '#f8f7f5',
      },
      fontFamily: {
        sans:    ['Geist', 'system-ui', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'serif'],
        mono:    ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl':  '8px',
        '2xl': '12px',
        '3xl': '16px',
      },
    },
  },
  plugins: [],
}
