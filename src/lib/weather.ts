// Weather service using Open-Meteo API (free, no API key needed)
// Fetches forecasts for trip destinations

export interface DayWeather {
  date: string
  tempMax: number // °C
  tempMin: number
  precipitationProbability: number // %
  weatherCode: number
  weatherLabel: string
  weatherEmoji: string
}

export interface DestinationWeather {
  city: string
  lat: number
  lng: number
  daily: DayWeather[]
}

// WMO Weather interpretation codes → Hebrew label + emoji
const WEATHER_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: 'שמש', emoji: '☀️' },
  1: { label: 'בעיקר בהיר', emoji: '🌤️' },
  2: { label: 'מעונן חלקית', emoji: '⛅' },
  3: { label: 'מעונן', emoji: '☁️' },
  45: { label: 'ערפל', emoji: '🌫️' },
  48: { label: 'ערפל קפוא', emoji: '🌫️' },
  51: { label: 'טפטוף קל', emoji: '🌦️' },
  53: { label: 'טפטוף', emoji: '🌦️' },
  55: { label: 'טפטוף חזק', emoji: '🌧️' },
  61: { label: 'גשם קל', emoji: '🌧️' },
  63: { label: 'גשם', emoji: '🌧️' },
  65: { label: 'גשם חזק', emoji: '🌧️' },
  71: { label: 'שלג קל', emoji: '🌨️' },
  73: { label: 'שלג', emoji: '🌨️' },
  75: { label: 'שלג כבד', emoji: '❄️' },
  80: { label: 'ממטרים', emoji: '🌦️' },
  81: { label: 'ממטרים חזקים', emoji: '🌧️' },
  82: { label: 'ממטרים עזים', emoji: '⛈️' },
  95: { label: 'סופת רעמים', emoji: '⛈️' },
  96: { label: 'סופת ברד', emoji: '⛈️' },
  99: { label: 'סופת ברד חזקה', emoji: '⛈️' },
}

function getWeatherInfo(code: number): { label: string; emoji: string } {
  return WEATHER_CODES[code] || { label: 'לא ידוע', emoji: '❓' }
}

// Key destinations with coordinates — one per city cluster
export const TRIP_DESTINATIONS = [
  { city: 'Los Angeles', lat: 33.94, lng: -118.41, days: ['2026-09-11'] },
  { city: 'Barstow', lat: 34.90, lng: -117.02, days: ['2026-09-11'] },
  { city: 'Las Vegas', lat: 36.11, lng: -115.17, days: ['2026-09-12'] },
  { city: 'Zion NP', lat: 37.29, lng: -112.95, days: ['2026-09-13', '2026-09-14'] },
  { city: 'Bryce Canyon', lat: 37.63, lng: -112.16, days: ['2026-09-15'] },
  { city: 'Capitol Reef', lat: 38.21, lng: -111.49, days: ['2026-09-16'] },
  { city: 'Moab', lat: 38.57, lng: -109.55, days: ['2026-09-17', '2026-09-18'] },
  { city: 'Monument Valley', lat: 37.00, lng: -110.08, days: ['2026-09-19'] },
  { city: 'Page, AZ', lat: 36.91, lng: -111.46, days: ['2026-09-20'] },
  { city: 'Grand Canyon', lat: 36.23, lng: -112.05, days: ['2026-09-21'] },
  { city: 'Kanab', lat: 37.04, lng: -112.53, days: ['2026-09-22'] },
  { city: 'Great Basin NP', lat: 39.09, lng: -114.23, days: ['2026-09-23'] },
  { city: 'Bishop, CA', lat: 37.37, lng: -118.40, days: ['2026-09-24'] },
  { city: 'Mammoth Lakes', lat: 37.64, lng: -118.97, days: ['2026-09-25'] },
  { city: 'Yosemite', lat: 37.75, lng: -119.57, days: ['2026-09-26', '2026-09-27'] },
  { city: 'California Coast', lat: 36.60, lng: -121.90, days: ['2026-09-28'] },
  { city: 'San Francisco', lat: 37.77, lng: -122.42, days: ['2026-09-29'] },
  { city: 'Los Angeles (Return)', lat: 33.94, lng: -118.41, days: ['2026-09-30'] },
] as const

// Map date → destination for quick lookup
export function getDestinationForDate(date: string): (typeof TRIP_DESTINATIONS)[number] | undefined {
  return TRIP_DESTINATIONS.find((d) => (d.days as readonly string[]).includes(date))
}

// Cache key
const WEATHER_CACHE_KEY = 'hey-usa-weather-cache'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

interface WeatherCache {
  timestamp: number
  data: Record<string, DestinationWeather>
}

function loadCache(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw) as WeatherCache
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) return null
    return cache
  } catch {
    return null
  }
}

function saveCache(data: Record<string, DestinationWeather>) {
  try {
    const cache: WeatherCache = { timestamp: Date.now(), data }
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache))
  } catch { /* quota exceeded — ignore */ }
}

// Check if a date is more than 14 days in the future
function isBeyondForecastRange(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays > 14
}

// Shift a date string back by one year (2026 → 2025)
function shiftYearBack(dateStr: string): string {
  return dateStr.replace(/^2026-/, '2025-')
}

