/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f7f5',
          100: '#dbe9e2',
          500: '#0f766e',
          600: '#0d6259',
          700: '#0a4f48',
        },
      },
    },
  },
  plugins: [],
}
