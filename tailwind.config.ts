import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neon: {
          blue: "#5ee0ff",
          pink: "#ff4ecd",
          green: "#5eff9e",
          purple: "#9b5eff"
        },
        surface: {
          base: "#0c0f16",
          raised: "#131826"
        }
      },
      boxShadow: {
        neon: "0 0 10px rgba(94, 224, 255, 0.6)"
      }
    }
  },
  plugins: []
};

export default config;



