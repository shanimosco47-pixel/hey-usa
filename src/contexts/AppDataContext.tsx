// ─── AppDataContext ──────────────────────────────────────────────────
// Single source of truth for ALL app data.
// Loads from Dexie first (instant), then pulls from Supabase in background.

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import type {
  Task,
  TaskGroup,
  Expense,
  BudgetSettings,
  ItineraryDay,
  PackingItem,
  BlogPost,
  Photo,
  Document,
  PlaylistItem,
  LocationNote,
  FamilyMemberId,
  NoteColor,
  ActivityPoll,
} from '@/lib/types'
import { EXPENSE_CATEGORIES } from '@/constants'
import * as db from '@/lib/database'
import { hydrateAvatarsFromSupabase } from '@/lib/avatarStorage'
import { localDb } from '@/lib/db'
import { pullFromSupabase, flushSyncQueue, queueSync } from '@/lib/sync'

// Fallback sample data (used when Supabase is unavailable)
import { SAMPLE_BUDGET_SETTINGS, SAMPLE_EXPENSES } from '@/modules/budget/data/sampleExpenses'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { sampleTasks } from '@/modules/tasks/data/sampleTasks'
import { SAMPLE_PACKING_ITEMS } from '@/modules/packing/data/samplePacking'
import { SAMPLE_BLOG_POSTS } from '@/modules/blog/data/samplePosts'
import { SAMPLE_PHOTOS } from '@/modules/photos/data/samplePhotos'
import { sampleDocuments as SAMPLE_DOCUMENTS } from '@/modules/documents/data/sampleDocuments'
import { SAMPLE_PLAYLIST } from '@/modules/entertainment/data/sampleEntertainment'
import { SAMPLE_LOCATION_NOTES } from '@/data/sampleLocationNotes'

// ─── Moti Action Types ──────────────────────────────────────────────

export type MotiAction =
  | { type: 'UPDATE_BUDGET_CATEGORY'; category: string; amount: number }
  | { type: 'UPDATE_TOTAL_BUDGET'; amount: number }
  | { type: 'UPDATE_DAILY_BUDGET'; amount: number }
  | { type: 'ADD_EXPENSE'; expense: Omit<Expense, 'id' | 'created_at'> }
  | { type: 'UPDATE_ITINERARY_STOP_NOTES'; dayId: string; stopId: string; notes: string }
  | { type: 'UPDATE_ITINERARY_DAY_NOTES'; dayId: string; notes: string }
  | {
      type: 'ADD_ITINERARY_STOP'
      dayId: string
      stop: {
        title: string
        description?: string
        location?: string
        start_time?: string
        end_time?: string
        category?: string
        notes?: string
      }
    }
  | { type: 'ADD_TASK'; task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'order'> }
  | { type: 'COMPLETE_TASK'; taskTitle: string }
  | {
      type: 'ADD_NOTE'
      note: {
        text: string
        author: FamilyMemberId
        color: NoteColor
        locationId: string | null
        pinned: boolean
      }
    }
  | { type: 'TOGGLE_PACKING_ITEM'; itemName: string }
  | { type: 'ASK_CLARIFICATION'; question: string }
  | { type: 'SEARCH_EMAIL'; query: string }
  | { type: 'CONVERT_CURRENCY'; amount: number; from: 'ILS' | 'USD'; to: 'ILS' | 'USD' }
  | { type: 'ESTIMATE_DRIVE_TIME'; from: string; to: string }
  | { type: 'GET_DAILY_PLAN'; dayNumber: number }

// ─── Change Log ─────────────────────────────────────────────────────

export interface MotiChangeLogEntry {
  id: string
  timestamp: string
  action: MotiAction
  description: string
  previousValue: unknown
  newValue: unknown
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
    case 'ADD_TASK':
      return `הוספת משימה: ${action.task.title}`
    case 'COMPLETE_TASK':
      return `סימון משימה כהושלמה: ${action.taskTitle}`
    case 'ADD_NOTE':
      return `הוספת פתק: ${action.note.text.slice(0, 30)}${action.note.text.length > 30 ? '...' : ''}`
    case 'TOGGLE_PACKING_ITEM':
      return `שינוי סטטוס אריזה: ${action.itemName}`
    case 'ASK_CLARIFICATION':
      return `שאלת הבהרה`
    case 'SEARCH_EMAIL':
      return `חיפוש אימייל: ${action.query}`
    case 'CONVERT_CURRENCY':
      return `המרת מטבע: ${action.amount} ${action.from} → ${action.to}`
    case 'ESTIMATE_DRIVE_TIME':
      return `הערכת זמן נסיעה: ${action.from} → ${action.to}`
    case 'GET_DAILY_PLAN':
      return `תכנית יום ${action.dayNumber}`
  }
}

