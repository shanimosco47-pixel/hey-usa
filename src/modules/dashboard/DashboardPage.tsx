import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plane, CheckSquare, Calendar, FileText, Map,
  Camera, BookOpen, DollarSign, Music, Package,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'
import { GlassCard } from '@/components/shared/GlassCard'
import { GradientIcon } from '@/components/shared/GradientIcon'
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
      <div className="mb-6">
        <p className="text-caption uppercase tracking-wide text-apple-secondary">{todayDate}</p>
        <h1 className="mt-1 text-title text-apple-primary">
          {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
          {memberData ? ` ${memberData.emoji}` : ''}
        </h1>
      </div>

      {/* Countdown widget - dark hero card */}
      <div className="mb-8 dark-card rounded-apple-xl p-6 text-white shadow-dark-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-apple-lg bg-white/[0.12]">
            <Plane className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold leading-none">{daysLeft}</span>
              <span className="text-lg font-medium opacity-90">ימים לטיול!</span>
            </div>
            <p className="mt-1 text-sm opacity-60">
              11 בספטמבר 2026 - ארה״ב, אנחנו באים!
            </p>
          </div>
        </div>
      </div>

      {/* Quick access grid */}
      <h2 className="mb-4 text-headline text-apple-primary">גישה מהירה</h2>
      <div className="grid grid-cols-3 gap-3">
        {MODULE_CARDS.map(({ path, icon, label, gradient }) => (
          <Link key={path} to={path}>
            <GlassCard padding="md" className="flex flex-col items-center gap-2.5 card-hover">
              <GradientIcon icon={icon} gradient={gradient} size="lg" />
              <span className="text-subhead text-apple-primary">{label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
