import { memo, useState } from 'react'
import {
  Mountain,
  Car,
  Eye,
  Utensils,
  Tent,
  Building2,
  Star,
  Coffee,
  MapPin,
  Clock,
  DollarSign,
  StickyNote,
  ExternalLink,
  Navigation,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import type { ItineraryStop } from '@/types'
import { cn } from '@/lib/cn'

const CATEGORY_CONFIG: Record<
  string,
  { icon: typeof Mountain; label: string; color: string; bgColor: string }
> = {
  hike: {
    icon: Mountain,
    label: 'טיול',
    color: 'text-ios-green',
    bgColor: 'bg-ios-green/10',
  },
  drive: {
    icon: Car,
    label: 'נסיעה',
    color: 'text-ios-teal',
    bgColor: 'bg-ios-teal/10',
  },
  scenic: {
    icon: Eye,
    label: 'תצפית',
    color: 'text-ios-orange',
    bgColor: 'bg-ios-orange/10',
  },
  food: {
    icon: Utensils,
    label: 'אוכל',
    color: 'text-ios-red',
    bgColor: 'bg-ios-red/10',
  },
  camp: {
    icon: Tent,
    label: 'לינה',
    color: 'text-ios-green',
    bgColor: 'bg-ios-green/10',
  },
  city: {
    icon: Building2,
    label: 'עיר',
    color: 'text-ios-teal',
    bgColor: 'bg-ios-teal/10',
  },
  activity: {
    icon: Star,
    label: 'פעילות',
    color: 'text-ios-orange',
    bgColor: 'bg-ios-orange/10',
  },
  rest: {
    icon: Coffee,
    label: 'מנוחה',
    color: 'text-apple-secondary',
    bgColor: 'bg-black/[0.06]',
  },
}

interface StopCardProps {
  stop: ItineraryStop
  index: number
  onUpdateTime?: (stopId: string, start_time: string, end_time: string) => void
}

export const StopCard = memo(function StopCard({ stop, index, onUpdateTime }: StopCardProps) {
  const [editingTime, setEditingTime] = useState(false)
  const [startTime, setStartTime] = useState(stop.start_time || '')
  const [endTime, setEndTime] = useState(stop.end_time || '')
  const config = CATEGORY_CONFIG[stop.category ?? 'activity'] ?? CATEGORY_CONFIG.activity
  const Icon = config.icon

  const handleNavigate = () => {
    if (stop.lat && stop.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`,
        '_blank',
      )
    }
  }

  const timeRange =
    stop.start_time && stop.end_time
      ? `${stop.start_time} - ${stop.end_time}`
      : stop.start_time
        ? `${stop.start_time}`
        : null

  return (
    <div className="glass rounded-apple-lg p-4 shadow-glass">
      {/* Header: Icon + Title + Category badge */}
      <div className="flex items-start gap-3">
        {/* Category icon circle */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-apple',
            config.bgColor,
          )}
        >
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-subhead font-bold text-apple-primary">{stop.title}</h3>
              {stop.location && (
                <div className="mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-apple-secondary" />
                  <span className="truncate text-xs text-apple-secondary" dir="ltr">
                    {stop.location}
                  </span>
                </div>
              )}
            </div>

            {/* Stop number badge */}
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-caption font-bold text-apple-secondary">
              {index + 1}
            </span>
          </div>

          {/* Time — editable */}
          <div className="mt-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-apple-secondary" />
            {editingTime ? (
              <div className="flex items-center gap-1.5" dir="ltr">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-apple-sm border border-black/10 bg-white px-1.5 py-0.5 text-xs font-medium text-apple-primary focus:border-ios-blue focus:outline-none"
                />
                <span className="text-xs text-apple-secondary">—</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-apple-sm border border-black/10 bg-white px-1.5 py-0.5 text-xs font-medium text-apple-primary focus:border-ios-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTime?.(stop.id, startTime, endTime)
                    setEditingTime(false)
                  }}
                  className="rounded-apple-sm bg-ios-green p-0.5 text-white"
                  aria-label="שמור"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartTime(stop.start_time || '')
                    setEndTime(stop.end_time || '')
                    setEditingTime(false)
                  }}
                  className="rounded-apple-sm bg-black/5 p-0.5 text-apple-secondary"
                  aria-label="ביטול"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingTime(true)}
                className="group flex items-center gap-1 text-xs font-medium text-apple-secondary hover:text-ios-blue transition-colors"
              >
                <span dir="ltr">{timeRange || 'הגדר שעות'}</span>
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Description */}
          {stop.description && (
            <p className="mt-2 text-xs leading-relaxed text-apple-secondary" dir="auto">
              {stop.description}
            </p>
          )}

          {/* Meta row: cost, booking */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {stop.cost_estimate != null && stop.cost_estimate > 0 && (
              <span className="inline-flex items-center gap-1 rounded-apple-sm bg-ios-orange/10 px-2 py-0.5 text-caption font-medium text-ios-orange">
                <DollarSign className="h-3 w-3" />
                ~${stop.cost_estimate}
              </span>
            )}

            {stop.booking_confirmation && (
              <span className="inline-flex items-center gap-1 rounded-apple-sm bg-ios-green/10 px-2 py-0.5 text-caption font-medium text-ios-green">
                <ExternalLink className="h-3 w-3" />
                {stop.booking_confirmation}
              </span>
            )}

            {/* Category label */}
            <span
              className={cn(
                'inline-flex items-center rounded-apple-sm px-2 py-0.5 text-caption font-medium',
                config.bgColor,
                config.color,
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Notes */}
          {stop.notes && (
            <div className="mt-3 flex gap-2 rounded-apple-sm bg-black/[0.03] p-2">
              <StickyNote className="mt-0.5 h-3 w-3 flex-shrink-0 text-ios-orange" />
              <p className="text-caption leading-relaxed text-apple-secondary" dir="auto">
                {stop.notes}
              </p>
            </div>
          )}

          {/* Navigate button */}
          {stop.lat && stop.lng && (
            <button
              onClick={handleNavigate}
              className="mt-3 inline-flex items-center gap-1.5 rounded-apple bg-ios-blue px-3 py-1.5 text-xs font-medium text-white shadow-glass transition-colors hover:bg-ios-blue/80 active:scale-95"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>נווט</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
