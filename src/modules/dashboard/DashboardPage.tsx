import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  CalendarRange,
  FolderClosed,
  Map,
  Camera,
  PenLine,
  CreditCard,
  Music,
  Briefcase,
  MapPin,
  AlertTriangle,
  Mail,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import type { Task } from '@/lib/types'
import { FAMILY_MEMBERS, TRIP_START_DATE, TRIP_END_DATE, ROUTE_COLORS } from '@/constants'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import type { FamilyMemberId } from '@/lib/types'
import WeatherWidget from '@/components/shared/WeatherWidget'
import { MotiRobot } from '@/components/shared/MotiRobot'
import { getAvatarPhoto } from '@/lib/avatarStorage'
import type { LucideIcon } from 'lucide-react'

// Magic UI components
import { NumberTicker } from '@/components/ui/number-ticker'
import { BlurFade } from '@/components/ui/blur-fade'
import { Marquee } from '@/components/ui/marquee'
import { MagicCard } from '@/components/ui/magic-card'
import { ScrollProgress } from '@/components/ui/scroll-progress'

const TRIP_DATE = new Date(`${TRIP_START_DATE}T00:00:00`)
const TRIP_END = new Date(`${TRIP_END_DATE}T00:00:00`)

/* ── Destinations for Marquee ── */
const DESTINATIONS = [
  { name: 'Bozeman', emoji: '✈️', days: 'Sep 10-11', state: 'MT', gradient: 'linear-gradient(135deg, #38bdf8, #6366f1)' },
  { name: 'Yellowstone', emoji: '🌋', days: 'Sep 11-14', state: 'WY', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Grand Teton', emoji: '🏔️', days: 'Sep 14-16', state: 'WY', gradient: 'linear-gradient(135deg, #3b82f6, #1e3a5f)' },
  { name: 'Salt Lake City', emoji: '🏛️', days: 'Sep 16', state: 'UT', gradient: 'linear-gradient(135deg, #64748b, #3b82f6)' },
  { name: 'Bryce Canyon', emoji: '🪨', days: 'Sep 17-18', state: 'UT', gradient: 'linear-gradient(135deg, #ea580c, #dc2626)' },
  { name: 'Zion', emoji: '⛰️', days: 'Sep 18-20', state: 'UT', gradient: 'linear-gradient(135deg, #dc2626, #f97316)' },
  { name: 'Las Vegas', emoji: '🎰', days: 'Sep 20-21', state: 'NV', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  { name: 'Mammoth Lakes', emoji: '🎿', days: 'Sep 21-22', state: 'CA', gradient: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
  { name: 'Yosemite', emoji: '🌲', days: 'Sep 22-25', state: 'CA', gradient: 'linear-gradient(135deg, #16a34a, #0d9488)' },
  { name: 'San Francisco', emoji: '🌉', days: 'Sep 25-30', state: 'CA', gradient: 'linear-gradient(135deg, #f97316, #dc2626)' },
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
  { path: '/locations', icon: MapPin, label: 'יעדים', color: '#FF6B35' },
]

/* ── Passport Stamp decorative element ── */
function PassportStamp({ text, date, rotation = -12 }: { text: string; date: string; rotation?: number }) {
  return (
    <div
      className="inline-flex flex-col items-center justify-center shrink-0"
      style={{
        width: 72,
        height: 72,
        border: '2.5px solid #b45309',
        borderRadius: '50%',
        transform: `rotate(${rotation}deg)`,
        position: 'relative',
        color: '#b45309',
        opacity: 0.85,
      }}
    >
      <div className="absolute rounded-full" style={{ inset: 4, border: '1px dashed rgba(180, 83, 9, 0.4)' }} />
      <span className="font-serif text-[9px] font-semibold uppercase tracking-wider">{text}</span>
      <span className="font-serif text-[11px] font-bold">{date}</span>
    </div>
  )
}

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
  const budgetPercent =
    budgetSettings.total_budget > 0
      ? Math.round((totalSpent / budgetSettings.total_budget) * 100)
      : 0
  const packedCount = packingItems.filter((p) => p.is_packed).length
  const packingTotal = packingItems.length
  const packingPercent = packingTotal > 0 ? Math.round((packedCount / packingTotal) * 100) : 0

  // --- Next destination ---
  const nextDay =
    tripDayIndex !== null ? itineraryDays[tripDayIndex] || itineraryDays[0] : itineraryDays[0]

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
      if (t.due_date && t.due_date < todayStr) {
        items.push({ task: t, reason: 'באיחור', color: '#FF3B30' })
        continue
      }
      if (t.due_date && t.due_date === todayStr) {
        items.push({ task: t, reason: 'היום', color: '#FF9500' })
        continue
      }
      if (t.priority === 'urgent' || t.priority === 'high') {
        items.push({
          task: t,
          reason: t.priority === 'urgent' ? 'דחוף' : 'עדיפות גבוהה',
          color: t.priority === 'urgent' ? '#FF3B30' : '#FF9500',
        })
      }
    }

    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
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
    try {
      return localStorage.getItem('hey-usa-reminder-email') || ''
    } catch {
      return ''
    }
  })
  const [showReminderPanel, setShowReminderPanel] = useState(false)

  const saveReminderEmail = useCallback((email: string) => {
    setReminderEmail(email)
    try {
      localStorage.setItem('hey-usa-reminder-email', email)
    } catch {
      /* noop */
    }
  }, [])

  const buildReminderMailto = useCallback(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + 7)
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

    const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < todayStr)
    const dueThisWeek = tasks.filter(
      (t) =>
        t.status !== 'done' && t.due_date && t.due_date >= todayStr && t.due_date <= endOfWeekStr,
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

    const subject = encodeURIComponent(
      `Hey USA - ${daysLeft} ימים לטיול! (${openTasks} משימות פתוחות)`,
    )
    const body = encodeURIComponent(lines.join('\n'))
    const to = encodeURIComponent(reminderEmail)

    return `mailto:${to}?subject=${subject}&body=${body}`
  }, [tasks, daysLeft, packingPercent, reminderEmail])

  return (
    <div className="relative min-h-screen">
      {/* Scroll Progress Bar */}
      <ScrollProgress className="h-[3px]" />

      <div className="relative z-10 mx-auto max-w-lg px-5 pt-8 pb-28">
        {/* ── Hero Section — Passport Stamp Aesthetic ── */}
        <BlurFade delay={0} duration={0.5}>
          <div className="mb-6">
            {/* Top bar: passport stamp + title + family avatars */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <PassportStamp text="USA" date="SEP 26" rotation={-8} />
                <div>
                  <h1 className="font-serif text-[28px] font-semibold text-passport-slate leading-none tracking-tight">
                    <span dir="ltr">Hey USA</span>
                  </h1>
                  <p className="text-[13px] text-[#64748b] mt-1" dir="ltr">
                    Bozeman → San Francisco
                  </p>
                </div>
              </div>
              {/* Family avatars */}
              <div className="flex -space-x-1.5 rtl:space-x-reverse">
                {(['aba', 'ima', 'kid1', 'kid2'] as FamilyMemberId[]).map((id, i) => (
                  <div key={id} className="relative" style={{ zIndex: 4 - i }}>
                    <FamilyAvatar memberId={id} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Date & greeting */}
            <div className="mb-4">
              <p className="text-[13px] text-[#94a3b8] tracking-wide">{todayDate}</p>
              <p className="mt-0.5 text-[17px] font-semibold text-passport-slate">
                {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
              </p>
            </div>
          </div>
        </BlurFade>

        {/* ── Hero Stats — Dark Card with NumberTicker ── */}
        <BlurFade delay={0.1} duration={0.5}>
          <div className="mb-4">
            <MagicCard className="rounded-apple-xl">
              <div
                className="rounded-apple-xl py-6 px-5 text-white"
                style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
                dir="ltr"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-serif text-[36px] font-bold leading-none">
                      <NumberTicker value={daysLeft} delay={0.2} />
                    </div>
                    <div className="text-[12px] text-[#94a3b8] mt-1 font-medium" dir="rtl">ימים לטיסה</div>
                  </div>
                  <div className="border-x border-white/10">
                    <div className="font-serif text-[36px] font-bold leading-none">
                      <NumberTicker value={2400} delay={0.4} />
                    </div>
                    <div className="text-[12px] text-[#94a3b8] mt-1 font-medium" dir="rtl">מיילים</div>
                  </div>
                  <div>
                    <div className="font-serif text-[36px] font-bold leading-none">
                      <NumberTicker value={21} delay={0.6} />
                    </div>
                    <div className="text-[12px] text-[#94a3b8] mt-1 font-medium" dir="rtl">ימי טיול</div>
                  </div>
                </div>
              </div>
            </MagicCard>
          </div>
        </BlurFade>

        {/* ── Destination Marquee ── */}
        <BlurFade delay={0.2} duration={0.5}>
          <div className="mb-6 -mx-5">
            <Marquee className="[--duration:50s]" pauseOnHover>
              {DESTINATIONS.map((d) => (
                <div
                  key={d.name}
                  dir="ltr"
                  className="shrink-0 rounded-apple px-4 py-3 text-white min-w-[140px] flex flex-col gap-1"
                  style={{ background: d.gradient }}
                >
                  <span className="text-[20px]">{d.emoji}</span>
                  <span className="text-[14px] font-semibold">{d.name}</span>
                  <span className="text-[11px] opacity-85">{d.days} · {d.state}</span>
                </div>
              ))}
            </Marquee>
          </div>
        </BlurFade>

        {/* ── Quick Stats Row ── */}
        <BlurFade delay={0.25} duration={0.5}>
          <div className="mb-6 flex gap-2">
            <div
              className="flex-1 rounded-apple bg-white px-3 py-2.5 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <p className="text-[11px] text-[#94a3b8] font-medium">משימות</p>
              <p className="text-[15px] font-bold" style={{ color: '#34C759' }}>
                {tasksDone}/{tasksTotal}
              </p>
            </div>
            <div
              className="flex-1 rounded-apple bg-white px-3 py-2.5 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <p className="text-[11px] text-[#94a3b8] font-medium">תקציב</p>
              <p
                className="text-[15px] font-bold"
                style={{ color: budgetPercent > 80 ? '#FF3B30' : '#007AFF' }}
              >
                {budgetPercent}%
              </p>
            </div>
            <div
              className="flex-1 rounded-apple bg-white px-3 py-2.5 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <p className="text-[11px] text-[#94a3b8] font-medium">אריזה</p>
              <p className="text-[15px] font-bold" style={{ color: '#5AC8FA' }}>
                {packingPercent}%
              </p>
            </div>
          </div>
        </BlurFade>

        {/* ── Trip Route Progress ── */}
        {itineraryDays.length > 0 && (
          <BlurFade delay={0.3} duration={0.5}>
            <div className="mb-4">
              <div
                className="rounded-apple-lg bg-white px-4 py-3.5"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[14px] font-semibold text-passport-slate">🛣️ מסלול הטיול</span>
                  {tripDayIndex !== null && (
                    <span className="text-[11px] font-bold text-white bg-ios-green rounded-full px-2 py-0.5">
                      יום {tripDayIndex + 1} מתוך {itineraryDays.length}
                    </span>
                  )}
                  {tripDayIndex === null && daysLeft > 0 && (
                    <span className="text-[11px] font-medium text-[#94a3b8]">
                      עוד {daysLeft} ימים
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto -mx-1 px-1 pb-1">
                  <div className="flex items-center gap-0 min-w-max">
                    {(() => {
                      const allFuture = tripDayIndex === null
                      return itineraryDays.map((day, i) => {
                        const isCurrent = tripDayIndex === i
                        const isPast = tripDayIndex !== null && i < tripDayIndex
                        const cityShort =
                          day.city?.split('→')[0]?.trim()?.split(',')[0]?.trim()?.slice(0, 10) || ''
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
                          <div key={day.id} className="flex items-center">
                            <div className="flex flex-col items-center" style={{ width: 38 }}>
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
                                  <svg viewBox="0 0 10 10" width={6} height={6}>
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
                                {isCurrent && <span className="text-[8px]">📍</span>}
                              </div>
                              <span
                                className="text-[9px] mt-1 font-medium text-center leading-tight"
                                style={{
                                  color: dayNumColor,
                                  fontWeight: isCurrent ? 700 : allFuture ? 600 : 500,
                                }}
                              >
                                {i + 1}
                              </span>
                              {cityShort && (
                                <span
                                  className="text-[7px] text-center leading-tight truncate max-w-[38px]"
                                  style={{ color: cityColor, fontWeight: allFuture ? 500 : 400 }}
                                >
                                  {cityShort}
                                </span>
                              )}
                            </div>
                            {i < itineraryDays.length - 1 && (
                              <div
                                className="h-[2px] shrink-0"
                                style={{
                                  width: 8,
                                  backgroundColor: lineColor,
                                }}
                              />
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        )}

        {/* ── Attention / Highlights ── */}
        {attentionItems.length > 0 && (
          <BlurFade delay={0.35} duration={0.5}>
            <div className="mb-6">
              <div
                className="rounded-apple-lg overflow-hidden"
                style={{
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
                  background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%)',
                  borderInlineStart: '4px solid #FF9500',
                }}
              >
                <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-apple-sm"
                    style={{ backgroundColor: '#FF950015' }}
                  >
                    <AlertTriangle
                      className="h-4 w-4"
                      style={{ color: '#FF9500' }}
                      strokeWidth={2.2}
                    />
                  </div>
                  <h3 className="text-[14px] font-bold text-passport-slate">דורש תשומת לב</h3>
                  <span
                    className="ms-auto text-[11px] font-semibold rounded-full px-2 py-0.5"
                    style={{ backgroundColor: '#FF950018', color: '#FF9500' }}
                  >
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
                          className="shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.reason}
                        </span>
                        <span className="text-[13px] text-passport-slate truncate flex-1">
                          {item.task.title}
                        </span>
                        {item.task.due_date && (
                          <span className="text-[11px] text-[#94a3b8] shrink-0 font-medium tabular-nums">
                            {new Date(item.task.due_date + 'T00:00:00').toLocaleDateString('he-IL', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </BlurFade>
        )}

        {/* ── Next Stop Preview ── */}
        {nextDay && (
          <BlurFade delay={0.4} duration={0.5}>
            <div className="mb-6">
              <Link to="/itinerary">
                <div
                  className="rounded-apple-lg bg-white p-4"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-apple-sm"
                        style={{ backgroundColor: '#FF950010' }}
                      >
                        <MapPin className="h-4 w-4" style={{ color: '#FF9500' }} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-passport-slate">
                          {nextDay.city || nextDay.title}
                        </p>
                        <p className="text-[11px] text-[#94a3b8]">
                          {tripDayIndex !== null ? `יום ${tripDayIndex + 1}` : `יום 1`} —{' '}
                          {nextDay.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#94a3b8] font-medium">
                      {nextDay.stops.length} עצירות
                    </span>
                  </div>

                  {nextDay.stops.slice(0, 2).map((stop, i) => (
                    <div key={stop.id || i} className="flex items-center gap-2 py-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-ios-orange shrink-0" />
                      <span className="text-[13px] text-[#64748b] truncate">{stop.title}</span>
                      {stop.start_time && (
                        <span className="text-[11px] text-[#94a3b8] ms-auto">
                          {stop.start_time}
                        </span>
                      )}
                    </div>
                  ))}
                  {nextDay.stops.length > 2 && (
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      +{nextDay.stops.length - 2} עצירות נוספות
                    </p>
                  )}
                </div>
              </Link>
            </div>
          </BlurFade>
        )}

        {/* Weather */}
        <div className="mb-6">
          <WeatherWidget mode="dashboard" />
        </div>

        {/* ── Reminders Card ── */}
        <BlurFade delay={0.45} duration={0.5}>
          <div className="mb-6">
            <div
              className="rounded-apple-lg bg-white overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <button
                onClick={() => setShowReminderPanel((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-start"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] shrink-0"
                  style={{ backgroundColor: '#5856D610' }}
                >
                  <Mail
                    className="h-[18px] w-[18px]"
                    style={{ color: '#5856D6' }}
                    strokeWidth={1.8}
                  />
                </div>
                <div className="flex-1 text-start">
                  <p className="text-[14px] font-semibold text-passport-slate">תזכורות</p>
                  <p className="text-[11px] text-[#94a3b8]">שלח סיכום משימות במייל</p>
                </div>
                <motion.span
                  animate={{ rotate: showReminderPanel ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#94a3b8] text-[14px]"
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
                      <label className="block text-[12px] text-[#94a3b8] font-medium mb-1.5 mt-2">
                        כתובת אימייל לתזכורת
                      </label>
                      <input
                        type="email"
                        dir="ltr"
                        value={reminderEmail}
                        onChange={(e) => saveReminderEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-passport-slate placeholder:text-[#94a3b8] focus:border-[#5856D6] focus:ring-1 focus:ring-[#5856D6] outline-none transition-colors"
                      />
                      <a
                        href={buildReminderMailto()}
                        className="mt-3 flex items-center justify-center gap-2 w-full rounded-[10px] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                        style={{ background: 'linear-gradient(135deg, #5856D6, #AF52DE)' }}
                      >
                        <Mail className="h-4 w-4" strokeWidth={2} />
                        <span>שלח תזכורת</span>
                      </a>
                      <p className="text-[11px] text-[#94a3b8] mt-2 text-center">
                        ייפתח אפליקציית המייל עם סיכום המשימות
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </BlurFade>

        {/* ── Module Grid with MagicCard ── */}
        <BlurFade delay={0.5} duration={0.5}>
          <p className="text-caption uppercase tracking-wider text-[#94a3b8] mb-3">מודולים</p>
          <div className="grid grid-cols-3 gap-3">
            {MODULE_CARDS.map(({ path, icon: Icon, label, color, countKey }, i) => (
              <BlurFade key={path} delay={0.55 + i * 0.04} duration={0.4}>
                <Link to={path}>
                  <MagicCard className="rounded-apple-lg cursor-pointer">
                    <div className="relative flex flex-col items-center gap-3 py-5 px-2">
                      {countKey && badgeCounts[countKey] > 0 && (
                        <span
                          className="absolute -top-1.5 -start-1.5 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white px-1 z-50"
                          style={{ backgroundColor: color }}
                        >
                          {badgeCounts[countKey]}
                        </span>
                      )}
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-apple"
                        style={{ backgroundColor: `${color}10` }}
                      >
                        <Icon className="h-[22px] w-[22px]" style={{ color }} strokeWidth={1.8} />
                      </div>
                      <span className="text-[13px] font-medium text-passport-slate">{label}</span>
                    </div>
                  </MagicCard>
                </Link>
              </BlurFade>
            ))}
          </div>
        </BlurFade>

        {/* Floating chat button — Moti robot */}
        <Link to="/chat" aria-label="צ'אט עם מוטי">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              opacity: { delay: 0.6 },
              scale: { delay: 0.6, type: 'spring', stiffness: 300, damping: 20 },
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 start-5 z-20 flex h-28 w-28 items-center justify-center rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #E8FAF8, #B8F0EA)',
              boxShadow: '0 6px 28px rgba(38, 204, 194, 0.25), inset 0 1px 2px rgba(255,255,255,0.8)',
              border: '2px solid rgba(38,204,194,0.2)',
            }}
          >
            <motion.div
              animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {getAvatarPhoto('moti') ? (
                <img
                  src={getAvatarPhoto('moti')!}
                  alt="מוטי"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <MotiRobot size={72} animated={false} />
              )}
            </motion.div>
          </motion.div>
        </Link>
      </div>
    </div>
  )
}
