import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, CalendarRange, FolderClosed, Map,
  Camera, PenLine, CreditCard, Music, Briefcase,
  MapPin, AlertTriangle, Mail,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import type { Task } from '@/lib/types'
import { FAMILY_MEMBERS } from '@/constants'
import { TRIP_START_DATE, TRIP_END_DATE } from '@/lib/constants'
import WeatherWidget from '@/components/shared/WeatherWidget'
import type { LucideIcon } from 'lucide-react'

const TRIP_DATE = new Date(`${TRIP_START_DATE}T00:00:00`)
const TRIP_END = new Date(`${TRIP_END_DATE}T00:00:00`)

/* ── Rotating Hero Scenes ── */
const HERO_SCENES = [
  {
    id: 'desert',
    emoji: '🚐',
    secondaryEmoji: '🌵',
    text: 'בדרך להרפתקה!',
    gradient: 'linear-gradient(135deg, #FF512F 0%, #DD2476 50%, #F09819 100%)',
  },
  {
    id: 'mountain',
    emoji: '⛰️',
    secondaryEmoji: '🌲',
    text: 'יוסמיטי מחכה לנו!',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #2193b0 100%)',
  },
  {
    id: 'city',
    emoji: '🌃',
    secondaryEmoji: '🎰',
    text: 'וגאס בייבי!',
    gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 50%, #E040FB 100%)',
  },
  {
    id: 'beach',
    emoji: '🌊',
    secondaryEmoji: '🌴',
    text: 'חוף מערבי, פה אנחנו באים!',
    gradient: 'linear-gradient(135deg, #0ED2F7 0%, #00B4DB 50%, #009688 100%)',
  },
  {
    id: 'canyon',
    emoji: '🏜️',
    secondaryEmoji: '🌄',
    text: 'גרנד קניון, wow!',
    gradient: 'linear-gradient(135deg, #F37335 0%, #FDC830 50%, #D32F2F 100%)',
  },
]

const MODULE_CARDS: {
  path: string
  icon: LucideIcon
  label: string
  color: string
  countKey?: 'tasks' | 'photos' | 'packing' | 'expenses'
}[] = [
  { path: '/tasks', icon: CheckCircle2, label: 'משימות', color: '#007AFF', countKey: 'tasks' },
  { path: '/itinerary', icon: CalendarRange, label: 'לוח זמנים', color: '#FF9500' },
  { path: '/documents', icon: FolderClosed, label: 'מסמכים', color: '#FF3B30' },
  { path: '/map', icon: Map, label: 'מפה', color: '#5856D6' },
  { path: '/photos', icon: Camera, label: 'תמונות', color: '#FF2D55', countKey: 'photos' },
  { path: '/blog', icon: PenLine, label: 'בלוג', color: '#34C759' },
  { path: '/budget', icon: CreditCard, label: 'תקציב', color: '#FF9500', countKey: 'expenses' },
  { path: '/entertainment', icon: Music, label: 'בידור', color: '#AF52DE' },
  { path: '/packing', icon: Briefcase, label: 'אריזה', color: '#5AC8FA', countKey: 'packing' },
]

