import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plane, CheckCircle2, CalendarRange, FolderClosed, Map,
  Camera, PenLine, CreditCard, Music, Briefcase, Bot,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'
import type { LucideIcon } from 'lucide-react'

const TRIP_DATE = new Date('2026-09-11T00:00:00')

const MODULE_CARDS: {
  path: string
  icon: LucideIcon
  label: string
  color: string
}[] = [
  { path: '/tasks', icon: CheckCircle2, label: 'משימות', color: '#007AFF' },
  { path: '/itinerary', icon: CalendarRange, label: 'לוח זמנים', color: '#FF9500' },
  { path: '/documents', icon: FolderClosed, label: 'מסמכים', color: '#FF3B30' },
  { path: '/map', icon: Map, label: 'מפה', color: '#5856D6' },
  { path: '/photos', icon: Camera, label: 'תמונות', color: '#FF2D55' },
  { path: '/blog', icon: PenLine, label: 'בלוג', color: '#34C759' },
  { path: '/budget', icon: CreditCard, label: 'תקציב', color: '#FF9500' },
  { path: '/entertainment', icon: Music, label: 'בידור', color: '#AF52DE' },
  { path: '/packing', icon: Briefcase, label: 'אריזה', color: '#5AC8FA' },
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
    <div className="mx-auto max-w-lg px-5 py-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-8"
      >
        <p className="text-[13px] text-apple-secondary tracking-wide">{todayDate}</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-apple-primary leading-tight">
          {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
        </h1>
      </motion.div>

      {/* Countdown — clean dark card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-10 rounded-[20px] overflow-hidden relative"
        style={{
          background: 'linear-gradient(160deg, #000000 0%, #1d1d1f 100%)',
        }}
      >
        <div className="relative px-6 py-7">
          {/* Subtle gradient accent */}
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 70% 30%, #007AFF, transparent 70%)',
            }}
          />
          <div className="flex items-center justify-between relative">
            <div>
              <div className="flex items-baseline gap-3">
                <motion.span
                  key={daysLeft}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="text-[56px] font-bold text-white leading-none tracking-tighter"
                >
                  {daysLeft}
                </motion.span>
                <span className="text-[17px] font-medium text-white/70">ימים</span>
              </div>
              <p className="mt-2 text-[13px] text-white/40 font-medium">
                11 בספטמבר 2026 — ארה״ב
              </p>
            </div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Plane className="h-8 w-8 text-white/20" strokeWidth={1.5} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Module grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
        }}
        className="grid grid-cols-3 gap-3"
      >
        {MODULE_CARDS.map(({ path, icon: Icon, label, color }) => (
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
                className="flex flex-col items-center gap-3 rounded-[16px] bg-white py-5 px-2"
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)',
                }}
              >
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
