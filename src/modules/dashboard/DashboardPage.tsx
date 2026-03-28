import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isChild } from '@/lib/familyRoles'
import { useAppData } from '@/contexts/AppDataContext'
import { KidsDashboard } from './components/KidsDashboard'
import { ParentDashboard } from './components/ParentDashboard'
import { TripRouteProgress } from './components/TripRouteProgress'
import type { Task } from '@/lib/types'
import { FAMILY_MEMBERS, TRIP_START_DATE, TRIP_END_DATE } from '@/constants'
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
  {
    name: 'Bozeman',
    emoji: '✈️',
    days: 'Sep 10-11',
    state: 'MT',
    gradient: 'linear-gradient(135deg, #38bdf8, #6366f1)',
  },
  {
    name: 'Yellowstone',
    emoji: '🌋',
    days: 'Sep 11-14',
    state: 'WY',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
  {
    name: 'Grand Teton',
    emoji: '🏔️',
    days: 'Sep 14-16',
    state: 'WY',
    gradient: 'linear-gradient(135deg, #3b82f6, #1e3a5f)',
  },
  {
    name: 'Salt Lake City',
    emoji: '🏛️',
    days: 'Sep 16',
    state: 'UT',
    gradient: 'linear-gradient(135deg, #64748b, #3b82f6)',
  },
  {
    name: 'Bryce Canyon',
    emoji: '🪨',
    days: 'Sep 17-18',
    state: 'UT',
    gradient: 'linear-gradient(135deg, #ea580c, #dc2626)',
  },
  {
    name: 'Zion',
    emoji: '⛰️',
    days: 'Sep 18-20',
    state: 'UT',
    gradient: 'linear-gradient(135deg, #dc2626, #f97316)',
  },
  {
    name: 'Las Vegas',
    emoji: '🎰',
    days: 'Sep 20-21',
    state: 'NV',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
  },
  {
    name: 'Mammoth Lakes',
    emoji: '🎿',
    days: 'Sep 21-22',
    state: 'CA',
    gradient: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
  },
  {
    name: 'Yosemite',
    emoji: '🌲',
    days: 'Sep 22-25',
    state: 'CA',
    gradient: 'linear-gradient(135deg, #16a34a, #0d9488)',
  },
  {
    name: 'San Francisco',
    emoji: '🌉',
    days: 'Sep 25-30',
    state: 'CA',
    gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
  },
]

const MODULE_CARDS: {
  path: string
  icon: LucideIcon
  label: string
  color: string
  countKey?: 'tasks' | 'photos' | 'packing' | 'expenses'
}[] = [
  { path: '/tasks', icon: CheckCircle2, label: 'משימות', color: '#007AFF', countKey: 'tasks' }, // ios-blue
  { path: '/itinerary', icon: CalendarRange, label: 'לוח זמנים', color: '#FF9500' }, // ios-orange
  { path: '/documents', icon: FolderClosed, label: 'מסמכים', color: '#FF3B30' }, // ios-red
  { path: '/map', icon: Map, label: 'מפה', color: '#5856D6' }, // ios-indigo
  { path: '/photos', icon: Camera, label: 'תמונות', color: '#FF2D55', countKey: 'photos' }, // ios-pink
  { path: '/blog', icon: PenLine, label: 'בלוג', color: '#34C759' }, // ios-green
  { path: '/budget', icon: CreditCard, label: 'תקציב', color: '#FF9500', countKey: 'expenses' }, // ios-orange
  { path: '/entertainment', icon: Music, label: 'בידור', color: '#AF52DE' }, // ios-purple
  { path: '/packing', icon: Briefcase, label: 'אריזה', color: '#5AC8FA', countKey: 'packing' }, // ios-teal
  { path: '/locations', icon: MapPin, label: 'יעדים', color: '#FF9500' }, // ios-orange
]

