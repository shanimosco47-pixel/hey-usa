import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          DEFAULT: '#faf3e8',
          dark: '#f0e4cc',
        },
        terracotta: {
          DEFAULT: '#c44d34',
          light: '#e8735e',
        },
        sage: {
          DEFAULT: '#2d7d46',
          light: '#4a9e62',
        },
        sky: {
          DEFAULT: '#4a90d9',
          light: '#7ab5e8',
        },
        gold: {
          DEFAULT: '#f5c542',
          dark: '#8B6914',
        },
        cream: '#fff5e6',
        brown: {
          DEFAULT: '#5c3d2e',
          light: '#8b6f5e',
        },
        status: {
          todo: '#e17055',
          progress: '#fdcb6e',
          done: '#00b894',
          waiting: '#636e72',
        },
        group: {
          pre: '#6c5ce7',
          during: '#00b894',
          post: '#0984e3',
        },
      },
      fontFamily: {
        hebrew: [
          'Segoe UI',
          'Arial',
          'Tahoma',
          'Noto Sans Hebrew',
          'sans-serif',
        ],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config
