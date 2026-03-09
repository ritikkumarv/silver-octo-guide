/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mgm: {
          bg: "#0a0e1a",
          sidebar: "#0c1021",
          card: "#111827",
          "card-hover": "#1a2332",
          border: "#1e293b",
          "border-light": "#334155",
          accent: "#3b82f6",
          "accent-light": "#60a5fa",
          "accent-dark": "#2563eb",
          success: "#10b981",
          danger: "#ef4444",
          warning: "#f59e0b",
          info: "#06b6d4",
          purple: "#8b5cf6",
          pink: "#ec4899",
        },
        montgomery: {
          gold: "#d4a843",
          dark: "#1a1a2e",
          darker: "#0f0f1e",
          card: "#16213e",
          accent: "#e94560",
          blue: "#0f3460",
          surface: "#1e2a4a",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "fade-in": "fadeIn 0.6s ease-out",
        "count-up": "countUp 1s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
