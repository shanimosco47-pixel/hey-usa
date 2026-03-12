import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plane,
  CheckSquare,
  Calendar,
  FileText,
  Map,
  Camera,
  BookOpen,
  DollarSign,
  Music,
  Package,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'

const TRIP_DATE = new Date('2026-09-11T00:00:00')

const MODULE_CARDS = [
  { path: '/tasks', icon: CheckSquare, label: 'משימות', color: '#6c5ce7', bgClass: 'bg-[#6c5ce7]/10' },
  { path: '/itinerary', icon: Calendar, label: 'לוח זמנים', color: '#f5c542', bgClass: 'bg-[#f5c542]/10' },
  { path: '/documents', icon: FileText, label: 'מסמכים', color: '#c44d34', bgClass: 'bg-[#c44d34]/10' },
  { path: '/map', icon: Map, label: 'מפה', color: '#4a90d9', bgClass: 'bg-[#4a90d9]/10' },
  { path: '/photos', icon: Camera, label: 'תמונות', color: '#e8735e', bgClass: 'bg-[#e8735e]/10' },
  { path: '/blog', icon: BookOpen, label: 'בלוג', color: '#2d7d46', bgClass: 'bg-[#2d7d46]/10' },
  { path: '/budget', icon: DollarSign, label: 'תקציב', color: '#8B6914', bgClass: 'bg-[#8B6914]/10' },
  { path: '/entertainment', icon: Music, label: 'בידור', color: '#6c5ce7', bgClass: 'bg-[#6c5ce7]/10' },
  { path: '/packing', icon: Package, label: 'אריזה', color: '#2d7d46', bgClass: 'bg-[#2d7d46]/10' },
] as const

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
        <p className="text-sm text-brown-light">{todayDate}</p>
        <h1 className="mt-1 text-2xl font-bold text-brown">
          {memberData ? `שלום, ${memberData.name}` : 'שלום!'}
          {memberData ? ` ${memberData.emoji}` : ''}
        </h1>
      </div>

      {/* Countdown widget */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-bl from-terracotta to-terracotta-light p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Plane className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold leading-none">{daysLeft}</span>
              <span className="text-lg font-medium opacity-90">ימים לטיול!</span>
            </div>
            <p className="mt-1 text-sm opacity-80">
              11 בספטמבר 2026 - ארה״ב, אנחנו באים!
            </p>
          </div>
        </div>
      </div>

      {/* Quick access grid */}
      <h2 className="mb-4 text-lg font-bold text-brown">גישה מהירה</h2>
      <div className="grid grid-cols-3 gap-3">
        {MODULE_CARDS.map(({ path, icon: Icon, label, color, bgClass }) => (
          <Link
            key={path}
            to={path}
            className="flex flex-col items-center gap-2 rounded-2xl border border-sand-dark bg-white/60 p-4 shadow-sm transition-all hover:shadow-md active:scale-95"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgClass}`}
            >
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <span className="text-xs font-semibold text-brown">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
