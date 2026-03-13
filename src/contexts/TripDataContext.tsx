import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Expense, BudgetSettings, ItineraryDay } from '@/lib/types'
import { SAMPLE_EXPENSES, SAMPLE_BUDGET_SETTINGS } from '@/modules/budget/data/sampleExpenses'
import { ITINERARY_DAYS } from '@/data/itinerary'

// ─── Action Types ──────────────────────────────────────────────────

export type MotiAction =
  | { type: 'UPDATE_BUDGET_CATEGORY'; category: string; amount: number }
  | { type: 'UPDATE_TOTAL_BUDGET'; amount: number }
  | { type: 'UPDATE_DAILY_BUDGET'; amount: number }
  | { type: 'ADD_EXPENSE'; expense: Omit<Expense, 'id' | 'created_at'> }
  | { type: 'UPDATE_ITINERARY_STOP_NOTES'; dayId: string; stopId: string; notes: string }
  | { type: 'UPDATE_ITINERARY_DAY_NOTES'; dayId: string; notes: string }
  | { type: 'ADD_ITINERARY_STOP'; dayId: string; stop: { title: string; description?: string; location?: string; start_time?: string; end_time?: string; category?: string; notes?: string } }

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

  const updateBudgetCategory = useCallback((category: string, amount: number) => {
    setBudgetSettings((prev) => ({
      ...prev,
      category_budgets: { ...prev.category_budgets, [category]: amount },
    }))
  }, [])

  const updateTotalBudget = useCallback((amount: number) => {
    setBudgetSettings((prev) => ({ ...prev, total_budget: amount }))
  }, [])

  const updateDailyBudget = useCallback((amount: number) => {
    setBudgetSettings((prev) => ({ ...prev, daily_budget: amount }))
  }, [])

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'created_at'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    setExpenses((prev) => [newExpense, ...prev])
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateItineraryDayNotes = useCallback((dayId: string, notes: string) => {
    setItineraryDays((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, notes } : day)),
    )
  }, [])

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
          return { ...day, stops: [...day.stops, newStop] }
        }),
      )
    },
    [],
  )

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
      }}
    >
      {children}
    </TripDataContext.Provider>
  )
}
