import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format, parseISO, isWithinInterval } from 'date-fns'
import {
  Calendar,
  MapPin,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  List,
  Clock,
  Map,
} from 'lucide-react'
import { useAppData } from '@/contexts/AppDataContext'
import { useAuth } from '@/contexts/AuthContext'
import { isParent } from '@/lib/familyRoles'
import { ActivityPoll, CreatePollButton } from './components/ActivityPoll'
import { DaySelector } from './components/DaySelector'
import { StopCard } from './components/StopCard'
import { DriveSegment } from './components/DriveSegment'
import { DayPlannerBoard } from './components/DayPlannerBoard'
import { cn } from '@/lib/cn'
import { fetchTripWeather, getWeatherForDate, type DestinationWeather } from '@/lib/weather'
import { getPrimaryLocationForCity } from '@/data/locations'

// City-themed gradients, emojis & hero photos for visual flair
const CITY_THEMES: Record<string, { gradient: string; emoji: string; photo?: string }> = {
  Bozeman: {
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '🦬',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  Gardiner: {
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '🦬',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  Yellowstone: {
    gradient: 'from-yellow-500 to-orange-600',
    emoji: '🌋',
    photo: 'https://images.unsplash.com/photo-1533419790775-85dff57b5a3e?w=800&q=80',
  },
  Canyon: {
    gradient: 'from-yellow-500 to-orange-600',
    emoji: '🌋',
    photo: 'https://images.unsplash.com/photo-1533419790775-85dff57b5a3e?w=800&q=80',
  },
  Madison: {
    gradient: 'from-yellow-500 to-orange-600',
    emoji: '🌋',
    photo: 'https://images.unsplash.com/photo-1533419790775-85dff57b5a3e?w=800&q=80',
  },
  'Grand Teton': {
    gradient: 'from-sky-500 to-blue-700',
    emoji: '🏔️',
    photo: 'https://images.unsplash.com/photo-1536183922588-166604504d5e?w=800&q=80',
  },
  'Salt Lake City': {
    gradient: 'from-slate-500 to-blue-600',
    emoji: '🏛️',
    photo: 'https://images.unsplash.com/photo-1617575521317-d2974f3b56d2?w=800&q=80',
  },
  Bryce: {
    gradient: 'from-orange-500 to-red-600',
    emoji: '🪨',
    photo: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&q=80',
  },
  Zion: {
    gradient: 'from-red-500 to-orange-500',
    emoji: '🏔️',
    photo: 'https://images.unsplash.com/photo-1462651567147-aa679fd1cfaf?w=800&q=80',
  },
  'Las Vegas': {
    gradient: 'from-purple-500 to-pink-500',
    emoji: '🎰',
    photo: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80',
  },
  Mammoth: {
    gradient: 'from-blue-500 to-indigo-600',
    emoji: '🎿',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  },
  Yosemite: {
    gradient: 'from-green-600 to-emerald-500',
    emoji: '🌿',
    photo: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80',
  },
  Wawona: {
    gradient: 'from-green-700 to-emerald-600',
    emoji: '🌲',
    photo: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80',
  },
  'Santa Cruz': { gradient: 'from-cyan-500 to-blue-500', emoji: '🏖️' },
  Monterey: { gradient: 'from-cyan-500 to-blue-500', emoji: '🐋' },
  'Big Sur': {
    gradient: 'from-cyan-600 to-blue-700',
    emoji: '🌊',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  },
  Marin: { gradient: 'from-sky-400 to-blue-500', emoji: '🌊' },
  'San Francisco': {
    gradient: 'from-red-500 to-orange-400',
    emoji: '🌉',
    photo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  },
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
  const tripStart = parseISO('2026-09-10')
  const tripEnd = parseISO('2026-09-30')

  if (isWithinInterval(today, { start: tripStart, end: tripEnd })) {
    const diff = Math.floor((today.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24))
    return Math.min(Math.max(diff, 0), totalDays - 1)
  }
  return 0
}

export default function ItineraryPage() {
  const { day: dayParam } = useParams<{ day?: string }>()
  const navigate = useNavigate()
  const { itineraryDays: ITINERARY_DAYS, updateItineraryStop, polls, addPoll, votePoll, deletePoll } = useAppData()
  const { currentMember } = useAuth()

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
    fetchTripWeather()
      .then(setWeatherData)
      .catch(() => {})
  }, [])

  const currentDay = ITINERARY_DAYS[activeDayIndex]

  if (!currentDay) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-apple-lg bg-ios-orange/10">
            <Calendar className="h-5 w-5 text-ios-orange" />
          </div>
          <h1 className="text-title font-bold text-apple-primary">לוח זמנים</h1>
        </motion.div>
        <div className="flex flex-col items-center justify-center rounded-apple-lg glass p-12 text-center shadow-sm">
          <Map className="h-12 w-12 text-apple-secondary/30" />
          <p className="mt-4 text-apple-secondary">אין ימים להצגה</p>
        </div>
      </div>
    )
  }

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
  const dayCost = currentDay.stops.reduce((sum, stop) => sum + (stop.cost_estimate ?? 0), 0)

  // Filter polls for the current day
  const dayPolls = polls.filter((p) => p.day_id === currentDay?.id)

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
            <div className="flex h-10 w-10 items-center justify-center rounded-apple-lg bg-ios-orange/10">
              <Calendar className="h-5 w-5 text-ios-orange" />
            </div>
            <div>
              <h1 className="text-title font-bold text-apple-primary">לוח זמנים</h1>
              <p className="text-xs text-apple-secondary">21 ימים במערב ארה"ב | ספטמבר 2026</p>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 rounded-apple-lg bg-black/[0.04] p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-apple-sm transition-all',
                viewMode === 'list'
                  ? 'bg-white text-ios-blue shadow-sm'
                  : 'text-apple-secondary hover:text-apple-primary',
              )}
              aria-label="תצוגת רשימה"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-apple-sm transition-all',
                viewMode === 'timeline'
                  ? 'bg-white text-ios-blue shadow-sm'
                  : 'text-apple-secondary hover:text-apple-primary',
              )}
              aria-label="תצוגת ציר זמן"
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Day selector strip */}
      <DaySelector days={ITINERARY_DAYS} activeDay={activeDayIndex} onDayChange={handleDayChange} />

      {/* Day hero banner */}
      {(() => {
        const theme = getCityTheme(currentDay.city)
        const w = getWeatherForDate(weatherData, currentDay.date)
        return (
          <div
            className="mx-4 mt-3 rounded-apple-xl p-4 text-white relative overflow-hidden"
            style={{ minHeight: '160px' }}
          >
            {/* Background photo */}
            {theme.photo && (
              <img
                src={theme.photo}
                alt={`${currentDay.city} — תמונת רקע`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} ${theme.photo ? 'opacity-60' : ''}`}
            />

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

              <h2 className="text-headline font-bold text-center drop-shadow-sm">{currentDay.title}</h2>

              {currentDay.city &&
                (() => {
                  const loc = getPrimaryLocationForCity(currentDay.city)
                  return loc ? (
                    <Link
                      to={`/locations/${loc.id}`}
                      className="flex items-center justify-center gap-1 mt-1 hover:bg-white/10 rounded-full px-2 py-0.5 transition-colors"
                    >
                      <MapPin className="h-3 w-3 text-white/70" />
                      <span
                        className="text-xs text-white/80 underline decoration-white/30"
                        dir="ltr"
                      >
                        {currentDay.city}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-white/70" />
                      <span className="text-xs text-white/80" dir="ltr">
                        {currentDay.city}
                      </span>
                    </div>
                  )
                })()}

              {/* Weather + cost strip */}
              <div className="flex items-center justify-center gap-3 mt-2">
                {w && (
                  <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                    <span className="text-sm">{w.weatherEmoji}</span>
                    <span className="text-[11px]">
                      {w.tempMin}°–{w.tempMax}°C
                    </span>
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
      {currentDay.stops.length === 0 ? (
        <div className="mx-4 mt-4 flex flex-col items-center justify-center rounded-apple-lg glass p-12 text-center shadow-sm">
          <Map className="h-12 w-12 text-apple-secondary/30" />
          <p className="mt-4 text-apple-secondary">אין עצירות להצגה</p>
        </div>
      ) : viewMode === 'timeline' ? (
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
                <StopCard
                  stop={stop}
                  index={index}
                  onUpdateTime={(stopId, start_time, end_time) =>
                    updateItineraryStop(currentDay.id, stopId, { start_time, end_time })
                  }
                />
                {index < currentDay.stops.length - 1 && <DriveSegment />}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity Polls */}
      {dayPolls.length > 0 && (
        <div className="flex flex-col gap-3 mt-4 px-4">
          {dayPolls.map((poll) => (
            <ActivityPoll
              key={poll.id}
              poll={poll}
              onVote={(pollId, optionIndex) => {
                if (currentMember) votePoll(pollId, optionIndex, currentMember)
              }}
              onDelete={currentMember && isParent(currentMember) ? deletePoll : undefined}
            />
          ))}
        </div>
      )}

      {/* Create Poll Button */}
      {currentDay && (
        <div className="mt-3 px-4">
          <CreatePollButton dayId={currentDay.id} onCreatePoll={addPoll} />
        </div>
      )}

      {/* Day notes */}
      {currentDay.notes && (
        <div className="mx-4 mt-4 rounded-apple-lg border border-ios-orange/30 bg-ios-orange/5 p-3">
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
                  : 'w-1.5 bg-black/[0.06] hover:bg-apple-secondary',
              )}
              aria-label={`יום ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
