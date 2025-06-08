/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
        secondary: '#f0f2f5',
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
} 