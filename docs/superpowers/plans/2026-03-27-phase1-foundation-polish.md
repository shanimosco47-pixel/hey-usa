# Phase 1: Foundation Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every screen in Hey USA feel crafted — consistent design, proper states, smooth transitions, offline-first data, and fast performance.

**Architecture:** Additive changes only. We create shared components (EmptyState, Toast, page skeletons), wire them into existing modules, upgrade the data layer from localStorage to Dexie with Supabase sync, and add page transitions to AppShell. No module rewrites — each task enhances what exists.

**Tech Stack:** React 19, Framer Motion, Dexie (IndexedDB), Tailwind 3, Supabase, existing motion.tsx wrappers

**Spec:** `docs/superpowers/specs/2026-03-27-premium-overhaul-design.md` — Phase 1

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/components/shared/EmptyState.tsx` | Reusable empty state with icon, title, description, CTA |
| `src/components/shared/Toast.tsx` | Toast notification system for optimistic UI feedback |
| `src/components/shared/ToastContext.tsx` | React context for toast management |
| `src/components/shared/PageSkeleton.tsx` | Pre-built skeleton layouts for common page patterns |
| `src/lib/db.ts` | Dexie database schema and instance |
| `src/lib/sync.ts` | Dexie <-> Supabase sync engine |
| `src/hooks/useOnlineStatus.ts` | Extracted from OfflineBanner for reuse |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/layout/AppShell.tsx` | Upgrade fade to spring transition, add AnimatePresence |
| `src/components/shared/OfflineBanner.tsx` | Extract useOnlineStatus hook |
| `src/contexts/AppDataContext.tsx` | Replace localStorage with Dexie reads/writes |
| `src/modules/tasks/TasksPage.tsx` | Add loading skeleton, empty state, stagger animations |
| `src/modules/budget/BudgetPage.tsx` | Add loading skeleton, empty state |
| `src/modules/itinerary/ItineraryPage.tsx` | Add empty state for empty days |
| `src/modules/documents/DocumentsPage.tsx` | Add loading skeleton, empty state |
| `src/modules/photos/PhotosPage.tsx` | Add empty state |
| `src/modules/packing/PackingPage.tsx` | Add empty state, stagger animations |
| `src/modules/blog/BlogPage.tsx` | Add empty state |
| `src/modules/entertainment/EntertainmentPage.tsx` | Add empty state per tab |
| `src/modules/notes/NotesPage.tsx` | Add empty state |
| `src/modules/campsites/CampsitesPage.tsx` | Add empty state |
| `src/modules/chat/ChatPage.tsx` | Add empty state for no messages |
| `src/modules/locations/LocationsPage.tsx` | Add empty state |

---

## Task 1: EmptyState Component

**Files:**
- Create: `src/components/shared/EmptyState.tsx`
- Test: manual visual verification

- [ ] **Step 1: Create EmptyState component**

```tsx
// src/components/shared/EmptyState.tsx
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] mb-4">
        <Icon className="h-8 w-8 text-apple-secondary" />
      </div>
      <h3 className="text-headline text-apple-primary mb-1">{title}</h3>
      {description && (
        <p className="text-subhead text-apple-secondary max-w-[280px]">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev`
Import EmptyState in any page temporarily, confirm it looks correct in RTL.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/EmptyState.tsx
git commit -m "feat: add EmptyState shared component"
```

---

## Task 2: Toast Notification System

**Files:**
- Create: `src/components/shared/ToastContext.tsx`
- Create: `src/components/shared/Toast.tsx`
- Modify: `src/App.tsx` (wrap with ToastProvider)

- [ ] **Step 1: Create Toast context and component**

```tsx
// src/components/shared/ToastContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}
```

```tsx
// src/components/shared/Toast.tsx
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToast } from './ToastContext'
import { cn } from '@/lib/cn'

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const

