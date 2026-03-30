import { useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isChild } from '@/lib/familyRoles'
import { useAppData } from '@/contexts/AppDataContext'
import { KidsDashboard } from './components/KidsDashboard'
import { ParentDashboard } from './components/ParentDashboard'
import { TripRouteProgress } from './components/TripRouteProgress'
import { AttentionItems } from './components/AttentionItems'
import { NextStopCard } from './components/NextStopCard'
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
    gradient: 'linear-gradient(135deg, #334155, #1e293b)',
  },
  {
    name: 'Yellowstone',
    emoji: '🌋',
    days: 'Sep 11-14',
    state: 'WY',
    gradient: 'linear-gradient(135deg, #92400e, #78350f)',
  },
  {
    name: 'Grand Teton',
    emoji: '🏔️',
    days: 'Sep 14-16',
    state: 'WY',
    gradient: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
  },
  {
    name: 'Salt Lake City',
    emoji: '🏛️',
    days: 'Sep 16',
    state: 'UT',
    gradient: 'linear-gradient(135deg, #57534e, #44403c)',
  },
  {
    name: 'Bryce Canyon',
    emoji: '🪨',
    days: 'Sep 17-18',
    state: 'UT',
    gradient: 'linear-gradient(135deg, #c2410c, #9a3412)',
  },
  {
    name: 'Zion',
    emoji: '⛰️',
    days: 'Sep 18-20',
    state: 'UT',
    gradient: 'linear-gradient(135deg, #b45309, #92400e)',
  },
  {
    name: 'Las Vegas',
    emoji: '🎰',
    days: 'Sep 20-21',
    state: 'NV',
    gradient: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
  },
  {
    name: 'Mammoth Lakes',
    emoji: '🎿',
    days: 'Sep 21-22',
    state: 'CA',
    gradient: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
  },
  {
    name: 'Yosemite',
    emoji: '🌲',
    days: 'Sep 22-25',
    state: 'CA',
    gradient: 'linear-gradient(135deg, #3f6212, #365314)',
  },
  {
    name: 'San Francisco',
    emoji: '🌉',
    days: 'Sep 25-30',
    state: 'CA',
    gradient: 'linear-gradient(135deg, #9a3412, #7c2d12)',
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
  size = 72,
}: {
  text: string
  date: string
  rotation?: number
  size?: number
}) {
  return (
    <div
      className="passport-stamp inline-flex flex-col items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <span className="font-serif text-caption font-semibold uppercase tracking-wider">{text}</span>
      <span className="font-serif text-[10px] font-bold">{date}</span>
    </div>
  )
}

