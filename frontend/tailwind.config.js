/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          low: "#10b981",    // Verde esmeralda
          medium: "#f59e0b", // Ámbar
          high: "#ef4444",   // Rojo carmesí
        }
      }
    },
  },
  plugins: [],
};