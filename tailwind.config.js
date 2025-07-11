/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js}"],
  theme: {
    extend: {
      fontFamily: {
        advent: ['"Advent Pro"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
