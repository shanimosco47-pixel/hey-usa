import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    // Edge-function logic is covered too where it is pure TypeScript with no
    // Deno APIs (e.g. the email-scan pattern classifier). CI never deployed a
    // regression there because nothing tested it.
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'supabase/functions/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
