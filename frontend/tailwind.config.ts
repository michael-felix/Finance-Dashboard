import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fcfcfb",
          dark: "#1a1a19",
        },
        page: {
          DEFAULT: "#f9f9f7",
          dark: "#0d0d0d",
        },
        ink: {
          primary: "#0b0b0b",
          "primary-dark": "#ffffff",
          secondary: "#52514e",
          "secondary-dark": "#c3c2b7",
          muted: "#898781",
        },
        grid: {
          DEFAULT: "#e1e0d9",
          dark: "#2c2c2a",
        },
        baseline: {
          DEFAULT: "#c3c2b7",
          dark: "#383835",
        },
        gain: {
          DEFAULT: "#006300",
          dark: "#0ca30c",
        },
        loss: {
          DEFAULT: "#e34948",
          dark: "#e66767",
        },
        brand: {
          DEFAULT: "#2a78d6",
          dark: "#3987e5",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
