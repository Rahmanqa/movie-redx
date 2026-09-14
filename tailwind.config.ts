import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08080a",
        foreground: "#ededed",
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          primary: "#e50914",
          crimson: "#d61c28",
          glow: "#ff2a3a",
          dark: "#0b0b0e",
          card: "#121216",
          cardHover: "#191920",
          border: "#23232b",
          muted: "#8e8e9c",
        },
      },
      backgroundImage: {
        "cinematic-gradient": "linear-gradient(180deg, rgba(8,8,10,0) 0%, rgba(8,8,10,0.85) 65%, #08080a 100%)",
        "radial-spotlight": "radial-gradient(circle at 50% 20%, rgba(229,9,20,0.15) 0%, rgba(8,8,10,0) 70%)",
        "redx-glow": "linear-gradient(135deg, #e50914 0%, #b81d24 100%)",
      },
      boxShadow: {
        "glow-sm": "0 0 15px rgba(229, 9, 20, 0.25)",
        "glow-md": "0 0 25px rgba(229, 9, 20, 0.4)",
        "glow-lg": "0 0 40px rgba(229, 9, 20, 0.55)",
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
