import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  base: '/hey-usa/',
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json,pdf}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/hey-usa/index.html',
        navigateFallbackDenylist: [/^\/hey-usa\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Passports, booking PDFs and photos live in Supabase Storage. Without
            // this they are network-only, so they fail to open exactly when they
            // matter most — abroad, at a border or a campground with no signal.
            // CacheFirst: an uploaded file never changes, so once it has been
            // opened online it stays available offline for the whole trip.
            urlPattern: /^https:\/\/.*supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days — outlasts the trip
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true, // PDF viewers fetch byte ranges
            },
          },
        ],
      },
      manifest: {
        name: 'Hey USA — המסע שלנו',
        short_name: 'Hey USA',
        description: 'מתכננים טיול משפחתי לארה״ב',
        theme_color: '#c44d34',
        background_color: '#ffffff',
        display: 'standalone',
        dir: 'rtl',
        lang: 'he',
        start_url: '/hey-usa/',
        scope: '/hey-usa/',
        icons: [
          { src: 'pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          {
            src: 'pwa-192x192.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    ...(process.env.ANALYZE
      ? [visualizer({ open: true, filename: 'dist/bundle-stats.html', gzipSize: true })]
      : []),
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react-dom|react-router-dom/.test(id)) return 'vendor-react'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('@radix-ui')) return 'vendor-radix'
            if (id.includes('@vis.gl/react-google-maps')) return 'vendor-maps'
            if (id.includes('dexie')) return 'vendor-dexie'
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
            if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-tiptap'
            if (
              id.includes('react-markdown') ||
              id.includes('remark') ||
              id.includes('unified') ||
              id.includes('mdast') ||
              id.includes('micromark') ||
              id.includes('dompurify')
            )
              return 'vendor-markdown'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
