/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        white: "#F8FAFC",
        gray: {
          800: "#202020",
          700: "#252525",
          600: "#2C2C2C",
          500: "#3D3D3D",
          400: "#5A5A5A",
          300: "#858585",
          100: "#E1E1E1",
        },
        red: {
          300: "#CD5E55",
        },
      },
    },
  },
  plugins: [],
};