/* ── Passport Stamp decorative element ── */
function PassportStamp({
  text,
  date,
  rotation = -12,
}: {
  text: string
  date: string
  rotation?: number
}) {
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
      <div
        className="absolute rounded-full"
        style={{ inset: 4, border: '1px dashed rgba(180, 83, 9, 0.4)' }}
      />
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
  const showKidsView = currentMember ? isChild(currentMember) : false
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

  return (
    <div className="relative min-h-screen">
      {/* Scroll Progress Bar */}
      <ScrollProgress className="h-[3px]" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 pt-8 pb-28">
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
                  <p className="text-[13px] text-apple-secondary mt-1" dir="ltr">
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
              <p className="text-[13px] text-apple-secondary tracking-wide">{todayDate}</p>
              <p className="mt-0.5 text-[17px] font-semibold text-passport-slate dark:text-white">
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
                    <div className="text-caption text-apple-secondary mt-1 font-medium" dir="rtl">
                      ימים לטיסה
                    </div>
                  </div>
                  <div className="border-x border-white/10">
                    <div className="font-serif text-[36px] font-bold leading-none">
                      <NumberTicker value={2400} delay={0.4} />
                    </div>
                    <div className="text-caption text-apple-secondary mt-1 font-medium" dir="rtl">
                      מיילים
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-[36px] font-bold leading-none">
                      <NumberTicker value={21} delay={0.6} />
                    </div>
                    <div className="text-caption text-apple-secondary mt-1 font-medium" dir="rtl">
                      ימי טיול
                    </div>
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
                  <span className="text-[11px] opacity-85">
                    {d.days} · {d.state}
                  </span>
                </div>
              ))}
            </Marquee>
          </div>
        </BlurFade>

        {/* ── Quick Stats Row ── */}
        <BlurFade delay={0.25} duration={0.5}>
          <div className="mb-6 flex gap-2">
            <div
              className="flex-1 rounded-apple bg-white dark:bg-white/[0.08] px-3 py-2.5 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <p className="text-caption text-apple-secondary font-medium">משימות</p>
              <p className="text-body font-bold text-ios-green">
                {tasksDone}/{tasksTotal}
              </p>
            </div>
            <div
              className="flex-1 rounded-apple bg-white dark:bg-white/[0.08] px-3 py-2.5 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <p className="text-caption text-apple-secondary font-medium">תקציב</p>
              <p
                className={`text-body font-bold ${budgetPercent > 80 ? 'text-ios-red' : 'text-ios-blue'}`}
              >
                {budgetPercent}%
              </p>
            </div>
            <div
              className="flex-1 rounded-apple bg-white dark:bg-white/[0.08] px-3 py-2.5 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
            >
              <p className="text-caption text-apple-secondary font-medium">אריזה</p>
              <p className="text-body font-bold text-ios-teal">{packingPercent}%</p>
            </div>
          </div>
        </BlurFade>

        {/* ── Trip Route Progress ── */}
        {itineraryDays.length > 0 && (
          <BlurFade delay={0.3} duration={0.5}>
            <div className="mb-4">
              <TripRouteProgress
                itineraryDays={itineraryDays}
                tripDayIndex={tripDayIndex}
                daysLeft={daysLeft}
              />
            </div>
          </BlurFade>
        )}

        {/* ── Role-specific middle section ── */}
        {showKidsView ? (
          <KidsDashboard />
        ) : (
          <ParentDashboard
            attentionSection={
              attentionItems.length > 0 ? (
                <BlurFade delay={0.35} duration={0.5}>
                  <div className="mb-6">
                    <div
                      className="rounded-apple-lg overflow-hidden"
                      style={{
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
                        background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%)',
                        borderInlineStart: '4px solid #FF9500' /* ios-orange */,
                      }}
                    >
                      <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-apple-sm bg-ios-orange/10">
                          <AlertTriangle className="h-4 w-4 text-ios-orange" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[14px] font-bold text-passport-slate">דורש תשומת לב</h3>
                        <span className="ms-auto text-caption font-semibold rounded-full px-2 py-0.5 bg-ios-orange/10 text-ios-orange">
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
                                <span className="text-[11px] text-apple-secondary shrink-0 font-medium tabular-nums">
                                  {new Date(item.task.due_date + 'T00:00:00').toLocaleDateString(
                                    'he-IL',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                    },
                                  )}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </BlurFade>
              ) : null
            }
            nextStopSection={
              nextDay ? (
                <BlurFade delay={0.4} duration={0.5}>
                  <div className="mb-6">
                    <Link to="/itinerary">
                      <div
                        className="rounded-apple-lg bg-white p-4"
                        style={{
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-apple-sm bg-ios-orange/10">
                              <MapPin className="h-4 w-4 text-ios-orange" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-[15px] font-semibold text-passport-slate">
                                {nextDay.city || nextDay.title}
                              </p>
                              <p className="text-[11px] text-apple-secondary">
                                {tripDayIndex !== null ? `יום ${tripDayIndex + 1}` : `יום 1`} —{' '}
                                {nextDay.title}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] text-apple-secondary font-medium">
                            {nextDay.stops.length} עצירות
                          </span>
                        </div>

                        {nextDay.stops.slice(0, 2).map((stop, i) => (
                          <div key={stop.id || i} className="flex items-center gap-2 py-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-ios-orange shrink-0" />
                            <span className="text-[13px] text-apple-secondary truncate">
                              {stop.title}
                            </span>
                            {stop.start_time && (
                              <span className="text-[11px] text-apple-secondary ms-auto">
                                {stop.start_time}
                              </span>
                            )}
                          </div>
                        ))}
                        {nextDay.stops.length > 2 && (
                          <p className="text-[11px] text-apple-secondary mt-1">
                            +{nextDay.stops.length - 2} עצירות נוספות
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                </BlurFade>
              ) : null
            }
            weatherSection={
              <div className="mb-6">
                <WeatherWidget mode="dashboard" />
              </div>
            }
          />
        )}

        {/* ── Module Grid with MagicCard ── */}
        <BlurFade delay={0.5} duration={0.5}>
          <p className="text-caption uppercase tracking-wider text-apple-secondary mb-3">מודולים</p>{' '}
          {/* already uses token */}
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
              boxShadow:
                '0 6px 28px rgba(38, 204, 194, 0.25), inset 0 1px 2px rgba(255,255,255,0.8)',
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