function getDaysUntilTrip(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = TRIP_DATE.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getTripDayIndex(): number | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(TRIP_DATE)
  const end = new Date(TRIP_END)
  if (today < start || today > end) return null
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function formatHebrewDate(): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export default function DashboardPage() {
  const { currentMember } = useAuth()
  const { itineraryDays, tasks, expenses, packingItems, budgetSettings, photos } = useAppData()
  const daysLeft = useMemo(() => getDaysUntilTrip(), [])
  const tripDayIndex = useMemo(() => getTripDayIndex(), [])
  const todayDate = useMemo(() => formatHebrewDate(), [])

  const memberData = currentMember ? FAMILY_MEMBERS[currentMember] : null

  // --- Hero rotation ---
  const [activeScene, setActiveScene] = useState(0)

  const advanceScene = useCallback(() => {
    setActiveScene((prev) => (prev + 1) % HERO_SCENES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(advanceScene, 8000)
    return () => clearInterval(timer)
  }, [advanceScene])

  // --- Stats ---
  const tasksDone = tasks.filter((t) => t.status === 'done').length
  const tasksTotal = tasks.length
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const budgetPercent = budgetSettings.total_budget > 0
    ? Math.round((totalSpent / budgetSettings.total_budget) * 100)
    : 0
  const packedCount = packingItems.filter((p) => p.is_packed).length
  const packingTotal = packingItems.length
  const packingPercent = packingTotal > 0 ? Math.round((packedCount / packingTotal) * 100) : 0

  // --- Next destination ---
  const nextDay = tripDayIndex !== null
    ? itineraryDays[tripDayIndex] || itineraryDays[0]
    : itineraryDays[0]

  // --- Counts for module badges ---
  const badgeCounts: Record<string, number> = {
    tasks: tasks.filter((t) => t.status !== 'done').length,
    photos: photos.length,
    packing: packingItems.filter((p) => !p.is_packed).length,
    expenses: expenses.length,
  }

  // --- Attention items ---
  const attentionItems = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const items: { task: Task; reason: string; color: string }[] = []

    for (const t of tasks) {
      if (t.status === 'done') continue

      // Overdue
      if (t.due_date && t.due_date < todayStr) {
        items.push({ task: t, reason: 'באיחור', color: '#FF3B30' })
        continue
      }
      // Due today
      if (t.due_date && t.due_date === todayStr) {
        items.push({ task: t, reason: 'היום', color: '#FF9500' })
        continue
      }
      // Urgent/high priority
      if (t.priority === 'urgent' || t.priority === 'high') {
        items.push({ task: t, reason: t.priority === 'urgent' ? 'דחוף' : 'עדיפות גבוהה', color: t.priority === 'urgent' ? '#FF3B30' : '#FF9500' })
      }
    }

    // Sort: overdue first, then due today, then by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    items.sort((a, b) => {
      if (a.reason === 'באיחור' && b.reason !== 'באיחור') return -1
      if (b.reason === 'באיחור' && a.reason !== 'באיחור') return 1
      if (a.reason === 'היום' && b.reason !== 'היום') return -1
      if (b.reason === 'היום' && a.reason !== 'היום') return 1
      return priorityOrder[a.task.priority] - priorityOrder[b.task.priority]
    })

    return items.slice(0, 5)
  }, [tasks])

  // --- Email reminder ---
  const [reminderEmail, setReminderEmail] = useState(() => {
    try { return localStorage.getItem('hey-usa-reminder-email') || '' } catch { return '' }
  })
  const [showReminderPanel, setShowReminderPanel] = useState(false)

  const saveReminderEmail = useCallback((email: string) => {
    setReminderEmail(email)
    try { localStorage.setItem('hey-usa-reminder-email', email) } catch { /* noop */ }
  }, [])

  const buildReminderMailto = useCallback(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + 7)
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

    const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < todayStr)
    const dueThisWeek = tasks.filter(
      (t) => t.status !== 'done' && t.due_date && t.due_date >= todayStr && t.due_date <= endOfWeekStr,
    )
    const openTasks = tasks.filter((t) => t.status !== 'done').length

    const lines: string[] = []
    lines.push('Hey USA - סיכום משימות')
    lines.push('========================')
    lines.push('')
    lines.push(`${daysLeft} ימים לטיול!`)
    lines.push(`משימות פתוחות: ${openTasks} מתוך ${tasks.length}`)
    lines.push(`אריזה: ${packingPercent}% הושלם`)
    lines.push('')

    if (overdue.length > 0) {
      lines.push(`--- באיחור (${overdue.length}) ---`)
      overdue.forEach((t) => lines.push(`  - ${t.title} (${t.due_date})`))
      lines.push('')
    }

    if (dueThisWeek.length > 0) {
      lines.push(`--- השבוע (${dueThisWeek.length}) ---`)
      dueThisWeek.forEach((t) => lines.push(`  - ${t.title} (${t.due_date})`))
      lines.push('')
    }

    lines.push('---')
    lines.push('נשלח מאפליקציית Hey USA')

    const subject = encodeURIComponent(`Hey USA - ${daysLeft} ימים לטיול! (${openTasks} משימות פתוחות)`)
    const body = encodeURIComponent(lines.join('\n'))
    const to = encodeURIComponent(reminderEmail)

    return `mailto:${to}?subject=${subject}&body=${body}`
  }, [tasks, daysLeft, packingPercent, reminderEmail])

  const scene = HERO_SCENES[activeScene]

  return (
    <div className="relative min-h-screen">
      {/* Background image — Yosemite Valley */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1920&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      />
      {/* Light overlay for readability */}
      <div className="fixed inset-0 z-0" style={{ backgroundColor: 'rgba(245, 245, 247, 0.82)' }} />

    <div className="relative z-10 mx-auto max-w-lg px-5 pt-8 pb-28">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-6"
      >
        <p className="text-[13px] text-apple-secondary tracking-wide">{todayDate}</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-apple-primary leading-tight">
          {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
        </h1>
      </motion.div>

      {/* ── Rotating Hero Card (replaces countdown) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-4 rounded-[20px] overflow-hidden relative"
        style={{ minHeight: 200 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="relative rounded-[20px] overflow-hidden"
            style={{ background: scene.gradient }}
          >
            {/* Ambient glow */}
            <div
              className="absolute top-0 right-0 w-56 h-56 opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 80% 20%, white, transparent 60%)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-40 h-40 opacity-15 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 20% 80%, white, transparent 60%)',
              }}
            />

            <div className="relative px-6 py-6">
              <div className="flex items-start justify-between">
                {/* Countdown info */}
                <div>
                  <div className="flex items-baseline gap-3">
                    <motion.span
                      key={`${scene.id}-days`}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="text-[52px] font-bold text-white leading-none tracking-tighter"
                      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
                    >
                      {daysLeft}
                    </motion.span>
                    <span className="text-[17px] font-medium text-white/80">ימים</span>
                  </div>
                  <p className="mt-2 text-[14px] text-white/90 font-semibold">
                    {scene.text}
                  </p>
                  <p className="mt-1 text-[12px] text-white/60 font-medium">
                    20 ימים | 5 מדינות | 1 קרוואן
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    11 בספטמבר 2026 — ארה״ב
                  </p>
                </div>

                {/* Emoji scene */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex flex-col items-center gap-1 mt-1"
                >
                  <span className="text-[48px] leading-none" role="img" aria-label="scene">
                    {scene.emoji}
                  </span>
                  <span className="text-[28px] leading-none" role="img" aria-label="accent">
                    {scene.secondaryEmoji}
                  </span>
                </motion.div>
              </div>

              {/* Next destination teaser */}
              {nextDay && (
                <div className="mt-3 flex items-center gap-2 text-white/70">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
                  <span className="text-[12px] font-medium truncate">
                    {tripDayIndex !== null ? 'היום:' : 'תחנה ראשונה:'}{' '}
                    <span className="text-white/90">{nextDay.city || nextDay.title}</span>
                  </span>
                </div>
              )}

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {HERO_SCENES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScene(i)}
                    className="transition-all duration-300"
                    style={{
                      width: i === activeScene ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === activeScene ? 'white' : 'rgba(255,255,255,0.4)',
                    }}
                    aria-label={`Scene ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-6 flex gap-2"
      >
        <div className="flex-1 rounded-[12px] bg-white px-3 py-2.5 text-center"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}>
          <p className="text-[11px] text-apple-secondary font-medium">משימות</p>
          <p className="text-[15px] font-bold" style={{ color: '#34C759' }}>
            {tasksDone}/{tasksTotal}
          </p>
        </div>
        <div className="flex-1 rounded-[12px] bg-white px-3 py-2.5 text-center"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}>
          <p className="text-[11px] text-apple-secondary font-medium">תקציב</p>
          <p className="text-[15px] font-bold" style={{ color: budgetPercent > 80 ? '#FF3B30' : '#007AFF' }}>
            {budgetPercent}%
          </p>
        </div>
        <div className="flex-1 rounded-[12px] bg-white px-3 py-2.5 text-center"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}>
          <p className="text-[11px] text-apple-secondary font-medium">אריזה</p>
          <p className="text-[15px] font-bold" style={{ color: '#5AC8FA' }}>
            {packingPercent}%
          </p>
        </div>
      </motion.div>

      {/* Attention / Highlights */}
      {attentionItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-6"
        >
          <div
            className="rounded-[16px] overflow-hidden"
            style={{
              boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
              background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%)',
              borderRight: '4px solid #FF9500',
            }}
          >
            <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-[8px]"
                style={{ backgroundColor: '#FF950015' }}
              >
                <AlertTriangle className="h-4 w-4" style={{ color: '#FF9500' }} strokeWidth={2.2} />
              </div>
              <h3 className="text-[14px] font-bold text-apple-primary">דורש תשומת לב</h3>
              <span className="mr-auto text-[11px] font-semibold rounded-full px-2 py-0.5"
                style={{ backgroundColor: '#FF950018', color: '#FF9500' }}>
                {attentionItems.length}
              </span>
            </div>
            <div className="px-4 pb-3 pt-1">
              {attentionItems.map((item, i) => (
                <Link to="/tasks" key={item.task.id}>
                  <div
                    className={`flex items-center gap-2.5 py-2 ${i < attentionItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <span
                      className="flex-shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.reason}
                    </span>
                    <span className="text-[13px] text-apple-primary truncate flex-1">{item.task.title}</span>
                    {item.task.due_date && (
                      <span className="text-[11px] text-apple-tertiary flex-shrink-0 font-medium tabular-nums">
                        {new Date(item.task.due_date + 'T00:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Next Stop Preview */}
      {nextDay && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-6"
        >
          <Link to="/itinerary">
            <div
              className="rounded-[16px] bg-white p-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px]"
                    style={{ backgroundColor: '#FF950010' }}>
                    <MapPin className="h-4 w-4" style={{ color: '#FF9500' }} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-apple-primary">
                      {nextDay.city || nextDay.title}
                    </p>
                    <p className="text-[11px] text-apple-secondary">
                      {tripDayIndex !== null ? `יום ${tripDayIndex + 1}` : `יום 1`} — {nextDay.title}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-apple-tertiary font-medium">
                  {nextDay.stops.length} עצירות
                </span>
              </div>

              {/* First 2 stops */}
              {nextDay.stops.slice(0, 2).map((stop, i) => (
                <div key={stop.id || i} className="flex items-center gap-2 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-ios-orange flex-shrink-0" />
                  <span className="text-[13px] text-apple-secondary truncate">{stop.title}</span>
                  {stop.start_time && (
                    <span className="text-[11px] text-apple-tertiary mr-auto">{stop.start_time}</span>
                  )}
                </div>
              ))}
              {nextDay.stops.length > 2 && (
                <p className="text-[11px] text-apple-tertiary mt-1">
                  +{nextDay.stops.length - 2} עצירות נוספות
                </p>
              )}
            </div>
          </Link>
        </motion.div>
      )}

      {/* Weather */}
      <div className="mb-6">
        <WeatherWidget mode="dashboard" />
      </div>

      {/* ── Reminders Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-6"
      >
        <div
          className="rounded-[16px] bg-white overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={() => setShowReminderPanel((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-right"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] flex-shrink-0"
              style={{ backgroundColor: '#5856D610' }}
            >
              <Mail className="h-[18px] w-[18px]" style={{ color: '#5856D6' }} strokeWidth={1.8} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[14px] font-semibold text-apple-primary">תזכורות</p>
              <p className="text-[11px] text-apple-secondary">שלח סיכום משימות במייל</p>
            </div>
            <motion.span
              animate={{ rotate: showReminderPanel ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-apple-tertiary text-[14px]"
            >
              &#9662;
            </motion.span>
          </button>

          <AnimatePresence>
            {showReminderPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                  <label className="block text-[12px] text-apple-secondary font-medium mb-1.5 mt-2">
                    כתובת אימייל לתזכורת
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={reminderEmail}
                    onChange={(e) => saveReminderEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-apple-primary placeholder:text-apple-tertiary focus:border-[#5856D6] focus:ring-1 focus:ring-[#5856D6] outline-none transition-colors"
                  />
                  <a
                    href={buildReminderMailto()}
                    className="mt-3 flex items-center justify-center gap-2 w-full rounded-[10px] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                    style={{ background: 'linear-gradient(135deg, #5856D6, #AF52DE)' }}
                  >
                    <Mail className="h-4 w-4" strokeWidth={2} />
                    <span>שלח תזכורת</span>
                  </a>
                  <p className="text-[11px] text-apple-tertiary mt-2 text-center">
                    ייפתח אפליקציית המייל עם סיכום המשימות
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Module grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
        }}
        className="grid grid-cols-3 gap-3"
      >
        {MODULE_CARDS.map(({ path, icon: Icon, label, color, countKey }) => (
          <motion.div
            key={path}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
              },
            }}
          >
            <Link to={path}>
              <motion.div
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="relative flex flex-col items-center gap-3 rounded-[16px] bg-white py-5 px-2"
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)',
                }}
              >
                {/* Count badge */}
                {countKey && badgeCounts[countKey] > 0 && (
                  <span
                    className="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                    style={{ backgroundColor: color }}
                  >
                    {badgeCounts[countKey]}
                  </span>
                )}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[12px]"
                  style={{
                    backgroundColor: `${color}10`,
                  }}
                >
                  <Icon
                    className="h-[22px] w-[22px]"
                    style={{ color }}
                    strokeWidth={1.8}
                  />
                </div>
                <span className="text-[13px] font-medium text-apple-primary">{label}</span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Floating chat button — Moti character */}
      <Link to="/chat">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
          transition={{
            opacity: { delay: 0.6 },
            scale: { delay: 0.6, type: 'spring', stiffness: 300, damping: 20 },
            y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-20 left-5 z-20 flex h-14 w-14 items-center justify-center rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #4A90D9, #7B68EE)',
            boxShadow: '0 4px 20px rgba(90, 100, 220, 0.35)',
          }}
        >
          <svg viewBox="0 0 64 64" width={36} height={36} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <ellipse cx="32" cy="50" rx="10" ry="8" fill="#FFD93D" />
            {/* Neck */}
            <rect x="30" y="40" width="4" height="5" rx="2" fill="#FFD93D" />
            {/* Head - simple round face */}
            <circle cx="32" cy="28" r="16" fill="#FFE066" />
            {/* Eyes */}
            <circle cx="26" cy="26" r="2.5" fill="#1d1d1f" />
            <circle cx="38" cy="26" r="2.5" fill="#1d1d1f" />
            <circle cx="27" cy="25" r="0.8" fill="white" />
            <circle cx="39" cy="25" r="0.8" fill="white" />
            {/* Smile */}
            <path d="M25 33 Q32 39 39 33" stroke="#1d1d1f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Cheeks */}
            <circle cx="21" cy="31" r="2.5" fill="#FFB5B5" opacity="0.5" />
            <circle cx="43" cy="31" r="2.5" fill="#FFB5B5" opacity="0.5" />
            {/* Arms */}
            <circle cx="46" cy="44" r="3.5" fill="#FFD93D" />
            <circle cx="18" cy="46" r="3.5" fill="#FFD93D" />
          </svg>
        </motion.div>
      </Link>
    </div>
    </div>
  )
}