const colors = {
  success: 'text-ios-green',
  error: 'text-ios-red',
  info: 'text-ios-blue',
} as const

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col items-center gap-2 pointer-events-none md:bottom-8">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="glass-float rounded-apple px-4 py-3 flex items-center gap-3 shadow-glass-float pointer-events-auto max-w-sm w-full"
            >
              <Icon className={cn('h-5 w-5 shrink-0', colors[toast.type])} />
              <span className="text-body text-apple-primary flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-full hover:bg-black/[0.04]"
              >
                <X className="h-4 w-4 text-apple-secondary" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Wire ToastProvider into App.tsx**

In `src/App.tsx`, add the import and wrap:

```tsx
// Add imports at top:
import { ToastProvider } from '@/components/shared/ToastContext'
import { ToastContainer } from '@/components/shared/Toast'

// In the App function, wrap AppDataProvider:
export default function App() {
  return (
    <BrowserRouter basename="/hey-usa">
      <AuthProvider>
        <ToastProvider>
          <AppDataProvider>
            <AppInner />
          </AppDataProvider>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Test toast manually**

Run `npm run dev`. In any component, call `useToast().addToast('Test message')` and verify it shows and auto-dismisses.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/ToastContext.tsx src/components/shared/Toast.tsx src/App.tsx
git commit -m "feat: add toast notification system"
```

---

## Task 3: Upgrade Page Transitions in AppShell

**Files:**
- Modify: `src/components/layout/AppShell.tsx:38-45`

Currently AppShell has a basic opacity fade. Upgrade to a spring-based transition with AnimatePresence for proper exit animations.

- [ ] **Step 1: Update AppShell transition**

Replace the current `motion.div` block (lines 38-45) in `src/components/layout/AppShell.tsx`:

Old:
```tsx
<motion.div
  key={location.pathname}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  <Outlet />
</motion.div>
```

New:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

Also add `AnimatePresence` to the import on line 3:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
```

- [ ] **Step 2: Test transitions**

Run `npm run dev`. Navigate between pages — confirm smooth spring enter, no layout flash, exit fades out.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: upgrade page transitions to spring animation"
```

---

## Task 4: Page Skeleton Layouts

**Files:**
- Create: `src/components/shared/PageSkeleton.tsx`

Pre-built skeleton layouts for the most common page patterns, using the existing `Skeleton` component.

- [ ] **Step 1: Create PageSkeleton component**

```tsx
// src/components/shared/PageSkeleton.tsx
import { Skeleton } from '@/components/shared/Skeleton'
import { cn } from '@/lib/cn'

interface PageSkeletonProps {
  variant: 'list' | 'grid' | 'detail' | 'tabs'
  className?: string
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-apple-lg p-4 flex items-center gap-3">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-apple-lg p-4 flex flex-col gap-3">
          <Skeleton variant="rect" height={100} />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton variant="text" width="40%" height={28} />
      <Skeleton variant="rect" height={200} />
      <Skeleton variant="text" lines={3} />
    </div>
  )
}

function TabsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rect" width={80} height={36} className="rounded-apple" />
        ))}
      </div>
      <ListSkeleton />
    </div>
  )
}

const variants = {
  list: ListSkeleton,
  grid: GridSkeleton,
  detail: DetailSkeleton,
  tabs: TabsSkeleton,
} as const

export function PageSkeleton({ variant, className }: PageSkeletonProps) {
  const Component = variants[variant]
  return (
    <div className={cn('p-4', className)}>
      <Component />
    </div>
  )
}
```

- [ ] **Step 2: Verify skeletons render**

Run: `npm run dev`
Temporarily render `<PageSkeleton variant="list" />` in any page. Confirm shimmer animation works and layout looks natural.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/PageSkeleton.tsx
git commit -m "feat: add PageSkeleton layouts for loading states"
```

---

## Task 5: Add Empty States to All Modules

**Files:**
- Modify: 12 module pages (see list below)

Add EmptyState to every module that can have zero items. Each module gets the same pattern: check if items array is empty, render EmptyState with a relevant icon and Hebrew message.

- [ ] **Step 1: Tasks empty state**

In `src/modules/tasks/TasksPage.tsx`, find where the task list/kanban renders. Add before the list:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { ClipboardList } from 'lucide-react'

// Inside the component, where tasks are rendered:
{filteredTasks.length === 0 && (
  <EmptyState
    icon={ClipboardList}
    title="אין משימות"
    description="הוסיפו משימה ראשונה לתכנון הטיול"
    action={{ label: 'הוסף משימה', onClick: () => setShowDialog(true) }}
  />
)}
```

