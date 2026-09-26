import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        arena: {
          dark: "#0b0f19",
          panel: "#111827",
          card: "rgba(17, 24, 39, 0.75)",
        },
        element: {
          fire: {
            DEFAULT: "#f97316",
            glow: "#ef4444",
            dark: "#7c2d12",
          },
          ice: {
            DEFAULT: "#06b6d4",
            glow: "#3b82f6",
            dark: "#0c4a6e",
          },
          earth: {
            DEFAULT: "#10b981",
            glow: "#f59e0b",
            dark: "#064e3b",
          },
          wind: {
            DEFAULT: "#a855f7",
            glow: "#c084fc",
            dark: "#581c87",
          }
        }
      },
      animation: {
        'flame-pulse': 'flame 2s infinite ease-in-out',
        'ice-shimmer': 'ice 3s infinite linear',
        'wind-breeze': 'breeze 2.5s infinite linear',
        'earth-pulse': 'earth 4s infinite ease-in-out',
        'glow-pulse': 'glow 2s infinite ease-in-out',
      },
      keyframes: {
        flame: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.04)' },
        },
        ice: {
          '0%': { opacity: '0.7', borderColor: 'rgba(56, 189, 248, 0.4)' },
          '50%': { opacity: '1', borderColor: 'rgba(56, 189, 248, 0.9)' },
          '100%': { opacity: '0.7', borderColor: 'rgba(56, 189, 248, 0.4)' },
        },
        breeze: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { opacity: '0.7' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        earth: {
          '0%, 100%': { filter: 'drop-shadow(0 0 2px rgba(180, 83, 9, 0.5))' },
          '50%': { filter: 'drop-shadow(0 0 8px rgba(217, 119, 6, 0.9))' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(249, 115, 22, 0.7)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
