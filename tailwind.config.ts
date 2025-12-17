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
        // Primary gradient colors
        primary: {
          DEFAULT: "#6366f1",
          light: "#8b5cf6",
        },
        // Background colors from design
        bg: {
          primary: "#0f0f23",
          secondary: "#1a1a2e",
          card: "#16213e",
        },
        // Text colors from design
        text: {
          primary: "#ffffff",
          secondary: "#a0aec0",
          muted: "#718096",
        },
        // Status colors from design
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      },
      borderRadius: {
        card: "12px",
      },
      /**
       * Animation keyframes for UI transitions
       * Requirements: 7.7, 7.10
       */
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      /**
       * Animation utilities for smooth transitions
       */
      animation: {
        "slide-in-right": "slide-in-right 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-bottom": "slide-in-bottom 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
      /**
       * Transition timing functions for smooth interactions
       */
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