- [ ] **Step 2: Budget empty state**

In `src/modules/budget/BudgetPage.tsx`, in the expenses tab:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { Receipt } from 'lucide-react'

{expenses.length === 0 && (
  <EmptyState
    icon={Receipt}
    title="אין הוצאות"
    description="הוסיפו הוצאה ראשונה למעקב התקציב"
    action={{ label: 'הוסף הוצאה', onClick: () => setShowAddExpense(true) }}
  />
)}
```

- [ ] **Step 3: Documents empty state**

In `src/modules/documents/DocumentsPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { FileText } from 'lucide-react'

{documents.length === 0 && (
  <EmptyState
    icon={FileText}
    title="אין מסמכים"
    description="העלו מסמכי נסיעה - דרכונים, ביטוח, הזמנות"
  />
)}
```

- [ ] **Step 4: Photos empty state**

In `src/modules/photos/PhotosPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { Camera } from 'lucide-react'

{photos.length === 0 && (
  <EmptyState
    icon={Camera}
    title="אין תמונות"
    description="הוסיפו תמונות מהטיול"
  />
)}
```

- [ ] **Step 5: Packing empty state**

In `src/modules/packing/PackingPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { Luggage } from 'lucide-react'

{packingItems.length === 0 && (
  <EmptyState
    icon={Luggage}
    title="רשימת האריזה ריקה"
    description="הוסיפו פריטים לאריזה"
  />
)}
```

- [ ] **Step 6: Blog empty state**

In `src/modules/blog/BlogPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { BookOpen } from 'lucide-react'

{blogPosts.length === 0 && (
  <EmptyState
    icon={BookOpen}
    title="אין פוסטים"
    description="כתבו את הפוסט הראשון ביומן הטיול"
  />
)}
```

- [ ] **Step 7: Notes empty state**

In `src/modules/notes/NotesPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { StickyNote } from 'lucide-react'

{notes.length === 0 && (
  <EmptyState
    icon={StickyNote}
    title="אין פתקים"
    description="הוסיפו פתק ראשון"
  />
)}
```

- [ ] **Step 8: Campsites empty state**

In `src/modules/campsites/CampsitesPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { Tent } from 'lucide-react'

{campsites.length === 0 && (
  <EmptyState
    icon={Tent}
    title="אין הזמנות קמפינג"
    description="הוסיפו הזמנת קמפינג ראשונה"
  />
)}
```

- [ ] **Step 9: Chat empty state**

In `src/modules/chat/ChatPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { MessageCircle } from 'lucide-react'

// When no messages yet:
{messages.length === 0 && (
  <EmptyState
    icon={MessageCircle}
    title="היי! אני מוטי"
    description="שאלו אותי כל דבר על הטיול"
  />
)}
```

- [ ] **Step 10: Locations empty state**

In `src/modules/locations/LocationsPage.tsx`:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { MapPin } from 'lucide-react'

{locations.length === 0 && (
  <EmptyState
    icon={MapPin}
    title="אין מיקומים"
    description="מיקומים יופיעו כאן מתוך המסלול"
  />
)}
```

- [ ] **Step 11: Entertainment empty states**

In `src/modules/entertainment/EntertainmentPage.tsx`, add per-tab empty states:

```tsx
import { EmptyState } from '@/components/shared/EmptyState'
import { Music, Gamepad2, HelpCircle } from 'lucide-react'

// Playlist tab:
{playlist.length === 0 && <EmptyState icon={Music} title="אין שירים" description="הוסיפו שירים לפלייליסט" />}

// Games tab (if applicable):
// Trivia tab (if applicable):
```

- [ ] **Step 12: Build check**

Run: `npm run build`
Expected: No TypeScript errors, no warnings.

- [ ] **Step 13: Commit**

```bash
git add src/modules/
git commit -m "feat: add empty states to all modules"
```

