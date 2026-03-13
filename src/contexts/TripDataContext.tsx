import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Expense, BudgetSettings, ItineraryDay } from '@/lib/types'
import { SAMPLE_EXPENSES, SAMPLE_BUDGET_SETTINGS } from '@/modules/budget/data/sampleExpenses'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

// ─── Action Types ──────────────────────────────────────────────────

export type MotiAction =
  | { type: 'UPDATE_BUDGET_CATEGORY'; category: string; amount: number }
  | { type: 'UPDATE_TOTAL_BUDGET'; amount: number }
  | { type: 'UPDATE_DAILY_BUDGET'; amount: number }
  | { type: 'ADD_EXPENSE'; expense: Omit<Expense, 'id' | 'created_at'> }
  | { type: 'UPDATE_ITINERARY_STOP_NOTES'; dayId: string; stopId: string; notes: string }
  | { type: 'UPDATE_ITINERARY_DAY_NOTES'; dayId: string; notes: string }
  | { type: 'ADD_ITINERARY_STOP'; dayId: string; stop: { title: string; description?: string; location?: string; start_time?: string; end_time?: string; category?: string; notes?: string } }

// ─── Change Log ────────────────────────────────────────────────────

export interface MotiChangeLogEntry {
  id: string
  timestamp: string
  action: MotiAction
  description: string
  previousValue: unknown
  newValue: unknown
}

const CHANGE_LOG_KEY = 'hey-usa-moti-changelog'

