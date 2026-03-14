import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { Calendar, MapPin, StickyNote, ChevronLeft, ChevronRight, List, Clock } from 'lucide-react'
import { useAppData } from '@/contexts/AppDataContext'
import { DaySelector } from './components/DaySelector'
import { StopCard } from './components/StopCard'
import { DriveSegment } from './components/DriveSegment'
import { DayPlannerBoard } from './components/DayPlannerBoard'
import { cn } from '@/lib/cn'
import { fetchTripWeather, getWeatherForDate, type DestinationWeather } from '@/lib/weather'

// City-themed gradients, emojis & hero photos for visual flair
const CITY_THEMES: Record<string, { gradient: string; emoji: string; photo?: string }> = {
  'Los Angeles': { gradient: 'from-orange-400 to-pink-500', emoji: '🌴', photo: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80' },
  'Barstow': { gradient: 'from-amber-500 to-orange-600', emoji: '🏜️', photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80' },
  'Las Vegas': { gradient: 'from-purple-500 to-pink-500', emoji: '🎰', photo: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80' },
  'Zion': { gradient: 'from-red-500 to-orange-500', emoji: '🏔️', photo: 'https://images.unsplash.com/photo-1462651567147-aa679fd1cfaf?w=800&q=80' },
  'Bryce': { gradient: 'from-orange-500 to-red-600', emoji: '🪨', photo: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&q=80' },
  'Capitol Reef': { gradient: 'from-amber-600 to-red-500', emoji: '🏜️', photo: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&q=80' },
  'Moab': { gradient: 'from-red-600 to-amber-500', emoji: '🌄', photo: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80' },
  'Monument Valley': { gradient: 'from-red-700 to-orange-500', emoji: '🏜️', photo: 'https://images.unsplash.com/photo-1558216993-3f64d879ae76?w=800&q=80' },
  'Page': { gradient: 'from-blue-500 to-cyan-400', emoji: '🌊', photo: 'https://images.unsplash.com/photo-1527549993586-dff825b37782?w=800&q=80' },
  'Grand Canyon': { gradient: 'from-orange-600 to-red-700', emoji: '🏞️', photo: 'https://images.unsplash.com/photo-1615551043360-33de8b5f410c?w=800&q=80' },
  'Kanab': { gradient: 'from-amber-500 to-red-400', emoji: '⛰️', photo: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80' },
  'Great Basin': { gradient: 'from-emerald-600 to-teal-500', emoji: '🌲', photo: 'https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=800&q=80' },
  'Bishop': { gradient: 'from-sky-500 to-blue-600', emoji: '🏔️', photo: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80' },
  'Mammoth': { gradient: 'from-blue-500 to-indigo-600', emoji: '🎿', photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
  'Yosemite': { gradient: 'from-green-600 to-emerald-500', emoji: '🌿', photo: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80' },
  'California': { gradient: 'from-cyan-400 to-blue-500', emoji: '🌊', photo: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800&q=80' },
  'San Francisco': { gradient: 'from-red-500 to-orange-400', emoji: '🌉', photo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80' },
}

function getCityTheme(city?: string): { gradient: string; emoji: string; photo?: string } {
  if (!city) return { gradient: 'from-gray-500 to-gray-600', emoji: '📍' }
  for (const [key, theme] of Object.entries(CITY_THEMES)) {
    if (city.includes(key)) return theme
  }
  return { gradient: 'from-blue-500 to-indigo-600', emoji: '📍' }
}

/** Determine the default day index: during the trip show the current day, otherwise show day 1 */
function getDefaultDayIndex(totalDays: number): number {
  const today = new Date()
  const tripStart = parseISO('2026-09-11')
  const tripEnd = parseISO('2026-09-30')

  if (isWithinInterval(today, { start: tripStart, end: tripEnd })) {
    const diff = Math.floor(
      (today.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.min(Math.max(diff, 0), totalDays - 1)
  }
  return 0
}

export default function ItineraryPage() {
  const { day: dayParam } = useParams<{ day?: string }>()
  const navigate = useNavigate()
  const { itineraryDays: ITINERARY_DAYS } = useAppData()

  // Parse route param or use smart default
  const initialIndex = useMemo(() => {
    if (dayParam) {
      const parsed = parseInt(dayParam, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= ITINERARY_DAYS.length) {
        return parsed - 1
      }
    }
    return getDefaultDayIndex(ITINERARY_DAYS.length)
  }, [dayParam, ITINERARY_DAYS.length])

  const [activeDayIndex, setActiveDayIndex] = useState(initialIndex)
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [weatherData, setWeatherData] = useState<Record<string, DestinationWeather>>({})

  useEffect(() => {
    fetchTripWeather().then(setWeatherData).catch(() => {})
  }, [])

  const currentDay = ITINERARY_DAYS[activeDayIndex]
  const date = parseISO(currentDay.date)

  const handleDayChange = (index: number) => {
    setActiveDayIndex(index)
    navigate(`/itinerary/${index + 1}`, { replace: true })
  }

  const handlePrevDay = () => {
    if (activeDayIndex > 0) {
      handleDayChange(activeDayIndex - 1)
    }
  }

  const handleNextDay = () => {
    if (activeDayIndex < ITINERARY_DAYS.length - 1) {
      handleDayChange(activeDayIndex + 1)
    }
  }

  // Calculate total estimated cost for the day
  const dayCost = currentDay.stops.reduce(
    (sum, stop) => sum + (stop.cost_estimate ?? 0),
    0
  )

  // Format Hebrew day of week
  const hebrewDay = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
  }).format(date)

  return (
    <div className="mx-auto max-w-2xl pb-24 overflow-x-hidden">
      {/* Page header */}
      <motion.div
        className="px-4 pt-4 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ios-orange/10">
              <Calendar className="h-5 w-5 text-ios-orange" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-apple-primary">לוח זמנים</h1>
              <p className="text-xs text-apple-secondary">
                20 ימים במערב ארה"ב | ספטמבר 2026
              </p>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 rounded-xl bg-black/[0.04] p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-white text-ios-blue shadow-sm'
                  : 'text-apple-secondary hover:text-apple-primary'
              )}
              aria-label="תצוגת רשימה"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                viewMode === 'timeline'
                  ? 'bg-white text-ios-blue shadow-sm'
                  : 'text-apple-secondary hover:text-apple-primary'
              )}
              aria-label="תצוגת ציר זמן"
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Day selector strip */}
      <DaySelector
        days={ITINERARY_DAYS}
        activeDay={activeDayIndex}
        onDayChange={handleDayChange}
      />

      {/* Day hero banner */}
      {(() => {
        const theme = getCityTheme(currentDay.city)
        const w = getWeatherForDate(weatherData, currentDay.date)
        return (
          <div className="mx-4 mt-3 rounded-2xl p-4 text-white relative overflow-hidden" style={{ minHeight: '160px' }}>
            {/* Background photo */}
            {theme.photo && (
              <img
                src={theme.photo}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} ${theme.photo ? 'opacity-60' : ''}`} />

            {/* Background emoji */}
            <span className="absolute -bottom-2 -left-2 text-[80px] opacity-10 pointer-events-none select-none z-[1]">
              {theme.emoji}
            </span>

            {/* Nav + content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleNextDay}
                  disabled={activeDayIndex >= ITINERARY_DAYS.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
                    יום {activeDayIndex + 1}/20
                  </span>
                  <span className="text-[11px] text-white/70">
                    {hebrewDay}, {format(date, 'd.M.yyyy')}
                  </span>
                </div>
                <button
                  onClick={handlePrevDay}
                  disabled={activeDayIndex <= 0}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <h2 className="text-lg font-bold text-center drop-shadow-sm">{currentDay.title}</h2>

              {currentDay.city && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-white/70" />
                  <span className="text-xs text-white/80" dir="ltr">{currentDay.city}</span>
                </div>
              )}

              {/* Weather + cost strip */}
              <div className="flex items-center justify-center gap-3 mt-2">
                {w && (
                  <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                    <span className="text-sm">{w.weatherEmoji}</span>
                    <span className="text-[11px]">{w.tempMin}°–{w.tempMax}°C</span>
                    {w.precipitationProbability > 20 && (
                      <span className="text-[10px] text-white/70">
                        💧{w.precipitationProbability}%
                      </span>
                    )}
                  </div>
                )}
                {dayCost > 0 && (
                  <div className="rounded-full bg-white/15 px-2.5 py-1 text-[11px]" dir="ltr">
                    ~${dayCost}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Day description */}
      {currentDay.description && (
        <p className="mx-4 mt-2 text-center text-xs leading-relaxed text-apple-secondary">
          {currentDay.description}
        </p>
      )}

      {/* Stops: list or timeline view */}
      {viewMode === 'timeline' ? (
        <DayPlannerBoard day={currentDay} />
      ) : (
        <motion.div
          className="px-4 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex flex-col">
            {currentDay.stops.map((stop, index) => (
              <div key={stop.id}>
                <StopCard stop={stop} index={index} />
                {index < currentDay.stops.length - 1 && (
                  <DriveSegment />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Day notes */}
      {currentDay.notes && (
        <div className="mx-4 mt-4 rounded-xl border border-ios-orange/30 bg-ios-orange/5 p-3">
          <div className="flex gap-2">
            <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-ios-orange" />
            <div>
              <h4 className="text-xs font-bold text-ios-orange">הערות ליום</h4>
              <p className="mt-1 text-xs leading-relaxed text-apple-secondary">
                {currentDay.notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Day progress indicator */}
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-1">
          {ITINERARY_DAYS.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDayChange(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === activeDayIndex
                  ? 'w-6 bg-ios-blue'
                  : 'w-1.5 bg-black/[0.06] hover:bg-apple-secondary'
              )}
              aria-label={`יום ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