// Shift a date string forward by one year (2025 → 2026)
function shiftYearForward(dateStr: string): string {
  return dateStr.replace(/^2025-/, '2026-')
}

// Estimate precipitation probability from daily precipitation sum (mm)
function estimatePrecipProbability(precipSum: number): number {
  if (precipSum <= 0.1) return 0
  if (precipSum <= 1) return 15
  if (precipSum <= 5) return 40
  if (precipSum <= 15) return 65
  return 85
}

// Fetch weather for a single destination
// Uses archive API (last year's data) when trip dates are beyond forecast range
async function fetchDestinationWeather(
  city: string,
  lat: number,
  lng: number,
): Promise<DestinationWeather | null> {
  try {
    const useArchive = isBeyondForecastRange('2026-09-11')

    if (useArchive) {
      // Use last year's actual weather as a proxy for this year
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
        timezone: 'America/Los_Angeles',
        start_date: shiftYearBack('2026-09-11'),
        end_date: shiftYearBack('2026-09-30'),
        temperature_unit: 'celsius',
      })

      const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`)
      if (!res.ok) return null

      const json = await res.json()
      const d = json.daily

      const daily: DayWeather[] = d.time.map((date: string, i: number) => {
        const code = d.weather_code[i] ?? 0
        const info = getWeatherInfo(code)
        const precipSum = d.precipitation_sum[i] ?? 0
        return {
          date: shiftYearForward(date), // Map 2025 dates back to 2026
          tempMax: Math.round(d.temperature_2m_max[i]),
          tempMin: Math.round(d.temperature_2m_min[i]),
          precipitationProbability: estimatePrecipProbability(precipSum),
          weatherCode: code,
          weatherLabel: info.label,
          weatherEmoji: info.emoji,
        }
      })

      return { city, lat, lng, daily }
    } else {
      // Trip is within forecast range — use the regular forecast API
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
        timezone: 'America/Los_Angeles',
        start_date: '2026-09-11',
        end_date: '2026-09-30',
        temperature_unit: 'celsius',
      })

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      if (!res.ok) return null

      const json = await res.json()
      const d = json.daily

      const daily: DayWeather[] = d.time.map((date: string, i: number) => {
        const code = d.weather_code[i] ?? 0
        const info = getWeatherInfo(code)
        return {
          date,
          tempMax: Math.round(d.temperature_2m_max[i]),
          tempMin: Math.round(d.temperature_2m_min[i]),
          precipitationProbability: d.precipitation_probability_max[i] ?? 0,
          weatherCode: code,
          weatherLabel: info.label,
          weatherEmoji: info.emoji,
        }
      })

      return { city, lat, lng, daily }
    }
  } catch {
    return null
  }
}

// Fetch weather for all trip destinations (batched, cached)
export async function fetchTripWeather(): Promise<Record<string, DestinationWeather>> {
  // Check cache first
  const cache = loadCache()
  if (cache) return cache.data

  const results: Record<string, DestinationWeather> = {}

  // Deduplicate by lat/lng to avoid redundant calls
  const uniqueDestinations = TRIP_DESTINATIONS.filter(
    (d, i, arr) => arr.findIndex((x) => x.lat === d.lat && x.lng === d.lng) === i,
  )

  // Fetch in batches of 4 to avoid rate limits
  for (let i = 0; i < uniqueDestinations.length; i += 4) {
    const batch = uniqueDestinations.slice(i, i + 4)
    const promises = batch.map((d) => fetchDestinationWeather(d.city, d.lat, d.lng))
    const batchResults = await Promise.all(promises)
    for (const r of batchResults) {
      if (r) results[r.city] = r
    }
  }

  saveCache(results)
  return results
}

// Get weather for a specific date from pre-fetched data
export function getWeatherForDate(
  weatherData: Record<string, DestinationWeather>,
  date: string,
): (DayWeather & { city: string }) | null {
  const dest = getDestinationForDate(date)
  if (!dest) return null

  const cityWeather = weatherData[dest.city]
  if (!cityWeather) return null

  const dayWeather = cityWeather.daily.find((d) => d.date === date)
  if (!dayWeather) return null

  return { ...dayWeather, city: dest.city }
}

// Get a weather summary string for Moti's context
export function getWeatherSummaryForMoti(
  weatherData: Record<string, DestinationWeather>,
): string {
  const lines: string[] = ['מזג אוויר צפוי לטיול:']

  for (const dest of TRIP_DESTINATIONS) {
    const cityWeather = weatherData[dest.city]
    if (!cityWeather) continue

    for (const date of dest.days) {
      const day = cityWeather.daily.find((d) => d.date === date)
      if (!day) continue

      const dayNum = Math.floor(
        (new Date(date).getTime() - new Date('2026-09-11').getTime()) / (1000 * 60 * 60 * 24),
      ) + 1

      lines.push(
        `יום ${dayNum} (${date}) ${dest.city}: ${day.weatherEmoji} ${day.tempMin}-${day.tempMax}°C, ${day.weatherLabel}, סיכוי גשם ${day.precipitationProbability}%`,
      )
    }
  }

  return lines.join('\n')
}
