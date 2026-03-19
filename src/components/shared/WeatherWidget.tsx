import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cloud, MapPin, Thermometer } from 'lucide-react'
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

  // Dashboard mode: show 3-day forecast for current location + next destination
  const tripStart = new Date('2026-09-11')
  const today = new Date()
  const isTripTime = today >= tripStart && today <= new Date('2026-09-30')

  // Find current location and next destination
  type ForecastItem = { city: string; date: string; weather: DayWeather; dayLabel: string }
  let currentForecast: ForecastItem[] = []
  let nextDestination: ForecastItem | null = null

  if (isTripTime) {
    // During trip: 3-day forecast for where we are now
    const todayStr = today.toISOString().split('T')[0]
    const currentDest = TRIP_DESTINATIONS.find((d) =>
      (d.days as readonly string[]).includes(todayStr),
    )

    for (let i = 0; i < 3; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const w = getWeatherForDate(weatherData, dateStr)
      if (w) {
        const labels = ['היום', 'מחר', 'מחרתיים']
        currentForecast.push({ city: w.city, date: dateStr, weather: w, dayLabel: labels[i] })
      }
    }

    // Find next destination (different city from current)
    if (currentDest) {
      const nextDest = TRIP_DESTINATIONS.find(
        (d) => d.city !== currentDest.city && d.days[0] > todayStr,
      )
      if (nextDest) {
        const w = getWeatherForDate(weatherData, nextDest.days[0])
        if (w) nextDestination = { city: nextDest.city, date: nextDest.days[0], weather: w, dayLabel: nextDest.days[0].slice(5) }
      }
    }
  } else {
    // Before trip: show first 3 days of the trip
    for (let i = 0; i < 3; i++) {
      const d = new Date(tripStart)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const w = getWeatherForDate(weatherData, dateStr)
      if (w) {
        const dayNum = i + 1
        currentForecast.push({ city: w.city, date: dateStr, weather: w, dayLabel: `יום ${dayNum}` })
      }
    }
    // Show a later destination as "next"
    const laterDest = TRIP_DESTINATIONS.find((d) => d.days[0] > '2026-09-13')
    if (laterDest) {
      const w = getWeatherForDate(weatherData, laterDest.days[0])
      if (w) nextDestination = { city: laterDest.city, date: laterDest.days[0], weather: w, dayLabel: laterDest.days[0].slice(5) }
    }
  }

  if (currentForecast.length === 0) return null

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
        {/* Current location - 3 day forecast */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <Thermometer className="h-3.5 w-3.5 text-white/70" />
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
            {isTripTime ? `📍 ${currentForecast[0]?.city}` : 'תחזית לטיול'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {currentForecast.map(({ city, date: d, weather: w, dayLabel }) => (
            <div key={d} className="text-center">
              <p className="text-[10px] text-white/50 mb-0.5">{dayLabel}</p>
              <p className="text-lg leading-none">{w.weatherEmoji}</p>
              <p className="text-white font-bold text-sm mt-1">
                {w.tempMax}°
                <span className="text-white/50 font-normal text-xs">/{w.tempMin}°</span>
              </p>
              <p className="text-[10px] text-white/60 mt-0.5 truncate">{city}</p>
              {w.precipitationProbability > 20 && (
                <p className="text-[9px] text-sky-200">🌧 {w.precipitationProbability}%</p>
              )}
            </div>
          ))}
        </div>

        {/* Next destination */}
        {nextDestination && (
          <>
            <div className="border-t border-white/10 my-2.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-white/50" />
                <span className="text-[10px] text-white/50">היעד הבא:</span>
                <span className="text-[11px] text-white/80 font-medium">{nextDestination.city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{nextDestination.weather.weatherEmoji}</span>
                <span className="text-white/90 text-xs font-medium">
                  {nextDestination.weather.tempMax}°/{nextDestination.weather.tempMin}°
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
