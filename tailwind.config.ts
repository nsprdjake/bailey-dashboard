import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bailey: {
          tan: '#d4a373',
          'tan-dark': '#b8885c',
          brown: '#8b7355',
          cream: '#f4e4d7',
          green: '#7fb069',
          bg: '#faf8f5',
        },
      },
      animation: {
        'wiggle': 'wiggle 0.5s ease-in-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
