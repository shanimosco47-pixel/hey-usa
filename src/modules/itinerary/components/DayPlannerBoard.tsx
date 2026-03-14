import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, AlertCircle } from 'lucide-react'
import type { ItineraryDay, ItineraryStop } from '@/lib/types'
import { cn } from '@/lib/cn'

// ─── Constants ──────────────────────────────────────────────────────

const HOUR_HEIGHT = 60 // px per hour
const START_HOUR = 6
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  drive:    { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-600',  dot: '#6366F1' },
  hike:     { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-600',   dot: '#F59E0B' },
  activity: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-600',   dot: '#F59E0B' },
  scenic:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-600',   dot: '#F59E0B' },
  food:     { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-600',   dot: '#22C55E' },
  camp:     { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600',  dot: '#8B5CF6' },
  rest:     { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600',  dot: '#8B5CF6' },
  city:     { bg: 'bg-slate-500/10',  border: 'border-slate-500/30',  text: 'text-slate-600',   dot: '#64748B' },
  other:    { bg: 'bg-slate-500/10',  border: 'border-slate-500/30',  text: 'text-slate-600',   dot: '#64748B' },
}

// ─── Helpers ────────────────────────────────────────────────────────

function parseTime(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h + m / 60
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function getCategoryStyle(category?: string) {
  return CATEGORY_COLORS[category ?? 'other'] ?? CATEGORY_COLORS.other
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const [year, month, day] = dateStr.split('-').map(Number)
  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  )
}

function getCurrentTimeOffset(): number | null {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60
  if (hours < START_HOUR || hours > END_HOUR) return null
  return (hours - START_HOUR) * HOUR_HEIGHT
}

// ─── Sub-Components ─────────────────────────────────────────────────

function TimelineStop({ stop }: { stop: ItineraryStop }) {
  const startVal = parseTime(stop.start_time!)!
  const endVal = stop.end_time ? parseTime(stop.end_time) : null
  const duration = endVal ? endVal - startVal : 0.5 // Default 30min if no end time

  const top = (startVal - START_HOUR) * HOUR_HEIGHT
  const height = Math.max(duration * HOUR_HEIGHT, 36) // Minimum 36px

  const style = getCategoryStyle(stop.category)

  const timeRange =
    stop.start_time && stop.end_time
      ? `${stop.start_time} – ${stop.end_time}`
      : stop.start_time ?? ''

  return (
    <motion.div
      className={cn(
        'absolute left-0 right-14 rounded-xl border px-3 py-2 overflow-hidden cursor-default',
        style.bg,
        style.border
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Color accent bar on the right (RTL) */}
      <div
        className="absolute top-0 right-0 bottom-0 w-1 rounded-r-xl"
        style={{ backgroundColor: style.dot }}
      />

      <div className="flex flex-col gap-0.5 pr-2 h-full justify-center">
        <h4 className="text-sm font-bold text-apple-primary leading-tight truncate">
          {stop.title}
        </h4>

        {height >= 52 && stop.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0 text-apple-secondary" />
            <span className="text-[11px] text-apple-secondary truncate" dir="ltr">
              {stop.location}
            </span>
          </div>
        )}

        {height >= 44 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 flex-shrink-0 text-apple-secondary" />
            <span className="text-[11px] font-medium text-apple-secondary" dir="ltr">
              {timeRange}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function UnscheduledStop({ stop }: { stop: ItineraryStop }) {
  const style = getCategoryStyle(stop.category)

  return (
    <motion.div
      className={cn(
        'rounded-xl border px-3 py-2.5 relative overflow-hidden',
        style.bg,
        style.border
      )}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div
        className="absolute top-0 right-0 bottom-0 w-1 rounded-r-xl"
        style={{ backgroundColor: style.dot }}
      />
      <div className="pr-2">
        <h4 className="text-sm font-bold text-apple-primary">{stop.title}</h4>
        {stop.location && (
          <div className="mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0 text-apple-secondary" />
            <span className="text-[11px] text-apple-secondary truncate" dir="ltr">
              {stop.location}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────

interface DayPlannerBoardProps {
  day: ItineraryDay
}

export function DayPlannerBoard({ day }: DayPlannerBoardProps) {
  const { scheduled, unscheduled } = useMemo(() => {
    const scheduled: ItineraryStop[] = []
    const unscheduled: ItineraryStop[] = []

    for (const stop of day.stops) {
      if (stop.start_time && parseTime(stop.start_time) !== null) {
        scheduled.push(stop)
      } else {
        unscheduled.push(stop)
      }
    }

    // Sort scheduled by start_time
    scheduled.sort((a, b) => {
      const aT = parseTime(a.start_time!)!
      const bT = parseTime(b.start_time!)!
      return aT - bT
    })

    return { scheduled, unscheduled }
  }, [day.stops])

  const showTodayLine = isToday(day.date)
  const todayOffset = showTodayLine ? getCurrentTimeOffset() : null

  const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT

  // Determine which hours are occupied
  const occupiedHours = useMemo(() => {
    const set = new Set<number>()
    for (const stop of scheduled) {
      const start = parseTime(stop.start_time!)!
      const end = stop.end_time ? parseTime(stop.end_time) ?? start + 0.5 : start + 0.5
      for (let h = Math.floor(start); h < Math.ceil(end); h++) {
        set.add(h)
      }
    }
    return set
  }, [scheduled])

  return (
    <motion.div
      className="px-4 pt-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      {/* Timeline */}
      <div
        className="relative"
        style={{ height: `${totalHeight}px` }}
      >
        {/* Hour grid lines */}
        {HOURS.map((hour) => {
          const top = (hour - START_HOUR) * HOUR_HEIGHT
          const isOccupied = occupiedHours.has(hour)

          return (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-start"
              style={{ top: `${top}px`, height: `${HOUR_HEIGHT}px` }}
            >
              {/* Time label on right (RTL) */}
              <div className="absolute right-0 top-0 w-12 text-left">
                <span className="text-[11px] font-medium text-apple-secondary leading-none">
                  {formatHour(hour)}
                </span>
              </div>

              {/* Divider line */}
              <div
                className={cn(
                  'absolute left-0 right-14 top-0 h-px',
                  isOccupied
                    ? 'bg-black/[0.06]'
                    : 'border-t border-dashed border-black/[0.08]'
                )}
              />
            </div>
          )
        })}

        {/* Scheduled stops */}
        {scheduled.map((stop) => (
          <TimelineStop key={stop.id} stop={stop} />
        ))}

        {/* Current time indicator */}
        {todayOffset !== null && (
          <div
            className="absolute left-0 right-14 z-10 flex items-center"
            style={{ top: `${todayOffset}px` }}
          >
            <div className="h-2 w-2 rounded-full bg-ios-red" />
            <div className="flex-1 h-px bg-ios-red" />
          </div>
        )}
      </div>

      {/* Unscheduled section */}
      {unscheduled.length > 0 && (
        <div className="mt-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-apple-secondary" />
            <h3 className="text-sm font-bold text-apple-secondary">
              לא מתוזמן
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {unscheduled.map((stop) => (
              <UnscheduledStop key={stop.id} stop={stop} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
