import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
        // iOS System Colors (retained for status/functional use)
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
        // Surfaces — Passport Stamp warm palette
        surface: {
          primary: '#F5F0EB',
          elevated: 'rgba(255,252,247,0.85)',
          card: 'rgba(255,252,247,0.92)',
        },
        // Text — deep navy + warm grays
        apple: {
          primary: '#1e293b',
          secondary: '#78716c',
          tertiary: '#a8a29e',
        },
        // Dark card
        dark: {
          DEFAULT: '#1e293b',
          secondary: '#334155',
        },
        // Status colors
        status: {
          todo: '#dc2626',
          progress: '#d97706',
          done: '#16a34a',
          waiting: '#78716c',
        },
        // Trip phase colors — warm tones
        phase: {
          pre: '#7c3aed',
          during: '#16a34a',
          post: '#2563eb',
        },
        // Task priority colors
        priority: {
          low: '#78716c',
          medium: '#2563eb',
          high: '#d97706',
          urgent: '#dc2626',
        },
        // Trip color palette — warm desert/earth
        trip: {
          mint: '#6AECE1',
          teal: '#26CCC2',
          yellow: '#FFF57E',
          orange: '#FFB76C',
        },
        // Passport stamp aesthetic — primary design language
        passport: {
          cream: '#F5F0EB',
          'cream-light': '#FAF8F5',
          'cream-dark': '#E8E0D8',
          rust: '#b45309',
          'rust-light': '#d97706',
          'rust-dark': '#92400e',
          terracotta: '#c2410c',
          slate: '#1e293b',
          'slate-light': '#334155',
          navy: '#0f172a',
          sage: '#4d7c0f',
          sand: '#d6cfc7',
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
        sans: ['DM Sans', 'Heebo', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      fontSize: {
        hero: ['34px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-1.5px' }],
        title: ['22px', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.5px' }],
        headline: ['17px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.3px' }],
        body: ['15px', { lineHeight: '1.6', fontWeight: '400', letterSpacing: '0' }],
        subhead: ['13px', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.5px' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'apple-sm': '8px',
        apple: '12px',
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
        glass: '0 1px 3px rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'glass-float': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'dark-card': '0 8px 30px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
