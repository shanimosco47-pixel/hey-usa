import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // iOS System Colors
        ios: {
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          indigo: '#5856D6',
          teal: '#5AC8FA',
          pink: '#FF2D55',
          gray: '#8E8E93',
        },
        // Surfaces
        surface: {
          primary: '#f5f5f7',
          elevated: 'rgba(255,255,255,0.72)',
          card: 'rgba(255,255,255,0.80)',
        },
        // Apple text
        apple: {
          primary: '#1d1d1f',
          secondary: '#86868b',
          tertiary: '#aeaeb2',
        },
        // Dark card
        dark: {
          DEFAULT: '#1d1d1f',
          secondary: '#2d2d30',
        },
        // Status colors (iOS variants)
        status: {
          todo: '#FF3B30',
          progress: '#FF9500',
          done: '#34C759',
          waiting: '#8E8E93',
        },
        // Trip phase colors
        phase: {
          pre: '#5856D6',
          during: '#34C759',
          post: '#007AFF',
        },
        // Task priority colors
        priority: {
          low: '#8E8E93',
          medium: '#007AFF',
          high: '#FF9500',
          urgent: '#FF3B30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Heebo', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'hero': ['34px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-1.5px' }],
        'title': ['22px', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.5px' }],
        'headline': ['17px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.3px' }],
        'body': ['15px', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0' }],
        'subhead': ['13px', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0' }],
        'caption': ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.5px' }],
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple': '12px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'list-item-enter': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        'page-enter': 'page-enter 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'list-item-enter': 'list-item-enter 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'glass-float': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'dark-card': '0 8px 30px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config