---

## Task 6: Add Stagger Animations to List/Grid Modules

**Files:**
- Modify: `src/modules/tasks/TasksPage.tsx`
- Modify: `src/modules/documents/DocumentsPage.tsx`
- Modify: `src/modules/photos/PhotosPage.tsx`
- Modify: `src/modules/packing/PackingPage.tsx`
- Modify: `src/modules/notes/NotesPage.tsx`
- Modify: `src/modules/locations/LocationsPage.tsx`

Wrap list containers with `StaggerContainer` and items with `StaggerItem` from `@/components/ui/motion`.

- [ ] **Step 1: Add stagger to modules that render lists/grids**

For each module that renders a list of cards, wrap the container:

```tsx
import { StaggerContainer, StaggerItem } from '@/components/ui/motion'

// Replace the list container (e.g., a div with flex/grid) with:
<StaggerContainer className="flex flex-col gap-3">
  {items.map((item) => (
    <StaggerItem key={item.id}>
      {/* existing card/row component */}
    </StaggerItem>
  ))}
</StaggerContainer>
```

Apply this pattern to:
- Tasks: table rows and kanban columns
- Documents: document grid/list
- Photos: photo grid
- Packing: category sections
- Notes: sticky notes grid
- Locations: location cards

**Important:** Only wrap the top-level list. Don't nest StaggerContainers inside each other.

- [ ] **Step 2: Test animations**

Run: `npm run dev`
Navigate to each modified page — items should stagger in with a subtle fade+slide.

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/modules/
git commit -m "feat: add stagger animations to list views"
```

---

## Task 7: Extract useOnlineStatus Hook

**Files:**
- Create: `src/hooks/useOnlineStatus.ts`
- Modify: `src/components/shared/OfflineBanner.tsx`

The online status hook is currently embedded in OfflineBanner. Extract it for reuse by the sync engine.

- [ ] **Step 1: Create the hook**

```tsx
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

- [ ] **Step 2: Update OfflineBanner to use extracted hook**

In `src/components/shared/OfflineBanner.tsx`, remove the inline `useOnlineStatus` function and import the shared one:

```tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
```

Delete the local `useOnlineStatus` function (approximately lines 4-16).

- [ ] **Step 3: Verify OfflineBanner still works**

Run: `npm run dev`
Open DevTools → Network → toggle Offline. OfflineBanner should still appear/dismiss.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useOnlineStatus.ts src/components/shared/OfflineBanner.tsx
git commit -m "refactor: extract useOnlineStatus hook for reuse"
```

---

## Task 8: Dexie Database Schema

**Files:**
- Create: `src/lib/db.ts`

Define the Dexie schema mirroring the existing Supabase tables and TypeScript types.

- [ ] **Step 1: Create Dexie database definition**

```tsx
// src/lib/db.ts
import Dexie, { type EntityTable } from 'dexie'
import type {
  Task,
  Expense,
  BudgetSettings,
  ItineraryDay,
  PackingItem,
  BlogPost,
  Photo,
  Document,
  PlaylistItem,
  LocationNote,
} from './types'

interface SyncMeta {
  id: string
  table: string
  recordId: string
  action: 'upsert' | 'delete'
  timestamp: string
  synced: 0 | 1
}

class HeyUSADatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  expenses!: EntityTable<Expense, 'id'>
  budgetSettings!: EntityTable<BudgetSettings & { id: string }, 'id'>
  itineraryDays!: EntityTable<ItineraryDay, 'id'>
  packingItems!: EntityTable<PackingItem, 'id'>
  blogPosts!: EntityTable<BlogPost, 'id'>
  photos!: EntityTable<Photo, 'id'>
  documents!: EntityTable<Document, 'id'>
  playlistItems!: EntityTable<PlaylistItem, 'id'>
  locationNotes!: EntityTable<LocationNote, 'id'>
  syncQueue!: EntityTable<SyncMeta, 'id'>

  constructor() {
    super('hey-usa')
    this.version(1).stores({
      tasks: 'id, status, priority, group, *assigned_to',
      expenses: 'id, category, date, paid_by',
      budgetSettings: 'id',
      itineraryDays: 'id, date',
      packingItems: 'id, category, member_id, packed',
      blogPosts: 'id, created_at',
      photos: 'id, day_id, member_id',
      documents: 'id, category',
      playlistItems: 'id',
      locationNotes: 'id, location_id',
      syncQueue: 'id, table, synced, timestamp',
    })
  }
}

