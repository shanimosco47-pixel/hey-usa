import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bed, TrendingDown, TrendingUp, Activity, Car } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppData } from '@/contexts/AppDataContext'
import { calculateDailyBudget } from '../utils/dailyBudgetCalc'

export function DailyBudgetView() {
  const { itineraryDays, expenses, budgetSettings } = useAppData()
  const currency = budgetSettings.currency

  const dailySummaries = useMemo(
    () => calculateDailyBudget(itineraryDays, expenses),
    [itineraryDays, expenses],
  )

  const totalPlanned = dailySummaries.reduce((s, d) => s + d.plannedTotal, 0)
  const totalActual = dailySummaries.reduce((s, d) => s + d.actualTotal, 0)
  const avgDaily = itineraryDays.length > 0 ? totalPlanned / itineraryDays.length : 0

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-apple-lg p-3 text-center shadow-sm">
          <p className="text-[10px] text-apple-secondary">מתוכנן (מלו״ז)</p>
          <p className="mt-0.5 text-base font-bold text-apple-primary">
            {currency}{totalPlanned.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-apple-lg p-3 text-center shadow-sm">
          <p className="text-[10px] text-apple-secondary">בפועל</p>
          <p className="mt-0.5 text-base font-bold text-ios-red">
            {currency}{totalActual.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-apple-lg p-3 text-center shadow-sm">
          <p className="text-[10px] text-apple-secondary">ממוצע יומי</p>
          <p className="mt-0.5 text-base font-bold text-ios-blue">
            {currency}{Math.round(avgDaily).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Per-day cards */}
      <div className="space-y-3">
        {dailySummaries.map((day, i) => {
          const isUnder = day.delta >= 0
          return (
            <motion.div
              key={day.dayId}
              className="glass rounded-apple-lg p-4 shadow-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{day.locationEmoji || '📍'}</span>
                  <div>
                    <h4 className="text-sm font-bold text-apple-primary">
                      יום {day.dayNumber} — {day.title}
                    </h4>
                    <p className="text-[11px] text-apple-secondary">
                      {new Date(day.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {day.city && ` · ${day.city}`}
                    </p>
                  </div>
                </div>
                {/* Delta badge */}
                {(day.plannedTotal > 0 || day.actualTotal > 0) && (
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      isUnder
                        ? 'bg-ios-green/15 text-ios-green'
                        : 'bg-ios-red/15 text-ios-red',
                    )}
                  >
                    {isUnder ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {currency}{Math.abs(day.delta).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Cost breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {day.accommodation && (
                  <div className="flex items-center gap-1.5 text-apple-secondary">
                    <Bed className="h-3.5 w-3.5" />
                    <span className="truncate">{day.accommodation.name}</span>
                    {day.accommodation.cost > 0 && (
                      <span className="font-medium text-apple-primary mr-auto">
                        {currency}{day.accommodation.cost}
                      </span>
                    )}
                  </div>
                )}
                {day.plannedActivities > 0 && (
                  <div className="flex items-center gap-1.5 text-apple-secondary">
                    <Activity className="h-3.5 w-3.5" />
                    <span>פעילויות</span>
                    <span className="font-medium text-apple-primary mr-auto">
                      {currency}{day.plannedActivities.toLocaleString()}
                    </span>
                  </div>
                )}
                {day.plannedDriving > 0 && (
                  <div className="flex items-center gap-1.5 text-apple-secondary">
                    <Car className="h-3.5 w-3.5" />
                    <span>נסיעות</span>
                    <span className="font-medium text-apple-primary mr-auto">
                      {currency}{day.plannedDriving.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Planned vs Actual footer */}
              {(day.plannedTotal > 0 || day.actualTotal > 0) && (
                <div className="mt-2 flex items-center justify-between border-t border-black/[0.04] pt-2 text-xs">
                  <span className="text-apple-secondary">
                    מתוכנן: <span className="font-medium text-apple-primary">{currency}{day.plannedTotal.toLocaleString()}</span>
                  </span>
                  <span className="text-apple-secondary">
                    בפועל: <span className="font-medium text-ios-red">{currency}{day.actualTotal.toLocaleString()}</span>
                  </span>
                  <span className="text-apple-tertiary">
                    מצטבר: {currency}{day.runningPlanned.toLocaleString()}
                  </span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
