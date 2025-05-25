/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#8257E5',
        secondary: '#1F1E25',
        accent: '#00875F',
      },
    },
  },
  plugins: [],
};
