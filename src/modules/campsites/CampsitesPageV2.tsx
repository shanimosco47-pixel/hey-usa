import { useState, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  HelpCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Pencil,
  ExternalLink,
  Link2,
} from 'lucide-react'
import type { CampsiteBooking, BookingStatus, AccommodationType } from '@/types'
import { useCampsiteBookings } from './hooks/useCampsiteBookings'
import { GlassCard } from '@/components/shared/GlassCard'

// ── Region mapping ───────────────────────────────────────────────
function getRegion(area: string): string {
  if (area.includes('Yellowstone') || area.includes('Gardiner')) return 'Yellowstone'
  if (area.includes('Jackson')) return 'Grand Teton / Jackson'
  if (area.includes('Provo') || area.includes('Nephi')) return 'Utah Transit'
  if (area.includes('Bryce')) return 'Bryce Canyon'
  if (area.includes('Zion')) return 'Zion'
  if (area.includes('Las Vegas')) return 'Las Vegas'
  if (area.includes('Mammoth')) return 'Mammoth Lakes'
  if (area.includes('Yosemite')) return 'Yosemite'
  if (area.includes('Oakland') || area.includes('Marin') || area.includes('San Francisco'))
    return 'San Francisco Bay'
  if (area.includes('Denver')) return 'Denver'
  return area
}

// ── Status config ────────────────────────────────────────────────
const STATUS_META: Record<
  BookingStatus,
  {
    label: string
    dot: string
    bg: string
    border: string
    text: string
    icon: typeof CheckCircle2
  }
> = {
  confirmed: {
    label: 'מאושר',
    dot: 'bg-ios-green',
    bg: 'bg-ios-green/10 dark:bg-ios-green/20',
    border: 'border-ios-green',
    text: 'text-ios-green',
    icon: CheckCircle2,
  },
  pending: {
    label: 'בטיפול',
    dot: 'bg-ios-orange',
    bg: 'bg-ios-orange/10 dark:bg-ios-orange/20',
    border: 'border-ios-orange',
    text: 'text-ios-orange',
    icon: Clock,
  },
  waitlist: {
    label: 'המתנה',
    dot: 'bg-ios-blue',
    bg: 'bg-ios-blue/10 dark:bg-ios-blue/20',
    border: 'border-ios-blue',
    text: 'text-ios-blue',
    icon: Clock,
  },
  not_open: {
    label: 'לא הוזמן',
    dot: 'bg-gray-300 dark:bg-gray-600',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-apple-secondary',
    icon: HelpCircle,
  },
  cancelled: {
    label: 'בוטל',
    dot: 'bg-ios-red',
    bg: 'bg-ios-red/10 dark:bg-ios-red/20',
    border: 'border-ios-red',
    text: 'text-ios-red',
    icon: XCircle,
  },
}

const LEGEND: { status: BookingStatus; emoji: string }[] = [
  { status: 'confirmed', emoji: '🟢' },
  { status: 'pending', emoji: '🟡' },
  { status: 'waitlist', emoji: '🔵' },
  { status: 'not_open', emoji: '⚪' },
  { status: 'cancelled', emoji: '🔴' },
]

const TYPE_ICON: Record<AccommodationType, { icon: string; label: string }> = {
  campground: { icon: '⛺', label: 'קמפינג' },
  rv_park: { icon: '🚐', label: 'RV פארק' },
  hotel: { icon: '🏨', label: 'מלון' },
  overnight_parking: { icon: '🅿️', label: 'חניית לילה' },
  unknown: { icon: '❓', label: 'לא ידוע' },
}