/* ── Rectangular passport stamp ── */
function PassportStampRect({ text, rotation = 3 }: { text: string; rotation?: number }) {
  return (
    <div
      className="passport-stamp-rect shrink-0 px-3 py-1.5"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <span className="font-serif text-[10px] font-bold uppercase tracking-widest">{text}</span>
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

      <div className="relative z-10 mx-auto max-w-4xl px-5 pt-8 pb-28">
        {/* ── Hero Section — Editorial Travel Journal ── */}
        <BlurFade delay={0} duration={0.5}>
          <div className="mb-8">
            {/* Decorative stamps row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <PassportStamp text="USA" date="SEP 26" rotation={-8} size={76} />
                <div>
                  <h1 className="font-serif text-[40px] font-bold text-passport-slate leading-none tracking-tight">
                    <span dir="ltr">Hey USA</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5" dir="ltr">
                    <div className="h-px flex-1 bg-passport-rust/20 max-w-[60px]" />
                    <p className="text-subhead text-passport-rust font-medium tracking-wide uppercase">
                      Bozeman → San Francisco
                    </p>
                    <div className="h-px flex-1 bg-passport-rust/20 max-w-[60px]" />
                  </div>
                </div>
              </div>
              {/* Family avatars with warm ring */}
              <div className="flex -space-x-2 rtl:space-x-reverse mt-2">
                {(['aba', 'ima', 'kid1', 'kid2'] as FamilyMemberId[]).map((id, i) => (
                  <div
                    key={id}
                    className="relative ring-2 ring-passport-cream rounded-full"
                    style={{ zIndex: 4 - i }}
                  >
                    <FamilyAvatar memberId={id} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Date & greeting — warm editorial style */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-subhead text-apple-secondary tracking-wide">{todayDate}</p>
                <p className="mt-0.5 text-headline font-semibold text-passport-slate">
                  {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
                </p>
              </div>
              <PassportStampRect text="APPROVED" rotation={4} />
            </div>

            {/* Warm divider */}
            <div className="mt-5 border-b divider-warm" />
          </div>
        </BlurFade>

        {/* ── Hero Stats — Warm Passport Card ── */}
        <BlurFade delay={0.1} duration={0.5}>
          <div className="mb-5">
            <MagicCard className="rounded-apple-xl">
              <div
                className="relative rounded-apple-xl py-7 px-5 text-white overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #78350f 150%)',
                }}
                dir="ltr"
              >
                {/* Decorative stamp watermark */}
                <div
                  className="absolute -top-4 -right-4 opacity-[0.04]"
                  style={{
                    width: 140,
                    height: 140,
                    border: '4px solid white',
                    borderRadius: '50%',
                    transform: 'rotate(15deg)',
                  }}
                />
                <div className="grid grid-cols-3 gap-4 text-center relative">
                  <div>
                    <div className="font-serif text-[38px] font-bold leading-none">
                      <NumberTicker value={daysLeft} delay={0.2} />
                    </div>
                    <div
                      className="text-[11px] text-amber-300/70 mt-1.5 font-medium uppercase tracking-wider"
                      dir="rtl"
                    >
                      ימים לטיסה
                    </div>
                  </div>
                  <div className="border-x border-amber-500/15">
                    <div className="font-serif text-[38px] font-bold leading-none">
                      <NumberTicker value={2400} delay={0.4} />
                    </div>
                    <div
                      className="text-[11px] text-amber-300/70 mt-1.5 font-medium uppercase tracking-wider"
                      dir="rtl"
                    >
                      מיילים
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-[38px] font-bold leading-none">
                      <NumberTicker value={21} delay={0.6} />
                    </div>
                    <div
                      className="text-[11px] text-amber-300/70 mt-1.5 font-medium uppercase tracking-wider"
                      dir="rtl"
                    >
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
                  <span className="text-title">{d.emoji}</span>
                  <span className="text-body font-semibold">{d.name}</span>
                  <span className="text-caption opacity-85">
                    {d.days} · {d.state}
                  </span>
                </div>
              ))}
            </Marquee>
          </div>
        </BlurFade>

        {/* ── Desktop two-column layout starts here ── */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start">
          {/* Left column — main content */}
          <div>
            {/* ── Quick Stats Row — Parchment Cards ── */}
            <BlurFade delay={0.25} duration={0.5}>
              <div className="mb-6 flex gap-2.5">
                <div className="flex-1 glass rounded-apple-lg px-3 py-3 text-center">
                  <p className="text-caption text-apple-secondary font-medium uppercase tracking-wider">
                    משימות
                  </p>
                  <p className="text-body font-bold text-passport-sage mt-0.5">
                    {tasksDone}/{tasksTotal}
                  </p>
                </div>
                <div className="flex-1 glass rounded-apple-lg px-3 py-3 text-center">
                  <p className="text-caption text-apple-secondary font-medium uppercase tracking-wider">
                    תקציב
                  </p>
                  <p
                    className={`text-body font-bold mt-0.5 ${budgetPercent > 80 ? 'text-passport-terracotta' : 'text-passport-slate'}`}
                  >
                    {budgetPercent}%
                  </p>
                </div>
                <div className="flex-1 glass rounded-apple-lg px-3 py-3 text-center">
                  <p className="text-caption text-apple-secondary font-medium uppercase tracking-wider">
                    אריזה
                  </p>
                  <p className="text-body font-bold text-passport-rust mt-0.5">{packingPercent}%</p>
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

            {/* ── Module Grid with MagicCard ── */}
            <BlurFade delay={0.5} duration={0.5}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-passport-rust/10" />
                <p className="text-caption uppercase tracking-widest text-passport-rust/60 font-semibold">
                  מודולים
                </p>
                <div className="h-px flex-1 bg-passport-rust/10" />
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                {MODULE_CARDS.map(({ path, icon: Icon, label, color, countKey }, i) => (
                  <BlurFade key={path} delay={0.55 + i * 0.04} duration={0.4}>
                    <Link to={path}>
                      <MagicCard className="rounded-apple-lg cursor-pointer">
                        <div className="relative flex flex-col items-center gap-3 py-5 px-2">
                          {countKey && badgeCounts[countKey] > 0 && (
                            <span
                              className="absolute -top-1.5 -start-1.5 flex h-5 min-w-5 items-center justify-center rounded-full text-caption font-bold text-white px-1 z-50"
                              style={{ backgroundColor: color }}
                            >
                              {badgeCounts[countKey]}
                            </span>
                          )}
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-apple"
                            style={{ backgroundColor: `${color}10` }}
                          >
                            <Icon
                              className="h-[22px] w-[22px]"
                              style={{ color }}
                              strokeWidth={1.8}
                            />
                          </div>
                          <span className="text-subhead font-medium text-passport-slate">
                            {label}
                          </span>
                        </div>
                      </MagicCard>
                    </Link>
                  </BlurFade>
                ))}
              </div>
            </BlurFade>
          </div>
          {/* end left column */}

          {/* Right column — visible on desktop only, role-specific sections */}
          <div className="hidden lg:block">
            {showKidsView ? (
              <KidsDashboard />
            ) : (
              <div className="sticky top-20 space-y-4">
                {/* Attention items */}
                {attentionItems.length > 0 && (
                  <BlurFade delay={0.35} duration={0.5}>
                    <AttentionItems items={attentionItems} />
                  </BlurFade>
                )}

                {/* Next stop */}
                {nextDay && (
                  <BlurFade delay={0.4} duration={0.5}>
                    <NextStopCard nextDay={nextDay} tripDayIndex={tripDayIndex} />
                  </BlurFade>
                )}

                {/* Weather */}
                <BlurFade delay={0.45} duration={0.5}>
                  <WeatherWidget mode="dashboard" />
                </BlurFade>
              </div>
            )}
          </div>
          {/* end right column */}
        </div>
        {/* end lg:grid */}

        {/* Mobile-only: role-specific sections (hidden on lg+) */}
        <div className="lg:hidden mt-2">
          {showKidsView ? (
            <KidsDashboard />
          ) : (
            <ParentDashboard
              attentionSection={
                attentionItems.length > 0 ? (
                  <BlurFade delay={0.35} duration={0.5}>
                    <div className="mb-6">
                      <AttentionItems items={attentionItems} />
                    </div>
                  </BlurFade>
                ) : null
              }
              nextStopSection={
                nextDay ? (
                  <BlurFade delay={0.4} duration={0.5}>
                    <div className="mb-6">
                      <NextStopCard nextDay={nextDay} tripDayIndex={tripDayIndex} />
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
        </div>

        {/* Floating chat button — Moti robot */}
        <MotiFloatingButton />
      </div>
    </div>
  )
}

function MotiFloatingButton() {
  const navigate = useNavigate()
  const isDragging = useRef(false)

  const handleDragStart = useCallback(() => {
    isDragging.current = true
  }, [])

  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      isDragging.current = false
    }, 150)
  }, [])

  const handleClick = useCallback(() => {
    if (!isDragging.current) {
      navigate('/chat')
    }
  }, [navigate])

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.15}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { delay: 0.6 },
        scale: { delay: 0.6, type: 'spring', stiffness: 300, damping: 20 },
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 start-5 z-20 flex h-28 w-28 items-center justify-center rounded-full overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      style={{
        background: 'linear-gradient(145deg, #FAF8F5, #E8E0D8)',
        boxShadow: '0 6px 28px rgba(180, 83, 9, 0.15), inset 0 1px 2px rgba(255,255,255,0.8)',
        border: '2px solid rgba(180, 83, 9, 0.12)',
      }}
      aria-label="צ'אט עם מוטי"
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
  )
}
