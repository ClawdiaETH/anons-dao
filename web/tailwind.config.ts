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
        // Nouns-inspired light theme
        // Warm palette (Dawn cycle)
        warm: {
          bg: '#f5f3f1',
          surface: '#f9f1f1',
          text: '#221b1a',
          muted: '#8f7e7c',
          border: 'rgb(207, 189, 186)',
        },
        // Cool palette (Dusk cycle)
        cool: {
          bg: '#f3f3f7',
          surface: '#e9ebf3',
          text: '#151c3b',
          muted: '#79809c',
          border: 'rgb(189, 192, 207)',
        },
        // Shared colors
        nouns: {
          bg: '#f5f3f1',        // Default warm background
          surface: '#f4f4f8',   // Cards/surfaces
          text: '#212529',      // Primary text (brand black)
          muted: '#8c8d92',     // Secondary text
          border: '#e2e3eb',    // Borders
          red: '#d63c5e',       // Primary accent
          blue: '#4965f0',      // Secondary accent
          green: '#43b369',     // Success
          yellow: '#e4a81d',    // Warning
        },
        // Legacy mappings for easier migration
        void: '#212529',        // Dark text
        charcoal: '#f4f4f8',    // Surface (now light)
        snow: '#212529',        // Primary text (now dark on light)
        smoke: '#8c8d92',       // Secondary text
        dawn: '#d63c5e',        // Red accent (Nouns red)
        dusk: '#4965f0',        // Blue accent (Nouns blue)
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
};
export default config;