function loadChangeLog(): MotiChangeLogEntry[] {
  try {
    const raw = localStorage.getItem(CHANGE_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveChangeLog(log: MotiChangeLogEntry[]) {
  try {
    localStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(log))
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

function describeAction(action: MotiAction): string {
  switch (action.type) {
    case 'UPDATE_BUDGET_CATEGORY': {
      const label = EXPENSE_CATEGORIES[action.category]?.label || action.category
      return `עדכון תקציב ${label} ל-₪${action.amount.toLocaleString()}`
    }
    case 'UPDATE_TOTAL_BUDGET':
      return `עדכון תקציב כולל ל-₪${action.amount.toLocaleString()}`
    case 'UPDATE_DAILY_BUDGET':
      return `עדכון תקציב יומי ל-₪${action.amount.toLocaleString()}`
    case 'ADD_EXPENSE':
      return `הוספת הוצאה: ${action.expense.title} (₪${action.expense.amount.toLocaleString()})`
    case 'UPDATE_ITINERARY_STOP_NOTES':
      return `עדכון הערות עצירה ${action.stopId} ב-${action.dayId}`
    case 'UPDATE_ITINERARY_DAY_NOTES':
      return `עדכון הערות ${action.dayId.replace('day-', 'יום ')}`
    case 'ADD_ITINERARY_STOP':
      return `הוספת עצירה "${action.stop.title}" ל-${action.dayId.replace('day-', 'יום ')}`
  }
}

// ─── Context Shape ─────────────────────────────────────────────────

interface TripDataContextType {
  // Budget
  budgetSettings: BudgetSettings
  expenses: Expense[]
  updateBudgetCategory: (category: string, amount: number) => void
  updateTotalBudget: (amount: number) => void
  updateDailyBudget: (amount: number) => void
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void
  deleteExpense: (id: string) => void

  // Itinerary
  itineraryDays: ItineraryDay[]
  updateItineraryDayNotes: (dayId: string, notes: string) => void
  addItineraryStop: (dayId: string, stop: { title: string; description?: string; location?: string; start_time?: string; end_time?: string; category?: string; notes?: string }) => void

  // Execute Moti actions
  executeMotiAction: (action: MotiAction) => string | null

  // Change log
  changeLog: MotiChangeLogEntry[]
  undoLastChange: () => boolean
  clearChangeLog: () => void
}

const TripDataContext = createContext<TripDataContextType | null>(null)

export function useTripData() {
  const ctx = useContext(TripDataContext)
  if (!ctx) throw new Error('useTripData must be used within TripDataProvider')
  return ctx
}

// ─── Provider ──────────────────────────────────────────────────────

export function TripDataProvider({ children }: { children: ReactNode }) {
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(SAMPLE_BUDGET_SETTINGS)
  const [expenses, setExpenses] = useState<Expense[]>(SAMPLE_EXPENSES)
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>(ITINERARY_DAYS)
  const [changeLog, setChangeLog] = useState<MotiChangeLogEntry[]>(loadChangeLog)

  const addToLog = useCallback((action: MotiAction, previousValue: unknown, newValue: unknown) => {
    const entry: MotiChangeLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      description: describeAction(action),
      previousValue,
      newValue,
    }
    setChangeLog((prev) => {
      const updated = [entry, ...prev].slice(0, 100) // keep last 100 entries
      saveChangeLog(updated)
      return updated
    })
  }, [])

  const updateBudgetCategory = useCallback((category: string, amount: number) => {
    setBudgetSettings((prev) => {
      const oldAmount = prev.category_budgets[category]
      const next = {
        ...prev,
        category_budgets: { ...prev.category_budgets, [category]: amount },
      }
      addToLog(
        { type: 'UPDATE_BUDGET_CATEGORY', category, amount },
        oldAmount,
        amount,
      )
      return next
    })
  }, [addToLog])

  const updateTotalBudget = useCallback((amount: number) => {
    setBudgetSettings((prev) => {
      addToLog(
        { type: 'UPDATE_TOTAL_BUDGET', amount },
        prev.total_budget,
        amount,
      )
      return { ...prev, total_budget: amount }
    })
  }, [addToLog])

  const updateDailyBudget = useCallback((amount: number) => {
    setBudgetSettings((prev) => {
      addToLog(
        { type: 'UPDATE_DAILY_BUDGET', amount },
        prev.daily_budget,
        amount,
      )
      return { ...prev, daily_budget: amount }
    })
  }, [addToLog])

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'created_at'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    setExpenses((prev) => {
      addToLog(
        { type: 'ADD_EXPENSE', expense },
        null,
        newExpense,
      )
      return [newExpense, ...prev]
    })
  }, [addToLog])

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateItineraryDayNotes = useCallback((dayId: string, notes: string) => {
    setItineraryDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day
        addToLog(
          { type: 'UPDATE_ITINERARY_DAY_NOTES', dayId, notes },
          day.notes,
          notes,
        )
        return { ...day, notes }
      }),
    )
  }, [addToLog])

  const addItineraryStop = useCallback(
    (dayId: string, stop: { title: string; description?: string; location?: string; start_time?: string; end_time?: string; category?: string; notes?: string }) => {
      setItineraryDays((prev) =>
        prev.map((day) => {
          if (day.id !== dayId) return day
          const newStop = {
            ...stop,
            id: `stop-${Date.now()}`,
            order: day.stops.length + 1,
          }
          addToLog(
            { type: 'ADD_ITINERARY_STOP', dayId, stop },
            null,
            newStop,
          )
          return { ...day, stops: [...day.stops, newStop] }
        }),
      )
    },
    [addToLog],
  )

  // ─── Undo ──────────────────────────────────────────────────────────

  const undoLastChange = useCallback((): boolean => {
    const latest = changeLog[0]
    if (!latest) return false

    switch (latest.action.type) {
      case 'UPDATE_BUDGET_CATEGORY': {
        const prev = latest.previousValue as number | undefined
        if (prev !== undefined && prev !== null) {
          setBudgetSettings((s) => ({
            ...s,
            category_budgets: { ...s.category_budgets, [latest.action.type === 'UPDATE_BUDGET_CATEGORY' ? (latest.action as { category: string }).category : '']: prev },
          }))
        }
        break
      }
      case 'UPDATE_TOTAL_BUDGET': {
        const prev = latest.previousValue as number
        if (prev) setBudgetSettings((s) => ({ ...s, total_budget: prev }))
        break
      }
      case 'UPDATE_DAILY_BUDGET': {
        const prev = latest.previousValue as number
        if (prev) setBudgetSettings((s) => ({ ...s, daily_budget: prev }))
        break
      }
      case 'ADD_EXPENSE': {
        const added = latest.newValue as Expense
        if (added?.id) setExpenses((prev) => prev.filter((e) => e.id !== added.id))
        break
      }
      case 'UPDATE_ITINERARY_DAY_NOTES': {
        const prev = latest.previousValue as string | undefined
        const dayId = latest.action.type === 'UPDATE_ITINERARY_DAY_NOTES'
          ? (latest.action as { dayId: string }).dayId
          : ''
        setItineraryDays((days) =>
          days.map((d) => (d.id === dayId ? { ...d, notes: prev || '' } : d)),
        )
        break
      }
      case 'ADD_ITINERARY_STOP': {
        const added = latest.newValue as { id: string }
        const dayId = latest.action.type === 'ADD_ITINERARY_STOP'
          ? (latest.action as { dayId: string }).dayId
          : ''
        if (added?.id) {
          setItineraryDays((days) =>
            days.map((d) =>
              d.id === dayId
                ? { ...d, stops: d.stops.filter((s) => s.id !== added.id) }
                : d,
            ),
          )
        }
        break
      }
    }

    // Remove the undone entry from the log
    setChangeLog((prev) => {
      const updated = prev.slice(1)
      saveChangeLog(updated)
      return updated
    })

    return true
  }, [changeLog])

  const clearChangeLog = useCallback(() => {
    setChangeLog([])
    saveChangeLog([])
  }, [])

  const executeMotiAction = useCallback(
    (action: MotiAction): string | null => {
      switch (action.type) {
        case 'UPDATE_BUDGET_CATEGORY': {
          updateBudgetCategory(action.category, action.amount)
          return null
        }
        case 'UPDATE_TOTAL_BUDGET': {
          updateTotalBudget(action.amount)
          return null
        }
        case 'UPDATE_DAILY_BUDGET': {
          updateDailyBudget(action.amount)
          return null
        }
        case 'ADD_EXPENSE': {
          addExpense(action.expense)
          return null
        }
        case 'UPDATE_ITINERARY_DAY_NOTES': {
          updateItineraryDayNotes(action.dayId, action.notes)
          return null
        }
        case 'ADD_ITINERARY_STOP': {
          addItineraryStop(action.dayId, action.stop)
          return null
        }
        default:
          return 'לא הצלחתי לבצע את הפעולה'
      }
    },
    [updateBudgetCategory, updateTotalBudget, updateDailyBudget, addExpense, updateItineraryDayNotes, addItineraryStop],
  )

  return (
    <TripDataContext.Provider
      value={{
        budgetSettings,
        expenses,
        updateBudgetCategory,
        updateTotalBudget,
        updateDailyBudget,
        addExpense,
        deleteExpense,
        itineraryDays,
        updateItineraryDayNotes,
        addItineraryStop,
        executeMotiAction,
        changeLog,
        undoLastChange,
        clearChangeLog,
      }}
    >
      {children}
    </TripDataContext.Provider>
  )
}