// ─── Context Shape ──────────────────────────────────────────────────

interface AppDataContextType {
  isLoading: boolean

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
  addItineraryStop: (
    dayId: string,
    stop: {
      title: string
      description?: string
      location?: string
      start_time?: string
      end_time?: string
      category?: string
      notes?: string
    },
  ) => void
  updateItineraryStop: (
    dayId: string,
    stopId: string,
    updates: { start_time?: string; end_time?: string },
  ) => void

  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Task
  updateTask: (id: string, changes: Partial<Task>) => void
  deleteTask: (id: string) => void
  reorderTask: (id: string, newOrder: number, newGroup?: TaskGroup) => void

  // Packing
  packingItems: PackingItem[]
  addPackingItem: (item: Omit<PackingItem, 'id'>) => void
  updatePackingItem: (id: string, changes: Partial<PackingItem>) => void
  deletePackingItem: (id: string) => void

  // Blog
  blogPosts: BlogPost[]
  addBlogPost: (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => void
  updateBlogPost: (id: string, changes: Partial<BlogPost>) => void
  deleteBlogPost: (id: string) => void

  // Photos
  photos: Photo[]
  addPhoto: (photo: Omit<Photo, 'id' | 'created_at'>) => void
  updatePhoto: (id: string, changes: Partial<Photo>) => void
  deletePhoto: (id: string) => void

  // Documents
  documents: Document[]
  addDocument: (doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => void
  updateDocument: (id: string, changes: Partial<Document>) => void
  deleteDocument: (id: string) => void

  // Playlist
  playlistItems: PlaylistItem[]
  addPlaylistItem: (item: Omit<PlaylistItem, 'id' | 'created_at'>) => void
  updatePlaylistItem: (id: string, changes: Partial<PlaylistItem>) => void
  deletePlaylistItem: (id: string) => void

  // Location Notes
  locationNotes: LocationNote[]
  addLocationNote: (note: Omit<LocationNote, 'id' | 'created_at' | 'updated_at'>) => void
  updateLocationNote: (id: string, changes: Partial<LocationNote>) => void
  deleteLocationNote: (id: string) => void

  // Activity Polls
  polls: ActivityPoll[]
  addPoll: (poll: Omit<ActivityPoll, 'id' | 'created_at'>) => void
  votePoll: (pollId: string, optionIndex: number, memberId: FamilyMemberId) => void
  deletePoll: (id: string) => void

  // Moti
  executeMotiAction: (action: MotiAction) => string | null
  buildMotiContext: () => string
  changeLog: MotiChangeLogEntry[]
  undoLastChange: () => boolean
  clearChangeLog: () => void
}

const AppDataContext = createContext<AppDataContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTripData = useAppData

// ─── Provider ───────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  // All state
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(SAMPLE_BUDGET_SETTINGS)
  const [expenses, setExpenses] = useState<Expense[]>(SAMPLE_EXPENSES)
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>(ITINERARY_DAYS)
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)
  const [packingItems, setPackingItems] = useState<PackingItem[]>(SAMPLE_PACKING_ITEMS)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(SAMPLE_BLOG_POSTS)
  const [photos, setPhotos] = useState<Photo[]>(SAMPLE_PHOTOS)
  const [documents, setDocuments] = useState<Document[]>(SAMPLE_DOCUMENTS)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>(SAMPLE_PLAYLIST)
  const [locationNotes, setLocationNotes] = useState<LocationNote[]>(SAMPLE_LOCATION_NOTES)
  const [polls, setPolls] = useState<ActivityPoll[]>([])
  const [changeLog, setChangeLog] = useState<MotiChangeLogEntry[]>([])

  // ─── Load data: Dexie first, Supabase in background ────────────

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        // Step 1: Try Dexie first (instant, offline-ready)
        const localTasks = await localDb.tasks.toArray()

        if (localTasks.length > 0) {
          // We have local data — show it immediately
          if (!cancelled) {
            setTasks(localTasks)
            setExpenses(await localDb.expenses.toArray())
            const bs = await localDb.budgetSettings.get('main')
            if (bs) setBudgetSettings(bs)
            setPackingItems(await localDb.packingItems.toArray())
            setBlogPosts(await localDb.blogPosts.toArray())
            setPhotos(await localDb.photos.toArray())
            setDocuments(await localDb.documents.toArray())
            setPlaylistItems(await localDb.playlistItems.toArray())
            setLocationNotes(await localDb.locationNotes.toArray())
            setPolls(await localDb.polls.toArray())
            setIsLoading(false)
          }
        }

