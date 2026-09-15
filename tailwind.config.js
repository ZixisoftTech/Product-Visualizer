/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        showroom: {
          50: '#faf8f5',
          100: '#f4efe6',
          200: '#e7dcce',
          300: '#d5c2ad',
          400: '#be9f83',
          500: '#ab8161',
          600: '#9b6f52',
          700: '#7f5842',
          800: '#674838',
          900: '#553c30',
          950: '#2e1e17',
        }
      }
    },
  },
  plugins: [],
}
