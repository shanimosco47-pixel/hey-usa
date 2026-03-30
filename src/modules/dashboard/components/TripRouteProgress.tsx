import { memo } from 'react'
import { motion } from 'framer-motion'
import { ROUTE_COLORS } from '@/constants'
import type { ItineraryDay } from '@/lib/types'

interface TripRouteProgressProps {
  itineraryDays: ItineraryDay[]
  tripDayIndex: number | null
  daysLeft: number
}

export const TripRouteProgress = memo(function TripRouteProgress({
  itineraryDays,
  tripDayIndex,
  daysLeft,
}: TripRouteProgressProps) {
  if (itineraryDays.length === 0) return null

  const allFuture = tripDayIndex === null

  return (
    <div
      className="rounded-apple-lg bg-white dark:bg-white/[0.08] px-4 py-3.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-body font-semibold text-passport-slate">🛣️ מסלול הטיול</span>
        {tripDayIndex !== null && (
          <span className="text-caption font-bold text-white bg-ios-green rounded-full px-2 py-0.5">
            יום {tripDayIndex + 1} מתוך {itineraryDays.length}
          </span>
        )}
        {tripDayIndex === null && daysLeft > 0 && (
          <span className="text-caption font-medium text-apple-secondary">עוד {daysLeft} ימים</span>
        )}
      </div>
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex items-center gap-0 min-w-max" role="list" aria-label="מסלול הטיול">
          {itineraryDays.map((day, i) => {
            const isCurrent = tripDayIndex === i
            const isPast = tripDayIndex !== null && i < tripDayIndex
            const cityShort = day.city?.split('→')[0]?.trim()?.split(',')[0]?.trim() || ''
            const dotColor = isPast
              ? '#34C759'
              : isCurrent
                ? '#007AFF'
                : allFuture
                  ? ROUTE_COLORS[i % ROUTE_COLORS.length]
                  : '#E5E5EA'
            const dayNumColor = isCurrent
              ? '#007AFF'
              : isPast
                ? '#34C759'
                : allFuture
                  ? ROUTE_COLORS[i % ROUTE_COLORS.length]
                  : '#8E8E93'
            const cityColor = isCurrent
              ? '#007AFF'
              : isPast
                ? '#8E8E93'
                : allFuture
                  ? '#6B6B6B'
                  : '#C7C7CC'
            const lineColor = isPast
              ? '#34C759'
              : allFuture
                ? `${ROUTE_COLORS[i % ROUTE_COLORS.length]}60`
                : '#E5E5EA'
            return (
              <div key={day.id} className="flex items-center" role="listitem">
                <div className="flex flex-col items-center" style={{ width: 56 }}>
                  <div
                    className="relative flex items-center justify-center rounded-full transition-all"
                    style={{
                      width: isCurrent ? 20 : 10,
                      height: isCurrent ? 20 : 10,
                      backgroundColor: dotColor,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(0,122,255,0.2)' : 'none',
                    }}
                  >
                    {isCurrent && (
                      <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: 'rgba(0,122,255,0.25)' }}
                      />
                    )}
                    {isPast && (
                      <svg viewBox="0 0 10 10" width={6} height={6} aria-hidden="true">
                        <path
                          d="M2 5 L4 7 L8 3"
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {isCurrent && (
                      <span className="text-[8px]" aria-hidden="true">
                        📍
                      </span>
                    )}
                  </div>
                  <span
                    className="text-caption mt-1 font-medium text-center leading-tight"
                    style={{
                      color: dayNumColor,
                      fontWeight: isCurrent ? 700 : allFuture ? 600 : 500,
                    }}
                  >
                    {i + 1}
                  </span>
                  {cityShort && (
                    <span
                      className="text-[7px] text-center leading-tight max-w-[56px]"
                      style={{
                        color: cityColor,
                        fontWeight: allFuture ? 500 : 400,
                        wordBreak: 'break-word',
                      }}
                    >
                      {cityShort}
                    </span>
                  )}
                </div>
                {i < itineraryDays.length - 1 && (
                  <div
                    className="h-[2px] shrink-0"
                    aria-hidden="true"
                    style={{
                      width: 8,
                      backgroundColor: lineColor,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
