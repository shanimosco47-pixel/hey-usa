// Currency conversion utility with localStorage caching
// Uses a fallback rate when API is unavailable

import { retryWithBackoff } from './retry'

const CACHE_KEY = 'hey-usa-exchange-rate'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const FALLBACK_RATE = 3.57 // Approximate ILS per USD (March 2026)

interface CachedRate {
  rate: number // USD → ILS
  timestamp: number
}

function getCachedRate(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedRate = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null
    return cached.rate
  } catch {
    return null
  }
}

function setCachedRate(rate: number) {
  try {
    const entry: CachedRate = { rate, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage might be full or unavailable
  }
}

export async function getExchangeRate(): Promise<number> {
  // Try cache first
  const cached = getCachedRate()
  if (cached) return cached

  // Fetch from free API with retry
  try {
    const rate = await retryWithBackoff(async () => {
      const response = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!response.ok) throw new Error(`Exchange rate API ${response.status}`)
      const data = await response.json()
      const r = data?.rates?.ILS
      if (typeof r !== 'number' || r <= 0) throw new Error('Invalid rate')
      return r
    }, 2)
    setCachedRate(rate)
    return rate
  } catch {
    // API unavailable after retries, use fallback
  }

  return FALLBACK_RATE
}

export async function convertCurrency(
  amount: number,
  from: 'ILS' | 'USD',
  to: 'ILS' | 'USD',
): Promise<{ result: number; rate: number }> {
  const rate = await getExchangeRate()

  if (from === to) return { result: amount, rate: 1 }

  if (from === 'USD' && to === 'ILS') {
    return { result: Math.round(amount * rate * 100) / 100, rate }
  }

  // ILS → USD
  const inverseRate = 1 / rate
  return { result: Math.round(amount * inverseRate * 100) / 100, rate }
}