export const localDb = new HeyUSADatabase()
```

- [ ] **Step 2: Verify Dexie initializes**

Run: `npm run dev`
In browser console: `indexedDB.databases().then(console.log)` — should list `hey-usa`.
Or import `localDb` in any component temporarily and call `localDb.tasks.count()`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add Dexie database schema for offline-first storage"
```

---

## Task 9: Sync Engine — Dexie to Supabase

**Files:**
- Create: `src/lib/sync.ts`

Bidirectional sync: write locally to Dexie first, queue changes, flush to Supabase when online. On load, pull from Supabase and merge into Dexie using last-write-wins.

- [ ] **Step 1: Create sync engine**

```tsx
// src/lib/sync.ts
import { localDb } from './db'
import { supabase } from './supabase'
import type { Task, Expense, PackingItem, BlogPost, Photo, Document, PlaylistItem, LocationNote } from './types'

// Map Dexie table names to Supabase table names
const TABLE_MAP: Record<string, string> = {
  tasks: 'tasks',
  expenses: 'expenses',
  budgetSettings: 'budget_settings',
  itineraryDays: 'itinerary_days',
  packingItems: 'packing_items',
  blogPosts: 'blog_posts',
  photos: 'photos',
  documents: 'documents',
  playlistItems: 'playlist_items',
  locationNotes: 'location_notes',
}

/**
 * Queue a mutation for sync. Called after every Dexie write.
 */
export async function queueSync(table: string, recordId: string, action: 'upsert' | 'delete') {
  await localDb.syncQueue.add({
    id: crypto.randomUUID(),
    table,
    recordId,
    action,
    timestamp: new Date().toISOString(),
    synced: 0,
  })
}

/**
 * Flush all pending sync items to Supabase.
 * Called when coming back online or periodically.
 */
export async function flushSyncQueue(): Promise<number> {
  if (!supabase) return 0

  const pending = await localDb.syncQueue.where('synced').equals(0).toArray()
  let synced = 0

  for (const item of pending) {
    const supabaseTable = TABLE_MAP[item.table]
    if (!supabaseTable) continue

    try {
      if (item.action === 'delete') {
        await supabase.from(supabaseTable).delete().eq('id', item.recordId)
      } else {
        const dexieTable = localDb.table(item.table)
        const record = await dexieTable.get(item.recordId)
        if (record) {
          await supabase.from(supabaseTable).upsert(record)
        }
      }
      await localDb.syncQueue.update(item.id, { synced: 1 })
      synced++
    } catch {
      // Will retry on next flush
      console.warn(`Sync failed for ${item.table}/${item.recordId}`)
    }
  }

  // Clean up synced items older than 1 hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
  await localDb.syncQueue.where('synced').equals(1).and((item) => item.timestamp < oneHourAgo).delete()

  return synced
}

/**
 * Pull all data from Supabase into Dexie (initial load / refresh).
 * Uses bulkPut for efficiency — last-write-wins by overwriting.
 */
export async function pullFromSupabase(): Promise<boolean> {
  if (!supabase) return false

  try {
    const [
      { data: tasks },
      { data: expenses },
      { data: budgetData },
      { data: packingItems },
      { data: blogPosts },
      { data: photos },
      { data: documents },
      { data: playlistItems },
      { data: locationNotes },
    ] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('budget_settings').select('*').eq('id', 'main').single(),
      supabase.from('packing_items').select('*'),
      supabase.from('blog_posts').select('*'),
      supabase.from('photos').select('*'),
      supabase.from('documents').select('*'),
      supabase.from('playlist_items').select('*'),
      supabase.from('location_notes').select('*'),
    ])

    await localDb.transaction('rw',
      [localDb.tasks, localDb.expenses, localDb.budgetSettings, localDb.packingItems,
       localDb.blogPosts, localDb.photos, localDb.documents, localDb.playlistItems, localDb.locationNotes],
      async () => {
        if (tasks?.length) await localDb.tasks.bulkPut(tasks as Task[])
        if (expenses?.length) await localDb.expenses.bulkPut(expenses as Expense[])
        if (budgetData) await localDb.budgetSettings.put({ ...budgetData, id: 'main' })
        if (packingItems?.length) await localDb.packingItems.bulkPut(packingItems as PackingItem[])
        if (blogPosts?.length) await localDb.blogPosts.bulkPut(blogPosts as BlogPost[])
        if (photos?.length) await localDb.photos.bulkPut(photos as Photo[])
        if (documents?.length) await localDb.documents.bulkPut(documents as Document[])
        if (playlistItems?.length) await localDb.playlistItems.bulkPut(playlistItems as PlaylistItem[])
        if (locationNotes?.length) await localDb.locationNotes.bulkPut(locationNotes as LocationNote[])
      }
    )

    return true
  } catch (err) {
    console.error('Pull from Supabase failed:', err)
    return false
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: No errors. The sync engine is standalone — it doesn't touch AppDataContext yet.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sync.ts
git commit -m "feat: add Dexie-Supabase sync engine with offline queue"
```

