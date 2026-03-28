import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  CheckCircle2,
  CalendarRange,
  FolderClosed,
  MapPin,
  Camera,
  CreditCard,
  Briefcase,
  StickyNote,
  Tent,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppData } from '@/contexts/AppDataContext'
import { NAV_ITEMS } from '@/constants'
import type { LucideIcon } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  path: string
  icon: LucideIcon
  color: string
  type: string
}

const MODULE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  tasks: { icon: CheckCircle2, color: '#007AFF' },
  itinerary: { icon: CalendarRange, color: '#FF9500' },
  documents: { icon: FolderClosed, color: '#FF3B30' },
  locations: { icon: MapPin, color: '#FF9500' },
  photos: { icon: Camera, color: '#FF2D55' },
  budget: { icon: CreditCard, color: '#FF9500' },
  packing: { icon: Briefcase, color: '#5AC8FA' },
  notes: { icon: StickyNote, color: '#FFCC00' },
  campsites: { icon: Tent, color: '#34C759' },
}

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { tasks, itineraryDays, expenses, packingItems, photos } = useAppData()

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  // Build searchable results
  const allResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = []

    // Navigation items (always available)
    for (const item of NAV_ITEMS) {
      results.push({
        id: `nav-${item.path}`,
        title: item.label,
        subtitle: 'ניווט',
        path: item.path,
        icon: MODULE_ICONS[item.path.slice(1)]?.icon ?? MapPin,
        color: MODULE_ICONS[item.path.slice(1)]?.color ?? '#8E8E93',
        type: 'nav',
      })
    }

    // Tasks
    for (const task of tasks) {
      results.push({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: task.description || `משימה · ${task.status === 'done' ? 'בוצע' : 'פתוח'}`,
        path: '/tasks',
        icon: CheckCircle2,
        color: '#007AFF',
        type: 'task',
      })
    }

    // Itinerary days
    for (const day of itineraryDays) {
      results.push({
        id: `day-${day.id}`,
        title: day.title,
        subtitle: day.city ? `${day.city} · ${day.date}` : day.date,
        path: `/itinerary/${day.id.replace('day-', '')}`,
        icon: CalendarRange,
        color: '#FF9500',
        type: 'itinerary',
      })
      // Stops within days
      for (const stop of day.stops) {
        results.push({
          id: `stop-${stop.id}`,
          title: stop.title,
          subtitle: `${day.title} · ${stop.location || ''}`,
          path: `/itinerary/${day.id.replace('day-', '')}`,
          icon: MapPin,
          color: '#FF9500',
          type: 'stop',
        })
      }
    }

    // Packing items
    for (const item of packingItems) {
      results.push({
        id: `pack-${item.id}`,
        title: item.name,
        subtitle: `אריזה · ${item.is_packed ? 'ארוז' : 'לא ארוז'}`,
        path: '/packing',
        icon: Briefcase,
        color: '#5AC8FA',
        type: 'packing',
      })
    }

    return results
  }, [tasks, itineraryDays, expenses, packingItems, photos])

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show nav items when empty
      return allResults.filter((r) => r.type === 'nav')
    }
    const q = query.toLowerCase()
    return allResults
      .filter((r) => r.title.toLowerCase().includes(q) || r.subtitle?.toLowerCase().includes(q))
      .slice(0, 20)
  }, [query, allResults])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filtered])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].path)
        close()
      }
    },
    [close, filtered, selectedIndex, navigate],
  )

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.path)
      close()
    },
    [navigate, close],
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'fixed top-[15%] left-1/2 z-[61] w-[90vw] max-w-lg -translate-x-1/2',
              'rounded-apple-xl overflow-hidden',
              'bg-white dark:bg-[#1c1c1e] shadow-glass-float',
              'border border-black/[0.06] dark:border-white/[0.08]',
            )}
            dir="rtl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <Search className="h-5 w-5 text-apple-secondary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="חיפוש משימות, יעדים, פריטים..."
                className={cn(
                  'flex-1 bg-transparent text-[15px] outline-none',
                  'text-apple-primary dark:text-white',
                  'placeholder:text-apple-tertiary',
                )}
              />
              <div className="flex items-center gap-1.5">
                <kbd className="hidden sm:inline-flex h-5 items-center rounded bg-black/[0.06] dark:bg-white/[0.1] px-1.5 text-[10px] font-medium text-apple-secondary">
                  ESC
                </kbd>
                <button
                  onClick={close}
                  className="sm:hidden rounded-full p-0.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.1]"
                >
                  <X className="h-4 w-4 text-apple-secondary" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {filtered.length === 0 && query.trim() && (
                <div className="px-4 py-8 text-center">
                  <p className="text-[14px] text-apple-secondary">לא נמצאו תוצאות</p>
                  <p className="text-[12px] text-apple-tertiary mt-1">נסו לחפש עם מילים אחרות</p>
                </div>
              )}

              {filtered.map((result, i) => {
                const Icon = result.icon
                const isSelected = i === selectedIndex
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-right transition-colors',
                      isSelected
                        ? 'bg-ios-blue/10 dark:bg-ios-blue/20'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
                    )}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-apple-sm"
                      style={{ backgroundColor: `${result.color}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: result.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-apple-primary dark:text-white truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-[11px] text-apple-secondary truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-apple-tertiary shrink-0">↵</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3 text-[10px] text-apple-tertiary">
                <span>↑↓ ניווט</span>
                <span>↵ בחירה</span>
                <span>ESC סגירה</span>
              </div>
              <span className="text-[10px] text-apple-tertiary">{filtered.length} תוצאות</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
