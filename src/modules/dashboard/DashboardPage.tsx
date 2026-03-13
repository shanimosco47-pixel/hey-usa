import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'

const TRIP_DATE = new Date('2026-09-11T00:00:00')

const MODULE_CARDS = [
  { path: '/tasks', emoji: '✅', label: 'משימות', gradient: ['#5856D6', '#8944DB'], shadow: 'rgba(88,86,214,0.4)' },
  { path: '/itinerary', emoji: '🗓️', label: 'לוח זמנים', gradient: ['#FF9500', '#F5C518'], shadow: 'rgba(255,149,0,0.4)' },
  { path: '/documents', emoji: '📁', label: 'מסמכים', gradient: ['#FF3B30', '#FF6B6B'], shadow: 'rgba(255,59,48,0.4)' },
  { path: '/map', emoji: '🗺️', label: 'מפה', gradient: ['#007AFF', '#00C6FB'], shadow: 'rgba(0,122,255,0.4)' },
  { path: '/photos', emoji: '📸', label: 'תמונות', gradient: ['#FF2D55', '#FF6F91'], shadow: 'rgba(255,45,85,0.4)' },
  { path: '/blog', emoji: '✍️', label: 'בלוג', gradient: ['#34C759', '#7EE787'], shadow: 'rgba(52,199,89,0.4)' },
  { path: '/budget', emoji: '💰', label: 'תקציב', gradient: ['#FF9500', '#FF6723'], shadow: 'rgba(255,149,0,0.4)' },
  { path: '/entertainment', emoji: '🎧', label: 'בידור', gradient: ['#AF52DE', '#E040FB'], shadow: 'rgba(175,82,222,0.4)' },
  { path: '/packing', emoji: '🧳', label: 'אריזה', gradient: ['#5AC8FA', '#64D2FF'], shadow: 'rgba(90,200,250,0.4)' },
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
        className="mb-8 rounded-[24px] p-6 text-white overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {/* Animated gradient shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer pointer-events-none" />
        {/* Decorative glow orbs */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4 relative">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="flex h-16 w-16 items-center justify-center rounded-[18px]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-4xl">✈️</span>
          </motion.div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={daysLeft}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-5xl font-bold leading-none"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
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
        {MODULE_CARDS.map(({ path, emoji, label, gradient, shadow }) => (
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
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="relative rounded-[20px] p-4 pb-3 flex flex-col items-center gap-2 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '0.5px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                {/* Gradient emoji container */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="relative flex items-center justify-center w-[68px] h-[68px] rounded-[18px] overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${gradient[0]}, ${gradient[1]})`,
                    boxShadow: `0 6px 20px ${shadow}, 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.25)`,
                  }}
                >
                  {/* Top shine */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%)',
                    }}
                  />
                  {/* Edge highlight */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[18px]"
                    style={{ border: '0.5px solid rgba(255,255,255,0.25)' }}
                  />
                  <span className="text-[32px] relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                    {emoji}
                  </span>
                </motion.div>
                <span className="text-[13px] font-semibold text-apple-primary">{label}</span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
