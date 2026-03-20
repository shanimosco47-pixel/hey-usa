import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { CampsiteNight, CampsiteOption } from '@/lib/types'
import OptionRow from './OptionRow'

const STATUS_STYLES: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  searching: { label: 'מחפשים', icon: Search, cls: 'text-orange-600 bg-orange-50' },
  booked: { label: 'הוזמן!', icon: CheckCircle2, cls: 'text-green-600 bg-green-50' },
  skipped: { label: 'דילגנו', icon: AlertTriangle, cls: 'text-gray-400 bg-gray-50' },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', weekday: 'short' })
}

function getUrgencyBanner(options: CampsiteOption[]): { text: string; cls: string } | null {
  const now = new Date()
  for (const o of options) {
    if (o.booking_opens_at && o.booking_status === 'not_yet_open') {
      const opens = new Date(o.booking_opens_at)
      const diffDays = Math.ceil((opens.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 2) return { text: `נפתח בעוד ${diffDays <= 0 ? 'היום!' : `${diffDays} ימים`}`, cls: 'bg-red-500 text-white' }
      if (diffDays <= 7) return { text: `נפתח בעוד ${diffDays} ימים`, cls: 'bg-orange-500 text-white' }
    }
    if (o.booking_status === 'open' && (o.platform === 'recreation_gov' || o.platform === 'reserve_america')) {
      return { text: 'פתוח — הזמינו עכשיו!', cls: 'bg-orange-500 text-white' }
    }
  }
  return null
}

interface NightCardProps {
  night: CampsiteNight
  onUpdateOption: (id: string, changes: Partial<CampsiteOption>) => void
  onDeleteOption: (id: string) => void
  onBookOption: (nightId: string, optionId: string) => void
  onAddOption: (nightId: string) => void
}

export default function NightCard({
  night,
  onUpdateOption,
  onDeleteOption,
  onBookOption,
  onAddOption,
}: NightCardProps) {
  const [expanded, setExpanded] = useState(night.status === 'searching')
  const options = night.options || []
  const style = STATUS_STYLES[night.status] || STATUS_STYLES.searching
  const StatusIcon = style.icon
  const urgency = night.status !== 'booked' ? getUrgencyBanner(options) : null

  return (
    <motion.div
      layout
      className={cn(
        'rounded-2xl border bg-white overflow-hidden',
        night.status === 'booked' && 'border-green-200',
      )}
    >
      {/* Urgency banner */}
      {urgency && (
        <div className={cn('px-3 py-1.5 text-xs font-bold text-center', urgency.cls)}>
          {urgency.text}
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-right"
      >
        {/* Date */}
        <div className="flex flex-col items-center shrink-0 w-14">
          <CalendarDays className="h-4 w-4 text-apple-tertiary mb-0.5" />
          <span className="text-[11px] font-medium text-apple-secondary">
            {formatDate(night.check_in_date)}
          </span>
        </div>

        {/* Location + status */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-apple-tertiary shrink-0" />
            <span className="font-semibold text-sm truncate">{night.location_name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', style.cls)}>
              <StatusIcon className="h-3 w-3" />
              {style.label}
            </span>
            <span className="text-[10px] text-apple-tertiary">
              {options.length} אפשרויות
            </span>
          </div>
        </div>

        {/* Expand */}
        <div className="shrink-0 text-apple-tertiary">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Notes */}
      {night.notes && expanded && (
        <div className="mx-4 mb-2 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          {night.notes}
        </div>
      )}

      {/* Options list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {options
                .sort((a, b) => a.priority - b.priority)
                .map((option) => (
                  <OptionRow
                    key={option.id}
                    option={option}
                    onUpdate={onUpdateOption}
                    onDelete={onDeleteOption}
                    onBook={(optionId) => onBookOption(night.id, optionId)}
                  />
                ))}

              {/* Add option button */}
              <button
                onClick={() => onAddOption(night.id)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 py-2.5 text-xs text-apple-tertiary hover:border-ios-blue hover:text-ios-blue transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                הוסף אפשרות
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