        // Step 2: Pull fresh data from Supabase in background
        const pulled = await pullFromSupabase()
        if (pulled && !cancelled) {
          // Refresh state from Dexie (now updated with Supabase data)
          setTasks(await localDb.tasks.toArray())
          setExpenses(await localDb.expenses.toArray())
          const bs = await localDb.budgetSettings.get('main')
          if (bs) setBudgetSettings(bs)
          setPackingItems(await localDb.packingItems.toArray())
          setBlogPosts(await localDb.blogPosts.toArray())
          setPhotos(await localDb.photos.toArray())
          setDocuments(await localDb.documents.toArray())
          setPlaylistItems(await localDb.playlistItems.toArray())
          setLocationNotes(await localDb.locationNotes.toArray())
          setPolls(await localDb.polls.toArray())

          // Hydrate avatars
          await hydrateAvatarsFromSupabase()
        }

        // Step 3: If no local data and no Supabase, seed Dexie from sample data
        if (localTasks.length === 0 && !pulled) {
          await localDb.tasks.bulkPut(sampleTasks)
          await localDb.expenses.bulkPut(SAMPLE_EXPENSES)
          await localDb.budgetSettings.put({ ...SAMPLE_BUDGET_SETTINGS, id: 'main' })
          await localDb.packingItems.bulkPut(SAMPLE_PACKING_ITEMS)
          await localDb.blogPosts.bulkPut(SAMPLE_BLOG_POSTS)
          await localDb.photos.bulkPut(SAMPLE_PHOTOS)
          await localDb.documents.bulkPut(SAMPLE_DOCUMENTS)
          await localDb.playlistItems.bulkPut(SAMPLE_PLAYLIST)
          await localDb.locationNotes.bulkPut(SAMPLE_LOCATION_NOTES)
          // State already has sample data as defaults — no need to set again
        }

        if (!cancelled) setIsLoading(false)

