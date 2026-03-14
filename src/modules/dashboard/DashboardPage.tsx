import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2, CalendarRange, FolderClosed, Map,
  Camera, PenLine, CreditCard, Music, Briefcase, Bot,
  MapPin,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import { FAMILY_MEMBERS } from '@/constants'
import { TRIP_START_DATE, TRIP_END_DATE } from '@/lib/constants'
import WeatherWidget from '@/components/shared/WeatherWidget'
import type { LucideIcon } from 'lucide-react'

const TRIP_DATE = new Date(`${TRIP_START_DATE}T00:00:00`)
const TRIP_END = new Date(`${TRIP_END_DATE}T00:00:00`)

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

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
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

      {/* Countdown — road trip dark card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-4 rounded-[20px] overflow-hidden relative"
        style={{
          background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        }}
      >
        <div className="relative px-6 py-6">
          {/* Gradient accents */}
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-15 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 70% 30%, #007AFF, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 opacity-10 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 30% 70%, #FF9500, transparent 70%)',
            }}
          />

          <div className="flex items-start justify-between relative">
            <div>
              <div className="flex items-baseline gap-3">
                <motion.span
                  key={daysLeft}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-[52px] font-bold text-white leading-none tracking-tighter"
                >
                  {daysLeft}
                </motion.span>
                <span className="text-[17px] font-medium text-white/70">ימים</span>
              </div>
              <p className="mt-2 text-[13px] text-white/50 font-medium">
                20 ימים | 5 מדינות | 1 קרוואן
              </p>
              <p className="mt-1 text-[12px] text-white/30">
                11 בספטמבר 2026 — ארה״ב
              </p>
            </div>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[40px] mt-1"
            >
              <span role="img" aria-label="RV">🚐</span>
            </motion.div>
          </div>

          {/* Next destination teaser */}
          {nextDay && (
            <div className="mt-4 flex items-center gap-2 text-white/60">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
              <span className="text-[12px] font-medium truncate">
                {tripDayIndex !== null ? 'היום:' : 'תחנה ראשונה:'}{' '}
                <span className="text-white/80">{nextDay.city || nextDay.title}</span>
              </span>
            </div>
          )}
        </div>
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

      {/* Floating chat button */}
      <Link to="/chat">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-20 left-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white"
          style={{
            background: 'linear-gradient(145deg, #1d1d1f, #3a3a3c)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <Bot className="h-6 w-6" strokeWidth={1.8} />
        </motion.div>
      </Link>
    </div>
  )
}
