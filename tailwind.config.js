/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#07040F", 900: "#0B0718", 800: "#130C26", 700: "#1B1236", 600: "#261A4A", 500: "#35256A" },
        brand: { DEFAULT: "#8B3DFF", 400: "#A66BFF", 600: "#7C1FE0" },
        gold: "#E8A400",
        fg: "rgb(var(--fg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