        // Step 4: Flush any pending sync items
        await flushSyncQueue()
      } catch (err) {
        console.warn('[Hey USA] Data load failed, using sample data:', err)
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [])

  // ─── Online listener — flush pending sync queue ──────────────

  useEffect(() => {
    const handleOnline = () => {
      flushSyncQueue().then((count) => {
        if (count > 0) console.log(`[Hey USA] Synced ${count} pending changes`)
      })
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // ─── Change Log helper ──────────────────────────────────────────

  const addToLog = useCallback((action: MotiAction, previousValue: unknown, newValue: unknown) => {
    const entry: MotiChangeLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      description: describeAction(action),
      previousValue,
      newValue,
    }
    setChangeLog((prev) => [entry, ...prev].slice(0, 100))
    // Persist to Supabase
    db.insertMotiChangeLogEntry({
      id: entry.id,
      action: entry.action,
      description: entry.description,
      previous_value: previousValue,
      new_value: newValue,
    }).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Budget ─────────────────────────────────────────────────────

  const updateBudgetCategory = useCallback(
    (category: string, amount: number) => {
      setBudgetSettings((prev) => {
        const oldAmount = prev.category_budgets[category]
        const next = {
          ...prev,
          category_budgets: { ...prev.category_budgets, [category]: amount },
        }
        addToLog({ type: 'UPDATE_BUDGET_CATEGORY', category, amount }, oldAmount, amount)
        localDb.budgetSettings.put({ ...next, id: 'main' }).catch(() => {})
        queueSync('budgetSettings', 'main', 'upsert').catch(() => {})
        db.upsertBudgetSettings(next).catch((err) =>
          console.error('[AppData] Operation failed:', err),
        )
        return next
      })
    },
    [addToLog],
  )

  const updateTotalBudget = useCallback(
    (amount: number) => {
      setBudgetSettings((prev) => {
        addToLog({ type: 'UPDATE_TOTAL_BUDGET', amount }, prev.total_budget, amount)
        const next = { ...prev, total_budget: amount }
        localDb.budgetSettings.put({ ...next, id: 'main' }).catch(() => {})
        queueSync('budgetSettings', 'main', 'upsert').catch(() => {})
        db.upsertBudgetSettings(next).catch((err) =>
          console.error('[AppData] Operation failed:', err),
        )
        return next
      })
    },
    [addToLog],
  )

  const updateDailyBudget = useCallback(
    (amount: number) => {
      setBudgetSettings((prev) => {
        addToLog({ type: 'UPDATE_DAILY_BUDGET', amount }, prev.daily_budget, amount)
        const next = { ...prev, daily_budget: amount }
        localDb.budgetSettings.put({ ...next, id: 'main' }).catch(() => {})
        queueSync('budgetSettings', 'main', 'upsert').catch(() => {})
        db.upsertBudgetSettings(next).catch((err) =>
          console.error('[AppData] Operation failed:', err),
        )
        return next
      })
    },
    [addToLog],
  )

  const addExpense = useCallback(
    (expense: Omit<Expense, 'id' | 'created_at'>) => {
      const newExpense: Expense = {
        ...expense,
        id: `exp-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      setExpenses((prev) => {
        addToLog({ type: 'ADD_EXPENSE', expense }, null, newExpense)
        return [newExpense, ...prev]
      })
      localDb.expenses.put(newExpense).catch(() => {})
      queueSync('expenses', newExpense.id, 'upsert').catch(() => {})
      db.insertExpense(newExpense).catch((err) => console.error('[AppData] Operation failed:', err))
    },
    [addToLog],
  )

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    localDb.expenses.delete(id).catch(() => {})
    queueSync('expenses', id, 'delete').catch(() => {})
    db.deleteExpenseById(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Itinerary ──────────────────────────────────────────────────

  const updateItineraryDayNotes = useCallback(
    (dayId: string, notes: string) => {
      setItineraryDays((prev) =>
        prev.map((day) => {
          if (day.id !== dayId) return day
          addToLog({ type: 'UPDATE_ITINERARY_DAY_NOTES', dayId, notes }, day.notes, notes)
          return { ...day, notes }
        }),
      )
      db.updateItineraryDay(dayId, { notes }).catch((err) =>
        console.error('[AppData] Operation failed:', err),
      )
    },
    [addToLog],
  )

  const addItineraryStop = useCallback(
    (
      dayId: string,
      stop: {
        title: string
        description?: string
        location?: string
        start_time?: string
        end_time?: string
        category?: string
        notes?: string
      },
    ) => {
      const stopId = `stop-${Date.now()}`
      setItineraryDays((prev) =>
        prev.map((day) => {
          if (day.id !== dayId) return day
          const newStop = { ...stop, id: stopId, order: day.stops.length + 1 }
          addToLog({ type: 'ADD_ITINERARY_STOP', dayId, stop }, null, newStop)
          return { ...day, stops: [...day.stops, newStop] }
        }),
      )
      db.insertItineraryStop(dayId, { ...stop, id: stopId, order: 0 }).catch((err) =>
        console.error('[AppData] Operation failed:', err),
      )
    },
    [addToLog],
  )

  const updateItineraryStop = useCallback(
    (dayId: string, stopId: string, updates: { start_time?: string; end_time?: string }) => {
      setItineraryDays((prev) =>
        prev.map((day) => {
          if (day.id !== dayId) return day
          return {
            ...day,
            stops: day.stops.map((s) => (s.id === stopId ? { ...s, ...updates } : s)),
          }
        }),
      )
      db.updateItineraryStop(stopId, updates).catch((err) =>
        console.error('[AppData] updateItineraryStop failed:', err),
      )
    },
    [],
  )

  // ─── Tasks ──────────────────────────────────────────────────────

  const addTask = useCallback((task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
    const now = new Date().toISOString()
    const newTask: Task = { ...task, id: `task-${Date.now()}`, created_at: now, updated_at: now }
    setTasks((prev) => [...prev, newTask])
    localDb.tasks.put(newTask).catch(() => {})
    queueSync('tasks', newTask.id, 'upsert').catch(() => {})
    db.upsertTask(newTask).catch((err) => console.error('[AppData] Operation failed:', err))
    return newTask
  }, [])

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, ...changes, updated_at: new Date().toISOString() }
        if (changes.status === 'done' && t.status !== 'done') {
          updated.completed_at = new Date().toISOString()
        }
        if (changes.status && changes.status !== 'done') {
          updated.completed_at = undefined
        }
        localDb.tasks.put(updated).catch(() => {})
        queueSync('tasks', updated.id, 'upsert').catch(() => {})
        db.upsertTask(updated).catch((err) => console.error('[AppData] Operation failed:', err))
        return updated
      }),
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    localDb.tasks.delete(id).catch(() => {})
    queueSync('tasks', id, 'delete').catch(() => {})
    db.deleteTaskById(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  const reorderTask = useCallback((id: string, newOrder: number, newGroup?: TaskGroup) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const updated = {
          ...t,
          order: newOrder,
          group: newGroup ?? t.group,
          updated_at: new Date().toISOString(),
        }
        localDb.tasks.put(updated).catch(() => {})
        queueSync('tasks', updated.id, 'upsert').catch(() => {})
        db.upsertTask(updated).catch((err) => console.error('[AppData] Operation failed:', err))
        return updated
      }),
    )
  }, [])

  // ─── Packing ────────────────────────────────────────────────────

  const addPackingItem = useCallback((item: Omit<PackingItem, 'id'>) => {
    const newItem: PackingItem = { ...item, id: `p-${Date.now()}` }
    setPackingItems((prev) => [...prev, newItem])
    localDb.packingItems.put(newItem).catch(() => {})
    queueSync('packingItems', newItem.id, 'upsert').catch(() => {})
    db.upsertPackingItem(newItem).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  const updatePackingItem = useCallback((id: string, changes: Partial<PackingItem>) => {
    setPackingItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...changes }
        localDb.packingItems.put(updated).catch(() => {})
        queueSync('packingItems', updated.id, 'upsert').catch(() => {})
        db.upsertPackingItem(updated).catch((err) =>
          console.error('[AppData] Operation failed:', err),
        )
        return updated
      }),
    )
  }, [])

  const deletePackingItem = useCallback((id: string) => {
    setPackingItems((prev) => prev.filter((p) => p.id !== id))
    localDb.packingItems.delete(id).catch(() => {})
    queueSync('packingItems', id, 'delete').catch(() => {})
    db.deletePackingItemById(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Blog ───────────────────────────────────────────────────────

  const addBlogPost = useCallback((post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const newPost: BlogPost = {
      ...post,
      id: `post-${Date.now()}`,
      created_at: now,
      updated_at: now,
    }
    setBlogPosts((prev) => [newPost, ...prev])
    localDb.blogPosts.put(newPost).catch(() => {})
    queueSync('blogPosts', newPost.id, 'upsert').catch(() => {})
    db.upsertBlogPost(newPost).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  const updateBlogPost = useCallback((id: string, changes: Partial<BlogPost>) => {
    setBlogPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...changes, updated_at: new Date().toISOString() }
        localDb.blogPosts.put(updated).catch(() => {})
        queueSync('blogPosts', updated.id, 'upsert').catch(() => {})
        db.upsertBlogPost(updated).catch((err) => console.error('[AppData] Operation failed:', err))
        return updated
      }),
    )
  }, [])

  const deleteBlogPost = useCallback((id: string) => {
    setBlogPosts((prev) => prev.filter((p) => p.id !== id))
    localDb.blogPosts.delete(id).catch(() => {})
    queueSync('blogPosts', id, 'delete').catch(() => {})
    db.deleteBlogPostById(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Photos ─────────────────────────────────────────────────────

  const addPhoto = useCallback((photo: Omit<Photo, 'id' | 'created_at'>) => {
    const newPhoto: Photo = {
      ...photo,
      id: `photo-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    setPhotos((prev) => [newPhoto, ...prev])
    localDb.photos.put(newPhoto).catch(() => {})
    queueSync('photos', newPhoto.id, 'upsert').catch(() => {})
    db.upsertPhoto(newPhoto).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  const updatePhoto = useCallback((id: string, changes: Partial<Photo>) => {
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...changes }
        localDb.photos.put(updated).catch(() => {})
        queueSync('photos', updated.id, 'upsert').catch(() => {})
        db.upsertPhoto(updated).catch((err) => console.error('[AppData] Operation failed:', err))
        return updated
      }),
    )
  }, [])

  const deletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
    localDb.photos.delete(id).catch(() => {})
    queueSync('photos', id, 'delete').catch(() => {})
    db.deletePhotoById(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Documents ──────────────────────────────────────────────────

  const addDocument = useCallback((doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const newDoc: Document = { ...doc, id: `udoc-${Date.now()}`, created_at: now, updated_at: now }
    setDocuments((prev) => [newDoc, ...prev])
    localDb.documents.put(newDoc).catch(() => {})
    queueSync('documents', newDoc.id, 'upsert').catch(() => {})
    db.upsertDocument(newDoc).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  const updateDocument = useCallback((id: string, changes: Partial<Document>) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        const updated = { ...d, ...changes, updated_at: new Date().toISOString() }
        localDb.documents.put(updated).catch(() => {})
        queueSync('documents', updated.id, 'upsert').catch(() => {})
        db.upsertDocument(updated).catch((err) => console.error('[AppData] Operation failed:', err))
        return updated
      }),
    )
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    localDb.documents.delete(id).catch(() => {})
    queueSync('documents', id, 'delete').catch(() => {})
    db.deleteDocumentById(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Playlist ───────────────────────────────────────────────────

  const addPlaylistItem = useCallback((item: Omit<PlaylistItem, 'id' | 'created_at'>) => {
    const newItem: PlaylistItem = {
      ...item,
      id: `song-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    setPlaylistItems((prev) => [newItem, ...prev])
    localDb.playlistItems.put(newItem).catch(() => {})
    queueSync('playlistItems', newItem.id, 'upsert').catch(() => {})
    db.upsertPlaylistItem(newItem).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  const updatePlaylistItem = useCallback((id: string, changes: Partial<PlaylistItem>) => {
    setPlaylistItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...changes }
        localDb.playlistItems.put(updated).catch(() => {})
        queueSync('playlistItems', updated.id, 'upsert').catch(() => {})
        db.upsertPlaylistItem(updated).catch((err) =>
          console.error('[AppData] Operation failed:', err),
        )
        return updated
      }),
    )
  }, [])

  const deletePlaylistItem = useCallback((id: string) => {
    setPlaylistItems((prev) => prev.filter((p) => p.id !== id))
    localDb.playlistItems.delete(id).catch(() => {})
    queueSync('playlistItems', id, 'delete').catch(() => {})
    db.deletePlaylistItem(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Location Notes ────────────────────────────────────────────

  const addLocationNote = useCallback(
    (note: Omit<LocationNote, 'id' | 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString()
      const newNote: LocationNote = {
        ...note,
        id: `note-${Date.now()}`,
        created_at: now,
        updated_at: now,
      }
      setLocationNotes((prev) => [newNote, ...prev])
      localDb.locationNotes.put(newNote).catch(() => {})
      queueSync('locationNotes', newNote.id, 'upsert').catch(() => {})
      db.upsertLocationNote(newNote).catch((err) =>
        console.error('[AppData] Operation failed:', err),
      )
    },
    [],
  )

  const updateLocationNote = useCallback((id: string, changes: Partial<LocationNote>) => {
    setLocationNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const updated = { ...n, ...changes, updated_at: new Date().toISOString() }
        localDb.locationNotes.put(updated).catch(() => {})
        queueSync('locationNotes', updated.id, 'upsert').catch(() => {})
        db.upsertLocationNote(updated).catch((err) =>
          console.error('[AppData] Operation failed:', err),
        )
        return updated
      }),
    )
  }, [])

  const deleteLocationNote = useCallback((id: string) => {
    setLocationNotes((prev) => prev.filter((n) => n.id !== id))
    localDb.locationNotes.delete(id).catch(() => {})
    queueSync('locationNotes', id, 'delete').catch(() => {})
    db.deleteLocationNoteById(id).catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Activity Polls ─────────────────────────────────────────────

  const addPoll = useCallback((poll: Omit<ActivityPoll, 'id' | 'created_at'>) => {
    const newPoll: ActivityPoll = {
      ...poll,
      id: `poll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
    }
    setPolls((prev) => [newPoll, ...prev])
    localDb.polls.put(newPoll).catch(() => {})
    queueSync('polls', newPoll.id, 'upsert').catch(() => {})
    db.upsertActivityPoll(newPoll).catch(() => {})
  }, [])

  const votePoll = useCallback((pollId: string, optionIndex: number, memberId: FamilyMemberId) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p
        const filtered = p.votes.filter((v) => v.member_id !== memberId)
        const updated = { ...p, votes: [...filtered, { member_id: memberId, option_index: optionIndex }] }
        localDb.polls.put(updated).catch(() => {})
        queueSync('polls', pollId, 'upsert').catch(() => {})
        db.upsertActivityPoll(updated).catch(() => {})
        return updated
      }),
    )
  }, [])

  const deletePoll = useCallback((id: string) => {
    setPolls((prev) => prev.filter((p) => p.id !== id))
    localDb.polls.delete(id).catch(() => {})
    queueSync('polls', id, 'delete').catch(() => {})
    db.deleteActivityPoll(id).catch(() => {})
  }, [])

  // ─── Undo ───────────────────────────────────────────────────────

  const undoLastChange = useCallback((): boolean => {
    const latest = changeLog[0]
    if (!latest) return false

    switch (latest.action.type) {
      case 'UPDATE_BUDGET_CATEGORY': {
        const prev = latest.previousValue as number | undefined
        if (prev !== undefined && prev !== null) {
          setBudgetSettings((s) => {
            const next = {
              ...s,
              category_budgets: {
                ...s.category_budgets,
                [latest.action.type === 'UPDATE_BUDGET_CATEGORY'
                  ? (latest.action as { category: string }).category
                  : '']: prev,
              },
            }
            db.upsertBudgetSettings(next).catch((err) =>
              console.error('[AppData] Operation failed:', err),
            )
            return next
          })
        }
        break
      }
      case 'UPDATE_TOTAL_BUDGET': {
        const prev = latest.previousValue as number
        if (prev) {
          setBudgetSettings((s) => {
            const next = { ...s, total_budget: prev }
            db.upsertBudgetSettings(next).catch((err) =>
              console.error('[AppData] Operation failed:', err),
            )
            return next
          })
        }
        break
      }
      case 'UPDATE_DAILY_BUDGET': {
        const prev = latest.previousValue as number
        if (prev) {
          setBudgetSettings((s) => {
            const next = { ...s, daily_budget: prev }
            db.upsertBudgetSettings(next).catch((err) =>
              console.error('[AppData] Operation failed:', err),
            )
            return next
          })
        }
        break
      }
      case 'ADD_EXPENSE': {
        const added = latest.newValue as Expense
        if (added?.id) {
          setExpenses((prev) => prev.filter((e) => e.id !== added.id))
          db.deleteExpenseById(added.id).catch((err) =>
            console.error('[AppData] Operation failed:', err),
          )
        }
        break
      }
      case 'UPDATE_ITINERARY_DAY_NOTES': {
        const prev = latest.previousValue as string | undefined
        const dayId = (latest.action as { dayId: string }).dayId
        setItineraryDays((days) =>
          days.map((d) => (d.id === dayId ? { ...d, notes: prev || '' } : d)),
        )
        db.updateItineraryDay(dayId, { notes: prev || '' }).catch((err) =>
          console.error('[AppData] Operation failed:', err),
        )
        break
      }
      case 'ADD_ITINERARY_STOP': {
        const added = latest.newValue as { id: string }
        const dayId = (latest.action as { dayId: string }).dayId
        if (added?.id) {
          setItineraryDays((days) =>
            days.map((d) =>
              d.id === dayId ? { ...d, stops: d.stops.filter((s) => s.id !== added.id) } : d,
            ),
          )
        }
        break
      }
    }

    setChangeLog((prev) => prev.slice(1))
    return true
  }, [changeLog])

  const clearChangeLog = useCallback(() => {
    setChangeLog([])
    db.deleteMotiChangeLog().catch((err) => console.error('[AppData] Operation failed:', err))
  }, [])

  // ─── Build Moti Context ─────────────────────────────────────────

  const buildMotiContext = useCallback((): string => {
    const totalBudget = budgetSettings.total_budget
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    const budgetPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    const openTasks = tasks.filter((t) => t.status !== 'done')
    const urgentTasks = openTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high')

    const totalPacking = packingItems.length
    const packedCount = packingItems.filter((p) => p.is_packed).length
    const packingPercent = totalPacking > 0 ? Math.round((packedCount / totalPacking) * 100) : 0

    const daysUntilTrip = Math.ceil(
      (new Date('2026-09-11').getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )

    const recentExpenses = expenses
      .slice(0, 5)
      .map((e) => `${e.title}: ₪${e.amount}`)
      .join(', ')

    const lines = [
      `ימים לטיול: ${daysUntilTrip}`,
      `תקציב: ₪${totalSpent.toLocaleString()} מתוך ₪${totalBudget.toLocaleString()} (${budgetPercent}% נוצל)`,
      `תקציב יומי: ₪${(budgetSettings.daily_budget ?? 0).toLocaleString()}`,
      `משימות: ${openTasks.length} פתוחות מתוך ${tasks.length} (${urgentTasks.length} דחופות)`,
      `אריזה: ${packingPercent}% ארוז (${packedCount}/${totalPacking})`,
      `פתקים: ${locationNotes.length}`,
      recentExpenses ? `הוצאות אחרונות: ${recentExpenses}` : '',
      urgentTasks.length > 0 ? `משימות דחופות: ${urgentTasks.map((t) => t.title).join(', ')}` : '',
    ]

    return lines.filter(Boolean).join('\n')
  }, [budgetSettings, expenses, tasks, packingItems, locationNotes])

  // ─── Execute Moti Action ────────────────────────────────────────

  const executeMotiAction = useCallback(
    (action: MotiAction): string | null => {
      switch (action.type) {
        case 'UPDATE_BUDGET_CATEGORY':
          updateBudgetCategory(action.category, action.amount)
          return null
        case 'UPDATE_TOTAL_BUDGET':
          updateTotalBudget(action.amount)
          return null
        case 'UPDATE_DAILY_BUDGET':
          updateDailyBudget(action.amount)
          return null
        case 'ADD_EXPENSE':
          addExpense(action.expense)
          return null
        case 'UPDATE_ITINERARY_DAY_NOTES':
          updateItineraryDayNotes(action.dayId, action.notes)
          return null
        case 'ADD_ITINERARY_STOP':
          addItineraryStop(action.dayId, action.stop)
          return null
        case 'ADD_TASK': {
          const newTask = addTask({
            ...action.task,
            status: action.task.status || 'todo',
            priority: action.task.priority || 'medium',
            group: action.task.group || 'pre_trip',
            assigned_to: action.task.assigned_to || ['aba'],
            order: tasks.length,
          })
          addToLog(action, null, newTask)
          return null
        }
        case 'COMPLETE_TASK': {
          const searchTitle = action.taskTitle.toLowerCase()
          const task = tasks.find(
            (t) => t.title.toLowerCase().includes(searchTitle) && t.status !== 'done',
          )
          if (!task) return `לא מצאתי משימה פתוחה שמתאימה ל: ${action.taskTitle}`
          updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() })
          addToLog(action, task.status, 'done')
          return null
        }
        case 'ADD_NOTE': {
          addLocationNote({
            text: action.note.text,
            author: action.note.author || 'aba',
            color: action.note.color || 'yellow',
            locationId: action.note.locationId,
            pinned: action.note.pinned || false,
          })
          addToLog(action, null, action.note.text)
          return null
        }
        case 'TOGGLE_PACKING_ITEM': {
          const searchName = action.itemName.toLowerCase()
          const item = packingItems.find((p) => p.name.toLowerCase().includes(searchName))
          if (!item) return `לא מצאתי פריט אריזה שמתאים ל: ${action.itemName}`
          updatePackingItem(item.id, { is_packed: !item.is_packed })
          addToLog(action, item.is_packed, !item.is_packed)
          return null
        }
        case 'ASK_CLARIFICATION':
          return null
        case 'SEARCH_EMAIL': {
          // Handled by ChatPage — return null to signal no error
          return null
        }
        case 'CONVERT_CURRENCY':
        case 'ESTIMATE_DRIVE_TIME':
        case 'GET_DAILY_PLAN':
          // Info-only actions — handled by botEngine card system, no state mutation
          return null
        default:
          return 'לא הצלחתי לבצע את הפעולה'
      }
    },
    [
      updateBudgetCategory,
      updateTotalBudget,
      updateDailyBudget,
      addExpense,
      updateItineraryDayNotes,
      addItineraryStop,
      updateItineraryStop,
      tasks,
      packingItems,
      updateTask,
      updatePackingItem,
      addTask,
      addLocationNote,
      addToLog,
    ],
  )

  const contextValue = useMemo<AppDataContextType>(
    () => ({
      isLoading,
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
      updateItineraryStop,
      tasks,
      addTask,
      updateTask,
      deleteTask,
      reorderTask,
      packingItems,
      addPackingItem,
      updatePackingItem,
      deletePackingItem,
      blogPosts,
      addBlogPost,
      updateBlogPost,
      deleteBlogPost,
      photos,
      addPhoto,
      updatePhoto,
      deletePhoto,
      documents,
      addDocument,
      updateDocument,
      deleteDocument,
      playlistItems,
      addPlaylistItem,
      updatePlaylistItem,
      deletePlaylistItem,
      locationNotes,
      addLocationNote,
      updateLocationNote,
      deleteLocationNote,
      polls,
      addPoll,
      votePoll,
      deletePoll,
      executeMotiAction,
      changeLog,
      undoLastChange,
      clearChangeLog,
      buildMotiContext,
    }),
    [
      isLoading,
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
      updateItineraryStop,
      tasks,
      addTask,
      updateTask,
      deleteTask,
      reorderTask,
      packingItems,
      addPackingItem,
      updatePackingItem,
      deletePackingItem,
      blogPosts,
      addBlogPost,
      updateBlogPost,
      deleteBlogPost,
      photos,
      addPhoto,
      updatePhoto,
      deletePhoto,
      documents,
      addDocument,
      updateDocument,
      deleteDocument,
      playlistItems,
      addPlaylistItem,
      updatePlaylistItem,
      deletePlaylistItem,
      locationNotes,
      addLocationNote,
      updateLocationNote,
      deleteLocationNote,
      polls,
      addPoll,
      votePoll,
      deletePoll,
      executeMotiAction,
      changeLog,
      undoLastChange,
      clearChangeLog,
      buildMotiContext,
    ],
  )

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>
}
