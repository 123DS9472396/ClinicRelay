import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        sidebar: "#0A0F1D",
        teal: { DEFAULT: "#059669", soft: "#ECFDF5", dark: "#047857" },
        brand: { DEFAULT: "#00C365", dark: "#00A855", light: "#E6FBF0" },
        sand: "#F1F5F9",
        paper: "#FFFFFF",
        line: "#E2E8F0",
        ink: "#0F172A",
        mute: "#64748B",
        gold: "#D97706",
        goldsoft: "#FEF3C7",
        alert: "#DC2626",
        alertsoft: "#FEF2F2",
        base: "#F8FAFC",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
      },
    },
  },
} satisfies Config;