---

## Task 10: Wire Dexie into AppDataContext

**Files:**
- Modify: `src/contexts/AppDataContext.tsx`

Replace the current "load from Supabase or use sample data" pattern with: load from Dexie first (instant), then pull from Supabase in background, then update Dexie. Mutations write to Dexie first, queue sync.

- [ ] **Step 1: Update initialization flow**

In `src/contexts/AppDataContext.tsx`, modify the `useEffect` in `AppDataProvider` (around line 254):

Add imports at top:
```tsx
import { localDb } from '@/lib/db'
import { pullFromSupabase, flushSyncQueue, queueSync } from '@/lib/sync'
```

Replace the main loading useEffect with:
```tsx
useEffect(() => {
  let cancelled = false

  async function loadData() {
    // Step 1: Try Dexie first (instant, offline-ready)
    const localTasks = await localDb.tasks.toArray()

    if (localTasks.length > 0) {
      // We have local data — show it immediately
      if (!cancelled) {
        setTasks(await localDb.tasks.toArray())
        setExpenses(await localDb.expenses.toArray())
        const bs = await localDb.budgetSettings.get('main')
        if (bs) setBudgetSettings(bs)
        setPackingItems(await localDb.packingItems.toArray())
        setBlogPosts(await localDb.blogPosts.toArray())
        setPhotos(await localDb.photos.toArray())
        setDocuments(await localDb.documents.toArray())
        setPlaylist(await localDb.playlistItems.toArray())
        setLocationNotes(await localDb.locationNotes.toArray())
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
      setPlaylist(await localDb.playlistItems.toArray())
      setLocationNotes(await localDb.locationNotes.toArray())
    }

    // Step 3: If no local data and no Supabase, seed from sample data into Dexie
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
      // State already has sample data as defaults
    }

    if (!cancelled) setIsLoading(false)

    // Step 4: Flush any pending sync items
    await flushSyncQueue()
  }

  loadData()
  return () => { cancelled = true }
}, [])
```

- [ ] **Step 2: Update mutation functions to write through Dexie**

For each mutation (e.g., `addTask`, `updateTask`, `deleteTask`), add Dexie write + sync queue before the existing Supabase call. Example for tasks:

```tsx
const addTask = useCallback(async (task: Task) => {
  // Write to Dexie first (instant)
  await localDb.tasks.put(task)
  setTasks((prev) => [...prev, task])

  // Queue for Supabase sync
  await queueSync('tasks', task.id, 'upsert')

  // Try immediate sync if online
  if (supabase) {
    db.upsertTask(task).catch(() => {/* queued for later */})
  }
}, [])
```

Apply this pattern to all mutation functions in AppDataContext. The key change: Dexie write is synchronous-feeling (fast IndexedDB), state update is immediate, Supabase sync is best-effort.

