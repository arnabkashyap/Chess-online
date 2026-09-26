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
      },
      animation: {
        'flame-pulse': 'flame 2s infinite ease-in-out',
        'ice-shimmer': 'ice 3s infinite linear',
        'wind-breeze': 'breeze 2.5s infinite linear',
        'earth-pulse': 'earth 4s infinite ease-in-out',
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
        }
      }
    },
  },
  plugins: [],
};
export default config;
