import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  Plug,
  Clock,
  Check,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import type { CampsiteOption, BookingStatus } from '@/lib/types'

const PLATFORM_LABELS: Record<string, string> = {
  recreation_gov: 'Recreation.gov',
  reserve_america: 'ReserveAmerica',
  private: 'פרטי',
  other: 'אחר',
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  not_yet_open: { label: 'טרם נפתח', color: 'bg-gray-100 text-gray-600', icon: Clock },
  open: { label: 'פתוח להזמנה', color: 'bg-orange-100 text-orange-700', icon: Zap },
  booked: { label: 'הוזמן!', color: 'bg-green-100 text-green-700', icon: Check },
  sold_out: { label: 'אזל', color: 'bg-red-100 text-red-600', icon: XCircle },
  skipped: { label: 'דילגנו', color: 'bg-gray-100 text-gray-400', icon: XCircle },
}

function getCountdownText(dateStr: string): string {
  const now = new Date()
  const target = new Date(dateStr)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return 'כבר נפתח!'
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `נפתח בעוד ${days} ימים`
  return `נפתח בעוד ${hours} שעות`
}

interface OptionRowProps {
  option: CampsiteOption
  onUpdate: (id: string, changes: Partial<CampsiteOption>) => void
  onDelete: (id: string) => void
  onBook: (optionId: string) => void
}

export default function OptionRow({ option, onUpdate, onDelete, onBook }: OptionRowProps) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[option.booking_status]
  const StatusIcon = status.icon

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border bg-white p-3',
        option.booking_status === 'booked' && 'border-green-300 bg-green-50/30',
        option.priority === 1 && option.booking_status !== 'booked' && 'border-ios-blue/30',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority badge */}
        {option.priority > 0 && option.priority <= 3 && (
          <div className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
            option.priority === 1 ? 'bg-ios-blue' : option.priority === 2 ? 'bg-gray-400' : 'bg-gray-300',
          )}>
            {option.priority}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{option.name}</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>

          {/* Platform + price */}
          <div className="flex items-center gap-2 mt-1 text-xs text-apple-secondary">
            {option.platform && <span>{PLATFORM_LABELS[option.platform] || option.platform}</span>}
            {option.price_per_night && <span>· ${option.price_per_night}/לילה</span>}
            {option.booking_opens_at && option.booking_status === 'not_yet_open' && (
              <span className="text-orange-600 font-medium">· {getCountdownText(option.booking_opens_at)}</span>
            )}
          </div>

          {/* Star rating */}
          <div className="flex items-center gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onUpdate(option.id, { family_rating: star === option.family_rating ? undefined : star })}
                className="p-0"
              >
                <Star
                  className={cn(
                    'h-4 w-4 transition-colors',
                    star <= (option.family_rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-200',
                  )}
                />
              </button>
            ))}
          </div>

          {/* Expanded details */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 space-y-1 text-xs text-apple-secondary"
            >
              {option.hookups && (
                <div className="flex items-center gap-1">
                  <Plug className="h-3 w-3" />
                  <span>חיבורים: {option.hookups === 'full' ? 'מלא' : option.hookups === 'partial' ? 'חלקי' : 'ללא'}</span>
                </div>
              )}
              {option.max_rv_length && (
                <div>אורך מקסימלי: {option.max_rv_length} רגל</div>
              )}
              {option.notes && (
                <div className="bg-yellow-50 rounded-lg p-2 text-yellow-800">{option.notes}</div>
              )}
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {option.platform_url && (
            <a
              href={option.platform_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-ios-blue px-2.5 py-1 text-[11px] font-medium text-white hover:bg-ios-blue/90"
            >
              <ExternalLink className="h-3 w-3" />
              הזמן
            </a>
          )}
          {option.booking_status === 'open' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-[11px] text-green-600 h-6 px-2"
              onClick={() => onBook(option.id)}
            >
              <Check className="h-3 w-3 ml-1" />
              סמן כמוזמן
            </Button>
          )}
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded(!expanded)} className="p-1 text-apple-tertiary hover:text-apple-secondary">
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => onDelete(option.id)} className="p-1 text-apple-tertiary hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
