import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cloud, Thermometer } from 'lucide-react'
import {
  fetchTripWeather,
  getWeatherForDate,
  TRIP_DESTINATIONS,
  type DestinationWeather,
  type DayWeather,
} from '@/lib/weather'

interface WeatherWidgetProps {
  /** Show weather for a specific date, or 'next' for next destination */
  mode?: 'dashboard' | 'day'
  date?: string
}

export default function WeatherWidget({ mode = 'dashboard', date }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<Record<string, DestinationWeather>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTripWeather()
      .then(setWeatherData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass rounded-apple-lg p-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-apple-tertiary" />
          <span className="text-sm text-apple-tertiary">טוען מזג אוויר...</span>
        </div>
      </div>
    )
  }

  if (Object.keys(weatherData).length === 0) return null

  // Day mode: show weather for a specific date
  if (mode === 'day' && date) {
    const dayWeather = getWeatherForDate(weatherData, date)
    if (!dayWeather) return null

    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">{dayWeather.weatherEmoji}</span>
        <span className="text-apple-secondary">
          {dayWeather.tempMin}°–{dayWeather.tempMax}°C
        </span>
        {dayWeather.precipitationProbability > 20 && (
          <span className="text-ios-blue text-xs">
            🌧 {dayWeather.precipitationProbability}%
          </span>
        )}
      </div>
    )
  }

  // Dashboard mode: show a 3-day forecast strip for the next 3 unique destinations
  const tripStart = new Date('2026-09-11')
  const today = new Date()
  const isTripTime = today >= tripStart && today <= new Date('2026-09-30')

  // Pick destinations to show
  let previewDests: { city: string; date: string; weather: DayWeather }[] = []

  if (isTripTime) {
    // During trip: show today + next 2 days
    for (let i = 0; i < 3; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const w = getWeatherForDate(weatherData, dateStr)
      if (w) previewDests.push({ city: w.city, date: dateStr, weather: w })
    }
  } else {
    // Before trip: show first 3 unique destination days
    const seen = new Set<string>()
    for (const dest of TRIP_DESTINATIONS) {
      if (seen.size >= 3) break
      if (seen.has(dest.city)) continue
      const w = getWeatherForDate(weatherData, dest.days[0])
      if (w) {
        previewDests.push({ city: dest.city, date: dest.days[0], weather: w })
        seen.add(dest.city)
      }
    }
  }

  if (previewDests.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-[16px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Thermometer className="h-3.5 w-3.5 text-white/70" />
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
            {isTripTime ? 'מזג אוויר היום' : 'תחזית לטיול'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {previewDests.map(({ city, date: d, weather: w }) => (
            <div key={d} className="text-center">
              <p className="text-lg leading-none">{w.weatherEmoji}</p>
              <p className="text-white font-bold text-sm mt-1">
                {w.tempMax}°
                <span className="text-white/50 font-normal text-xs">/{w.tempMin}°</span>
              </p>
              <p className="text-[10px] text-white/60 mt-0.5 truncate">{city}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