- [ ] **Step 3: Add online listener to flush sync queue**

Add a listener in AppDataProvider that flushes when coming back online:

```tsx
useEffect(() => {
  const handleOnline = () => {
    flushSyncQueue().then((count) => {
      if (count > 0) console.log(`Synced ${count} pending changes`)
    })
  }
  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}, [])
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 5: Test offline flow**

Run: `npm run dev`
1. Load the app (data from Supabase → Dexie)
2. Toggle offline in DevTools
3. Add a task
4. Refresh the page — task should persist from Dexie
5. Toggle online — task should sync to Supabase

- [ ] **Step 6: Commit**

```bash
git add src/contexts/AppDataContext.tsx
git commit -m "feat: wire Dexie into AppDataContext for offline-first data"
```

---

## Task 11: Performance Audit & Optimization

**Files:**
- Modify: `vite.config.ts` (if manual chunks needed)

- [ ] **Step 1: Run bundle analysis**

```bash
cd "/c/Users/shani/OneDrive/Hey USA" && ANALYZE=true npm run build
```

Open the generated `stats.html`. Identify:
- Largest chunks (target: no chunk > 200KB gzipped)
- Libraries that should be code-split (maplibre-gl, recharts, tiptap)

- [ ] **Step 2: Verify lazy loading effectiveness**

Check the Vite build output. Each lazy-loaded module should produce its own chunk. If maplibre-gl or recharts are in the main bundle, add manual chunk splitting in `vite.config.ts`:

```tsx
build: {
  sourcemap: false,
  rollupOptions: {
    output: {
      manualChunks: {
        'maplibre': ['maplibre-gl', 'react-map-gl'],
        'recharts': ['recharts'],
        'tiptap': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-image'],
      },
    },
  },
},
```

Only add this if the analysis shows these libraries in the main chunk.

- [ ] **Step 3: Run Lighthouse**

Open the deployed app or `npm run preview`. Run Lighthouse in Chrome DevTools.
Target scores: Performance > 85, PWA > 90.

- [ ] **Step 4: Commit if changes made**

```bash
git add vite.config.ts
git commit -m "perf: optimize bundle splitting for heavy libraries"
```

---

## Task 12: Design System Audit & Fixes

**Files:**
- Modify: Various module files as issues are found

This task is investigative — audit each page against the design system tokens.

- [ ] **Step 1: Audit each module page**

Open each page in the browser and check:
- Are all colors from the token system? (no hardcoded hex values)
- Are font sizes using the typography scale? (text-hero, text-title, text-headline, text-body, text-subhead, text-caption)
- Are border-radius values from the token system? (rounded-apple-sm/apple/apple-lg/apple-xl)
- Are shadows from the token system? (shadow-glass, shadow-glass-hover, shadow-glass-float)
- Are touch targets at least 44px?
- Does RTL layout work correctly? (arrows, flow direction, margin/padding)

- [ ] **Step 2: Fix found issues**

For each issue, make a targeted fix in the relevant module file. Common fixes:
- Replace hardcoded colors → token equivalents
- Replace custom font sizes → typography scale classes
- Replace inline border-radius → rounded-apple-* classes
- Add `min-h-[44px] min-w-[44px]` to small interactive elements

- [ ] **Step 3: Build check**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: align all modules with design system tokens"
```

---

## Task 13: Final Build, Test & Deploy

**Files:** None new

- [ ] **Step 1: Full build**

```bash
cd "/c/Users/shani/OneDrive/Hey USA" && npm run build
```

Expected: Clean build with no errors or warnings.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Fix any broken tests.

- [ ] **Step 3: Preview locally**

```bash
npm run preview
```

Walk through every page:
- Dashboard, Tasks, Itinerary, Documents, Map, Photos, Blog, Budget, Entertainment, Packing, Notes, Locations, Campsites, Chat
- Verify: loading states, empty states, page transitions, animations, RTL, offline

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "chore: phase 1 foundation polish complete"
```

- [ ] **Step 5: Push to deploy**

```bash
git push origin master
```

Verify GitHub Actions build succeeds and the live site updates.
