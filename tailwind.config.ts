import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#145231",
          950: "#052e16",
        },
        accent: {
          purple: "#8b5cf6",
          orange: "#fed7aa",
        },
      },
      backgroundImage: {
        "gradient-light": "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #f5e6ff 100%)",
        "gradient-dark": "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1f0f3d 100%)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
      },
      borderRadius: {
        "3xl": "1.5rem",
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
        "glass-dark": "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
      },
      spacing: {
        "128": "32rem",
        "144": "36rem",
        "160": "40rem",
        "176": "44rem",
      },
      fontSize: {
        "2.5xl": "1.625rem",
        "3.5xl": "2rem",
        "4.5xl": "2.5rem",
      },
      maxWidth: {
        "screen-2xl": "1400px",
        "screen-xl": "1200px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-in-out",
        "pulse-soft": "pulseSoft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "smooth-scale": "smoothScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth-fade": "smoothFade 0.4s ease-out",
        "apple-slide": "appleSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "apple-bounce": "appleBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        smoothScale: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        smoothFade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        appleSlide: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        appleBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
