import type { ItineraryDay, Expense } from '@/lib/types'
import { getPrimaryLocationForCity } from '@/data/locations'

export interface DayBudgetSummary {
  dayId: string
  dayNumber: number
  date: string
  title: string
  city?: string
  locationEmoji?: string
  accommodation?: { name: string; cost: number }
  plannedActivities: number
  plannedDriving: number
  plannedTotal: number
  actualTotal: number
  delta: number
  runningPlanned: number
  runningActual: number
}

export function calculateDailyBudget(
  days: ItineraryDay[],
  expenses: Expense[],
): DayBudgetSummary[] {
  let runningPlanned = 0
  let runningActual = 0

  return days.map((day, index) => {
    // Find accommodation stop
    const campStop = day.stops.find((s) => s.category === 'camp')
    const accommodation = campStop
      ? { name: campStop.title, cost: campStop.cost_estimate || 0 }
      : undefined

    // Sum planned costs by type
    let plannedActivities = 0
    let plannedDriving = 0
    let plannedAccomm = 0
    for (const stop of day.stops) {
      const cost = stop.cost_estimate || 0
      if (stop.category === 'camp') {
        plannedAccomm += cost
      } else if (stop.category === 'drive') {
        plannedDriving += cost
      } else {
        plannedActivities += cost
      }
    }

    const plannedTotal = plannedActivities + plannedDriving + plannedAccomm

    // Match expenses by day_id or date
    const dayExpenses = expenses.filter(
      (e) => e.day_id === day.id || e.date === day.date,
    )
    const actualTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)

    runningPlanned += plannedTotal
    runningActual += actualTotal

    // Get location emoji
    const loc = getPrimaryLocationForCity(day.city)

    return {
      dayId: day.id,
      dayNumber: index + 1,
      date: day.date,
      title: day.title,
      city: day.city,
      locationEmoji: loc?.emoji,
      accommodation,
      plannedActivities,
      plannedDriving,
      plannedTotal,
      actualTotal,
      delta: plannedTotal - actualTotal,
      runningPlanned,
      runningActual,
    }
  })
}
