
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mmsu: {
          green: '#014421',
          gold: '#FFD700',
          darkGreen: '#003318',
          lightGold: '#FFF2B2'
        }
      }
    },
  },
  plugins: [],
}
