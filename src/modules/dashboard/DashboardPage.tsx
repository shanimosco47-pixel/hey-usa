import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plane, CheckSquare, Calendar, FileText, Map,
  Camera, BookOpen, DollarSign, Music, Package,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'
import { GlassCard } from '@/components/shared/GlassCard'
import { MotionGradientIcon } from '@/components/ui/animated-icon'
import type { LucideIcon } from 'lucide-react'

const TRIP_DATE = new Date('2026-09-11T00:00:00')

const MODULE_CARDS: {
  path: string
  icon: LucideIcon
  label: string
  gradient: [string, string]
}[] = [
  { path: '/tasks', icon: CheckSquare, label: 'משימות', gradient: ['#5856D6', '#AF52DE'] },
  { path: '/itinerary', icon: Calendar, label: 'לוח זמנים', gradient: ['#FF9500', '#FFCC00'] },
  { path: '/documents', icon: FileText, label: 'מסמכים', gradient: ['#FF3B30', '#FF6259'] },
  { path: '/map', icon: Map, label: 'מפה', gradient: ['#007AFF', '#34C759'] },
  { path: '/photos', icon: Camera, label: 'תמונות', gradient: ['#FF2D55', '#FF6B8A'] },
  { path: '/blog', icon: BookOpen, label: 'בלוג', gradient: ['#34C759', '#30D158'] },
  { path: '/budget', icon: DollarSign, label: 'תקציב', gradient: ['#FF9500', '#FF6723'] },
  { path: '/entertainment', icon: Music, label: 'בידור', gradient: ['#AF52DE', '#BF5AF2'] },
  { path: '/packing', icon: Package, label: 'אריזה', gradient: ['#5AC8FA', '#64D2FF'] },
]

function getDaysUntilTrip(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = TRIP_DATE.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
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
  const daysLeft = useMemo(() => getDaysUntilTrip(), [])
  const todayDate = useMemo(() => formatHebrewDate(), [])

  const memberData = currentMember ? FAMILY_MEMBERS[currentMember] : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header with greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mb-6"
      >
        <p className="text-caption uppercase tracking-wide text-apple-secondary">{todayDate}</p>
        <h1 className="mt-1 text-title text-apple-primary">
          {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
          {memberData ? ` ${memberData.emoji}` : ''}
        </h1>
      </motion.div>

      {/* Countdown widget - dark hero card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        className="mb-8 dark-card rounded-apple-xl p-6 text-white shadow-dark-card overflow-hidden relative"
      >
        {/* Animated gradient shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer pointer-events-none" />
        <div className="flex items-center gap-4 relative">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="flex h-14 w-14 items-center justify-center rounded-apple-lg bg-white/[0.12]"
          >
            <Plane className="h-7 w-7" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={daysLeft}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-5xl font-bold leading-none"
              >
                {daysLeft}
              </motion.span>
              <span className="text-lg font-medium opacity-90">ימים לטיול!</span>
            </div>
            <p className="mt-1 text-sm opacity-60">
              11 בספטמבר 2026 - ארה״ב, אנחנו באים!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick access grid */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4 text-headline text-apple-primary"
      >
        גישה מהירה
      </motion.h2>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } },
        }}
        className="grid grid-cols-3 gap-3"
      >
        {MODULE_CARDS.map(({ path, icon, label, gradient }) => (
          <motion.div
            key={path}
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.95 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 300, damping: 24 },
              },
            }}
          >
            <Link to={path}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <GlassCard padding="md" className="flex flex-col items-center gap-2.5">
                  <MotionGradientIcon icon={icon} gradient={gradient} size="lg" />
                  <span className="text-subhead text-apple-primary">{label}</span>
                </GlassCard>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
