import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary sunshine yellow palette
        sun: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f"
        },
        sidebar: {
          bg: "#ffffff",
          hover: "#fef9ee",
          active: "#fef3c7",
          border: "#f3f0e8"
        },
        page: {
          bg: "#fafaf7",
          card: "#ffffff",
          border: "#e8e5dd"
        },
        accent: {
          DEFAULT: "#f59e0b",
          hover: "#d97706",
          soft: "#fef3c7",
          text: "#92400e"
        },
        success: {
          DEFAULT: "#16a34a",
          soft: "#dcfce7"
        },
        warn: {
          DEFAULT: "#ea580c",
          soft: "#fff7ed"
        },
        danger: {
          DEFAULT: "#dc2626",
          soft: "#fef2f2"
        },
        channel: {
          instagram: "#e1306c",
          facebook: "#1877f2",
          linkedin: "#0077b5",
          twitter: "#1da1f2"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        lg: "0 4px 12px rgba(0,0,0,0.08)",
        glow: "0 0 30px rgba(245,158,11,0.2)"
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
