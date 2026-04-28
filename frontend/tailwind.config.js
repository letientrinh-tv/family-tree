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
          50:  '#fdf5ee',
          100: '#f9e4ce',
          200: '#f2c99d',
          300: '#eaa76b',
          400: '#e28444',
          500: '#8B4513',
          600: '#7a3d11',
          700: '#65330e',
          800: '#4e270b',
          900: '#3c2415',
        },
        secondary: {
          DEFAULT: '#F5F0E8',
          dark: '#E8E0D0',
        },
        accent: {
          DEFAULT: '#2D5016',
          light: '#4a7a22',
          dark: '#1e3a0f',
        },
        tan: {
          DEFAULT: '#C4A882',
          light: '#D9C4A4',
          dark: '#9e8562',
        },
        parchment: '#F5F0E8',
        bark: '#3C2415',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'vintage': '2px 2px 8px rgba(60, 36, 21, 0.15)',
        'vintage-lg': '4px 4px 16px rgba(60, 36, 21, 0.2)',
      },
    },
  },
  plugins: [],
}
