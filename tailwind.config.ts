import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.tsx"],
  theme: { extend: {
    colors: { navy: "#14213D", teal: { DEFAULT: "#0F766E", soft: "#E1F0EE" }, sand: "#EFEDEA", paper: "#FAF9F7", line: "#DDD9D3", ink: "#1E2430", mute: "#6B7280", gold: "#B7791F", goldsoft: "#FBF1DD", alert: "#B42318", alertsoft: "#FBE9E7" },
    fontFamily: { sans: ['"Inter Variable"', "system-ui", "sans-serif"] } } },
} satisfies Config;
