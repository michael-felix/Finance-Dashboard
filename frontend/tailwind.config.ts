import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Page background (body).
        page: {
          DEFAULT: "#f8f9f9",
          dark: "#0f1720",
        },
        // Card / panel background.
        surface: {
          DEFAULT: "#ffffff",
          dark: "#182430",
        },
        // Always-dark top nav bar, in both themes (Stack Overflow-style).
        nav: {
          DEFAULT: "#171a22",
          border: "#2c2f36",
        },
        ink: {
          primary: "#232629",
          "primary-dark": "#f1f2f3",
          secondary: "#6a737c",
          "secondary-dark": "#9fa6ad",
          muted: "#848d95",
          "muted-dark": "#78828a",
        },
        border: {
          DEFAULT: "#d6d9dc",
          dark: "#2f3a44",
        },
        grid: {
          DEFAULT: "#e1e0d9",
          dark: "#2c2c2a",
        },
        gain: {
          DEFAULT: "#006300",
          dark: "#3dd63d",
        },
        loss: {
          DEFAULT: "#d1383d",
          dark: "#f0716f",
        },
        // Primary action color (buttons, links).
        brand: {
          DEFAULT: "#0074cc",
          dark: "#4098ff",
        },
        // Logo / highlight accent — used sparingly, not for actions.
        accent: {
          DEFAULT: "#f48024",
          dark: "#ffa143",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
