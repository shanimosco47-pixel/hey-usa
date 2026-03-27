import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
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
          primary: '#E8FAF8',
          elevated: 'rgba(255,255,255,0.75)',
          card: 'rgba(255,255,255,0.82)',
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
        // Trip color palette
        trip: {
          mint: '#6AECE1',
          teal: '#26CCC2',
          yellow: '#FFF57E',
          orange: '#FFB76C',
        },
        // shadcn/ui semantic colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
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
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'apple-sm': '8px',
        'apple': '12px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shake: 'shake 0.4s ease-in-out',
        'page-enter': 'page-enter 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'list-item-enter': 'list-item-enter 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) backwards',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        marquee: 'marquee var(--duration) infinite linear',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'glass-float': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'dark-card': '0 8px 30px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
