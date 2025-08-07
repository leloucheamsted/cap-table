/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#23555a',      // Indigo 500
        primaryDark: '#FDE047',  // Indigo 900
        lightGray: '#E5E7EB',    // Gray 200
        darkText: '#000000',     // Gray 900
        background: '#e1decf',   // Gray 50
        error: '#EF4444',        // Red 500
      },
      fontFamily: {
        ubuntu: ['Ubuntu', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

