/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Space lounge palette inspired by provided reference
        space: {
          bg: "#0a0b1e", // deep space
          bg2: "#0d1028",
          panel: "#111332",
          ring: "#1a1f4b",
          neon: {
            purple: "#8a3cff",
            magenta: "#d13cff",
            blue: "#3cc5ff",
            cyan: "#4df1ff",
          },
          accent: {
            pink: "#ff6bd6",
            violet: "#b36bff",
            aqua: "#6bfff3",
          },
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(138, 60, 255, 0.35)",
        glowBlue: "0 0 30px rgba(60, 197, 255, 0.35)",
        glass: "0 8px 24px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'space-gradient': "radial-gradient(1000px 600px at 80% -100px, rgba(60,197,255,0.25), transparent), radial-gradient(900px 500px at -100px 80%, rgba(138,60,255,0.25), transparent), linear-gradient(180deg, #0a0b1e, #0d1028)",
        'aurora-purple': "conic-gradient(from 200deg at 50% 50%, rgba(138,60,255,0.15), rgba(60,197,255,0.10), transparent)",
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
