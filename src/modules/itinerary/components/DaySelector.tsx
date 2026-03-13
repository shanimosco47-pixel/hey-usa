import { useRef, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import type { ItineraryDay } from '@/types'
import { cn } from '@/lib/cn'

interface DaySelectorProps {
  days: ItineraryDay[]
  activeDay: number
  onDayChange: (dayIndex: number) => void
}

export function DaySelector({ days, activeDay, onDayChange }: DaySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  const scrollToActive = useCallback(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const button = activeRef.current
      const scrollLeft =
        button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    // Small delay to ensure elements are rendered
    const timer = setTimeout(scrollToActive, 100)
    return () => clearTimeout(timer)
  }, [activeDay, scrollToActive])

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-transparent to-surface-primary" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-transparent to-surface-primary" />

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((day, index) => {
          const date = parseISO(day.date)
          const dayNum = index + 1
          const shortDate = format(date, 'd.M')
          const isActive = index === activeDay
          const cityShort = day.city
            ? day.city.split(/[→,]/)[0].trim().slice(0, 12)
            : ''

          return (
            <button
              key={day.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onDayChange(index)}
              className={cn(
                'flex min-w-[72px] flex-shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all',
                isActive
                  ? 'bg-ios-blue text-white shadow-md scale-105'
                  : 'glass text-apple-primary border border-black/[0.06] hover:bg-white/80'
              )}
            >
              <span className="text-[10px] font-medium opacity-75">
                {shortDate}
              </span>
              <span className="text-sm font-bold">
                {dayNum}
              </span>
              <span
                className={cn(
                  'max-w-[60px] truncate text-[9px]',
                  isActive ? 'text-white/80' : 'text-apple-secondary'
                )}
              >
                {cityShort}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
