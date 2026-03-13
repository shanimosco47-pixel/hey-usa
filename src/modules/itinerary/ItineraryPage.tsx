import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { Calendar, MapPin, StickyNote, ChevronLeft, ChevronRight } from 'lucide-react'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { DaySelector } from './components/DaySelector'
import { StopCard } from './components/StopCard'
import { DriveSegment } from './components/DriveSegment'
import { cn } from '@/lib/cn'

/** Determine the default day index: during the trip show the current day, otherwise show day 1 */
function getDefaultDayIndex(): number {
  const today = new Date()
  const tripStart = parseISO('2026-09-11')
  const tripEnd = parseISO('2026-09-30')

  if (isWithinInterval(today, { start: tripStart, end: tripEnd })) {
    const diff = Math.floor(
      (today.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.min(Math.max(diff, 0), ITINERARY_DAYS.length - 1)
  }
  return 0
}

export default function ItineraryPage() {
  const { day: dayParam } = useParams<{ day?: string }>()
  const navigate = useNavigate()

  // Parse route param or use smart default
  const initialIndex = useMemo(() => {
    if (dayParam) {
      const parsed = parseInt(dayParam, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= ITINERARY_DAYS.length) {
        return parsed - 1
      }
    }
    return getDefaultDayIndex()
  }, [dayParam])

  const [activeDayIndex, setActiveDayIndex] = useState(initialIndex)

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
    <div className="mx-auto max-w-2xl pb-24">
      {/* Page header */}
      <motion.div
        className="px-4 pt-4 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
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
      </motion.div>

      {/* Day selector strip */}
      <DaySelector
        days={ITINERARY_DAYS}
        activeDay={activeDayIndex}
        onDayChange={handleDayChange}
      />

      {/* Day header with navigation arrows */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handleNextDay}
            disabled={activeDayIndex >= ITINERARY_DAYS.length - 1}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              activeDayIndex >= ITINERARY_DAYS.length - 1
                ? 'text-apple-tertiary'
                : 'bg-white/60 text-apple-primary hover:bg-white/90'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="rounded-lg bg-ios-blue/10 px-2 py-0.5 text-xs font-bold text-ios-blue">
                יום {activeDayIndex + 1}
              </span>
              <span className="text-xs text-apple-secondary">
                {hebrewDay}, {format(date, 'd.M.yyyy')}
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold text-apple-primary">
              {currentDay.title}
            </h2>
          </div>

          <button
            onClick={handlePrevDay}
            disabled={activeDayIndex <= 0}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              activeDayIndex <= 0
                ? 'text-apple-tertiary'
                : 'bg-white/60 text-apple-primary hover:bg-white/90'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Day description */}
        {currentDay.description && (
          <p className="mt-2 text-center text-xs leading-relaxed text-apple-secondary">
            {currentDay.description}
          </p>
        )}

        {/* Day meta: city, cost */}
        <div className="mt-3 flex items-center justify-center gap-4">
          {currentDay.city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-ios-blue" />
              <span className="text-xs font-medium text-apple-primary" dir="ltr">
                {currentDay.city}
              </span>
            </div>
          )}
          {dayCost > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-apple-secondary">
                עלות משוערת:
              </span>
              <span className="text-xs font-bold text-ios-orange" dir="ltr">
                ~${dayCost}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stops list */}
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
