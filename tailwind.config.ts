import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Add the sans-serif font from our layout
        sans: ['var(--font-inter)'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;