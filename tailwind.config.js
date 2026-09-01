/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clipars: {
          bg: "#0a0a0f",
          card: "#14141c",
          border: "#232333",
          accent: "#ff3b30",
          accent2: "#ff6b35",
          muted: "#9aa0a6",
        }
      },
      fontFamily: {
        sans: ["Inter","system-ui","sans-serif"],
      }
    },
  },
  plugins: [],
};
