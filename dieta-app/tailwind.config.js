/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f3f7f4', 100: '#e3ede6', 200: '#c7dbcd', 300: '#a0c1aa',
          400: '#74a083', 500: '#538466', 600: '#3f6a50', 700: '#335542',
          800: '#2b4536', 900: '#24392e',
        },
      },
      fontFamily: { sans: ['system-ui', '-apple-system', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