// ── Date helpers ─────────────────────────────────────────────────
function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ספט`
}

function formatRange(checkIn: string, checkOut: string): string {
  return `${formatDay(checkIn)} — ${formatDay(checkOut)}`
}

function daysBetween(a: string, b: string): number {
  return (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000
}

function isWithin14Days(deadline?: string): boolean {
  if (!deadline) return false
  const diff = daysBetween(new Date().toISOString().slice(0, 10), deadline)
  return diff >= 0 && diff <= 14
}

// ── Grouping logic ───────────────────────────────────────────────
interface BookingGroup {
  region: string
  bookings: CampsiteBooking[]
  dateRange: string
}

function groupBookings(bookings: CampsiteBooking[]): BookingGroup[] {
  const primary = bookings.filter((b) => b.priority === 'primary')
  const sorted = [...primary].sort((a, b) => a.check_in.localeCompare(b.check_in))

  const groups: BookingGroup[] = []
  for (const b of sorted) {
    const region = getRegion(b.area)
    const last = groups[groups.length - 1]
    if (last && last.region === region) {
      const lastBooking = last.bookings[last.bookings.length - 1]
      if (daysBetween(lastBooking.check_out, b.check_in) <= 1) {
        last.bookings.push(b)
        continue
      }
    }
    groups.push({ region, bookings: [b], dateRange: '' })
  }

  for (const g of groups) {
    const first = g.bookings[0]
    const last = g.bookings[g.bookings.length - 1]
    g.dateRange = formatRange(first.check_in, last.check_out)
  }
  return groups
}

// ── Generate timeline nights ─────────────────────────────────────
interface TimelineNight {
  date: string
  dayNum: number
  status: BookingStatus | 'none'
  type: AccommodationType | null
  bookingId: string | null
}

function buildTimeline(bookings: CampsiteBooking[]): TimelineNight[] {
  const nights: TimelineNight[] = []
  const primary = bookings.filter((b) => b.priority === 'primary')

  for (let d = 10; d <= 29; d++) {
    const date = `2026-09-${String(d).padStart(2, '0')}`
    const match = primary.find((b) => b.check_in <= date && b.check_out > date)
    nights.push({
      date,
      dayNum: d,
      status: match ? match.status : 'none',
      type: match ? match.type : null,
      bookingId: match ? match.id : null,
    })
  }
  return nights
}

// ── Inline edit field ────────────────────────────────────────────
function InlineEdit({
  value,
  field,
  onSave,
}: {
  value: string
  field: string
  onSave: (field: string, val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSave = useCallback(() => {
    if (draft !== value) onSave(field, draft)
    setEditing(false)
  }, [draft, value, field, onSave])

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true)
          setDraft(value)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="inline-flex items-center gap-1 text-apple-secondary hover:text-ios-blue transition-colors"
      >
        <Pencil className="w-3 h-3" />
      </button>
    )
  }
  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      className="border border-ios-blue/30 rounded-apple-sm px-2 py-0.5 text-subhead bg-white dark:bg-gray-900 w-full"
      dir="ltr"
    />
  )
}

// ── Region emoji ────────────────────────────────────────────────
const REGION_EMOJI: Record<string, string> = {
  Denver: '✈️',
  Yellowstone: '🌋',
  'Grand Teton / Jackson': '🏔️',
  'Utah Transit': '🚐',
  'Bryce Canyon': '🪨',
  Zion: '⛰️',
  'Las Vegas': '🎰',
  'Mammoth Lakes': '🎿',
  Yosemite: '🌲',
  'San Francisco Bay': '🌉',
}

// ── Booking Card ─────────────────────────────────────────────────
function BookingCard({
  booking,
  onUpdate,
}: {
  booking: CampsiteBooking
  onUpdate: (id: string, changes: Partial<CampsiteBooking>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = STATUS_META[booking.status]
  const typeInfo = TYPE_ICON[booking.type] ?? TYPE_ICON.unknown
  const deadlineWarning = isWithin14Days(booking.cancellation_deadline)
  const nights = daysBetween(booking.check_in, booking.check_out)

  const handleFieldSave = useCallback(
    (field: string, val: string) => {
      onUpdate(booking.id, { [field]: field === 'cost' ? Number(val) || undefined : val })
    },
    [booking.id, onUpdate],
  )

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      id={`booking-${booking.id}`}
    >
      <GlassCard padding="sm" className={cn('border-r-4', meta.border, 'relative')}>
        {/* Top row: status + type + nights */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              'text-caption px-2 py-0.5 rounded-full font-semibold',
              meta.bg,
              meta.text,
            )}
          >
            {meta.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-caption text-apple-secondary">
              {nights} {nights === 1 ? 'לילה' : 'לילות'}
            </span>
            <span className="text-lg">{typeInfo.icon}</span>
          </div>
        </div>

        {/* Location — bold and prominent */}
        <h4 className="text-headline text-apple-primary dark:text-white leading-tight">
          {booking.location}
        </h4>
        <p className="text-caption text-apple-tertiary">{booking.area}</p>

        {/* Date range */}
        <div className="flex items-center gap-1.5 mt-2 text-subhead text-apple-secondary" dir="ltr">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{formatRange(booking.check_in, booking.check_out)}</span>
        </div>

        {/* Registration opens date */}
        {booking.registration_opens &&
          booking.status === 'not_open' &&
          (() => {
            const daysUntil = daysBetween(
              new Date().toISOString().slice(0, 10),
              booking.registration_opens,
            )
            const passed = daysUntil < 0
            return (
              <div
                className={cn(
                  'mt-2 flex items-center gap-1.5 text-caption rounded-apple-sm px-2 py-1',
                  passed
                    ? 'bg-ios-red/10 text-ios-red font-semibold'
                    : daysUntil <= 14
                      ? 'bg-ios-orange/10 text-ios-orange font-semibold'
                      : 'bg-ios-blue/10 text-ios-blue',
                )}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {passed
                    ? `הרשמה נפתחה ב-${formatDay(booking.registration_opens)} — הזמינו!`
                    : `הרשמה נפתחת ב-${formatDay(booking.registration_opens)} (בעוד ${daysUntil} ימים)`}
                </span>
              </div>
            )
          })()}

        {/* Cost + Confirmation row */}
        {(booking.cost != null || booking.confirmation) && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {booking.cost != null && (
              <span
                className="text-subhead font-semibold text-apple-primary dark:text-white"
                dir="ltr"
              >
                <DollarSign className="w-3.5 h-3.5 inline-block" />
                {booking.cost}
                <InlineEdit value={String(booking.cost)} field="cost" onSave={handleFieldSave} />
              </span>
            )}
            {booking.confirmation && (
              <span className="text-caption text-apple-secondary font-mono" dir="ltr">
                {booking.confirmation}
              </span>
            )}
          </div>
        )}

        {/* Cancellation warning */}
        {deadlineWarning && (
          <div className="mt-2 flex items-center gap-1.5 text-caption text-ios-red bg-ios-red/10 rounded-apple-sm px-2 py-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>ביטול עד {formatDay(booking.cancellation_deadline!)}</span>
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Website link */}
          {booking.booking_url && (
            <a
              href={booking.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-caption text-ios-blue hover:underline font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              אתר
            </a>
          )}

          {/* Document link */}
          {booking.document_id && (
            <a
              href={`/hey-usa/documents?doc=${booking.document_id}`}
              className="inline-flex items-center gap-1 text-caption text-ios-purple hover:underline font-medium"
            >
              <Link2 className="w-3 h-3" />
              מסמך
            </a>
          )}

          {/* Notes toggle */}
          {booking.notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-caption text-apple-secondary hover:text-ios-blue transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {expanded ? 'הסתר' : 'הערות'}
            </button>
          )}
        </div>

        {/* Expanded notes */}
        {expanded && booking.notes && (
          <p className="mt-2 text-caption text-apple-secondary whitespace-pre-wrap bg-black/[0.02] dark:bg-white/[0.04] rounded-apple-sm p-2">
            {booking.notes}
          </p>
        )}
      </GlassCard>
    </motion.div>
  )
}

// ── Action item types ────────────────────────────────────────────
interface ActionItem {
  id: string
  type: 'registration_soon' | 'registration_passed' | 'not_booked' | 'cancel_deadline' | 'duplicate'
  priority: number // lower = more urgent
  title: string
  subtitle: string
  color: string
  bookingId: string
  url?: string
}

function buildActionItems(bookings: CampsiteBooking[]): ActionItem[] {
  const items: ActionItem[] = []
  const todayStr = new Date().toISOString().slice(0, 10)
  const primary = bookings.filter((b) => b.priority === 'primary')

  for (const b of primary) {
    // Registration opening soon (within 30 days) or already passed
    if (b.registration_opens && b.status === 'not_open') {
      const daysUntil = daysBetween(todayStr, b.registration_opens)
      if (daysUntil < 0) {
        items.push({
          id: `reg-passed-${b.id}`,
          type: 'registration_passed',
          priority: 0,
          title: `⚠️ ההרשמה ל-${b.location} כבר נפתחה!`,
          subtitle: `נפתחה ב-${formatDay(b.registration_opens)} — הזמינו עכשיו לפני שנגמר`,
          color: 'text-ios-red',
          bookingId: b.id,
          url: b.booking_url,
        })
      } else if (daysUntil <= 30) {
        items.push({
          id: `reg-soon-${b.id}`,
          type: 'registration_soon',
          priority: 1,
          title: `🗓️ הרשמה ל-${b.location} נפתחת בעוד ${daysUntil} ימים`,
          subtitle: `${formatDay(b.registration_opens)} — הכינו תזכורת!`,
          color: 'text-ios-orange',
          bookingId: b.id,
          url: b.booking_url,
        })
      }
    }

    // Cancellation deadline approaching (within 30 days)
    if (b.cancellation_deadline && b.status === 'confirmed') {
      const daysUntil = daysBetween(todayStr, b.cancellation_deadline)
      if (daysUntil >= 0 && daysUntil <= 30) {
        items.push({
          id: `cancel-${b.id}`,
          type: 'cancel_deadline',
          priority: 2,
          title: `⏰ מועד ביטול ל-${b.location} בעוד ${daysUntil} ימים`,
          subtitle: `עד ${formatDay(b.cancellation_deadline)} · החזר $${b.refund_amount ?? 0}`,
          color: 'text-ios-purple',
          bookingId: b.id,
        })
      }
    }
  }

  // Check for date overlaps (potential duplicates)
  for (let i = 0; i < primary.length; i++) {
    for (let j = i + 1; j < primary.length; j++) {
      const a = primary[i]
      const b = primary[j]
      if (a.check_in === b.check_in && a.status !== 'cancelled' && b.status !== 'cancelled') {
        items.push({
          id: `dup-${a.id}-${b.id}`,
          type: 'duplicate',
          priority: 3,
          title: `🔄 הזמנה כפולה ב-${formatDay(a.check_in)}`,
          subtitle: `${a.location} + ${b.location} — באותו תאריך`,
          color: 'text-ios-red',
          bookingId: a.id,
        })
      }
    }
  }

  // Not booked items (sorted by date)
  const notBooked = primary.filter((b) => b.status === 'not_open' && !b.registration_opens)
  for (const b of notBooked) {
    items.push({
      id: `unbooked-${b.id}`,
      type: 'not_booked',
      priority: 4,
      title: `📋 ${b.location} — טרם הוזמן`,
      subtitle: `${formatDay(b.check_in)} · ${b.area}`,
      color: 'text-apple-secondary',
      bookingId: b.id,
      url: b.booking_url,
    })
  }

  return items.sort((a, b) => a.priority - b.priority)
}

// ── Status filter ───────────────────────────────────────────────
type StatusFilter = 'all' | BookingStatus

// ── Main Page ────────────────────────────────────────────────────
export default function CampsitesPageV2() {
  const { bookings, updateBooking, confirmedCount, totalNights } = useCampsiteBookings()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const timeline = useMemo(() => buildTimeline(bookings), [bookings])
  const filteredBookings = useMemo(
    () => (statusFilter === 'all' ? bookings : bookings.filter((b) => b.status === statusFilter)),
    [bookings, statusFilter],
  )
  const groups = useMemo(() => groupBookings(filteredBookings), [filteredBookings])
  const actionItems = useMemo(() => buildActionItems(bookings), [bookings])

  const totalConfirmedCost = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'confirmed' && b.priority === 'primary')
        .reduce((sum, b) => sum + (b.cost ?? 0), 0),
    [bookings],
  )

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: bookings.filter((b) => b.priority === 'primary').length,
    }
    for (const b of bookings.filter((b) => b.priority === 'primary')) {
      counts[b.status] = (counts[b.status] || 0) + 1
    }
    return counts
  }, [bookings])

  const pct = totalNights > 0 ? Math.round((confirmedCount / totalNights) * 100) : 0

  const scrollToBooking = useCallback((id: string | null) => {
    if (!id) return
    document
      .getElementById(`booking-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 space-y-6">
      {/* ── Action Items — Planning Dashboard ────────── */}
      {actionItems.length > 0 && (
        <GlassCard elevation={2} padding="md">
          <h2 className="text-headline text-apple-primary dark:text-white mb-3">
            🎯 דורש טיפול ({actionItems.length})
          </h2>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  item.url ? window.open(item.url, '_blank') : scrollToBooking(item.bookingId)
                }
                className="w-full flex items-start gap-3 p-2.5 rounded-apple-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors text-right"
              >
                <div className="flex-1 min-w-0">
                  <p className={cn('text-subhead font-semibold', item.color)}>{item.title}</p>
                  <p className="text-caption text-apple-secondary mt-0.5">{item.subtitle}</p>
                </div>
                {item.url && <ExternalLink className="w-3.5 h-3.5 text-ios-blue shrink-0 mt-1" />}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── Summary Header ───────────────────────────── */}
      <GlassCard elevation={2} padding="md">
        <h2 className="text-title text-apple-primary dark:text-white mb-3">סיכום הזמנות לינה</h2>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className="bg-ios-green h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-subhead text-apple-secondary mb-3" dir="ltr">
          {confirmedCount}/{totalNights} ({pct}%)
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 text-subhead">
          <span className="text-apple-primary dark:text-white">
            <strong>{totalNights}</strong> לילות
          </span>
          <span className="text-ios-green">
            <strong>{confirmedCount}</strong> מאושר
          </span>
          {totalConfirmedCost > 0 && (
            <span className="text-apple-primary dark:text-white" dir="ltr">
              <strong>${totalConfirmedCost}</strong>
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {LEGEND.map((l) => (
            <span
              key={l.status}
              className="text-caption text-apple-secondary flex items-center gap-1"
            >
              {l.emoji} {STATUS_META[l.status].label}
            </span>
          ))}
        </div>
      </GlassCard>

      {/* ── Section 2: Mini Timeline Strip ───────────── */}
      <GlassCard padding="sm">
        <h3 className="text-headline text-apple-primary dark:text-white mb-2">ציר זמן</h3>
        <div className="overflow-x-auto -mx-3 px-3" dir="ltr">
          <div className="flex gap-1.5 min-w-max pb-1">
            {timeline.map((n) => {
              const bg =
                n.status === 'none'
                  ? 'bg-gray-100 dark:bg-gray-800 text-apple-secondary'
                  : cn(STATUS_META[n.status].bg, STATUS_META[n.status].text)
              return (
                <button
                  key={n.date}
                  onClick={() => scrollToBooking(n.bookingId)}
                  className={cn(
                    'flex flex-col items-center justify-center w-10 h-12 rounded-apple-sm text-center transition-transform hover:scale-110',
                    bg,
                    n.bookingId && 'cursor-pointer',
                    !n.bookingId && 'cursor-default opacity-60',
                  )}
                >
                  <span className="text-caption font-bold leading-none">{n.dayNum}</span>
                  {n.type && (
                    <span className="text-caption leading-none mt-0.5">
                      {TYPE_ICON[n.type]?.icon}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </GlassCard>

      {/* ── Status Filter Bar ────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          ['all', 'not_open', 'confirmed', 'pending', 'waitlist', 'cancelled'] as StatusFilter[]
        ).map((s) => {
          const count = statusCounts[s] || 0
          if (s !== 'all' && count === 0) return null
          const label = s === 'all' ? 'הכל' : STATUS_META[s].label
          const isActive = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold transition-colors',
                isActive
                  ? s === 'all'
                    ? 'bg-apple-primary dark:bg-white text-white dark:text-black'
                    : cn(STATUS_META[s].bg, STATUS_META[s].text)
                  : 'glass text-apple-secondary',
              )}
            >
              {label}
              <span className="text-caption opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Grouped Booking Cards ────────────────────── */}
      {groups.map((group) => (
        <section key={`${group.region}-${group.bookings[0].check_in}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-headline text-apple-primary dark:text-white">
              {REGION_EMOJI[group.region] || '📍'} {group.region}
            </h3>
            <span className="text-caption text-apple-secondary" dir="ltr">
              {group.dateRange} · {group.bookings.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.bookings.map((b) => (
              <BookingCard key={b.id} booking={b} onUpdate={updateBooking} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
