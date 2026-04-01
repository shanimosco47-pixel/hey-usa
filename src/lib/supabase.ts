import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Hey USA] Supabase env vars missing — running in offline-only mode')
}

// Retry-aware fetch for transient network/server errors
const MAX_RETRIES = 2
const BASE_DELAY_MS = 500

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(input, init)
      // Retry on server errors (5xx) — not on client errors (4xx)
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt))
        continue
      }
      return response
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt))
      }
    }
  }
  throw lastError
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: { fetch: fetchWithRetry },
      })
    : null
