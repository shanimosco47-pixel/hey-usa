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
    color: 'text-sage',
    bgColor: 'bg-sage/10',
  },
  drive: {
    icon: Car,
    label: 'נסיעה',
    color: 'text-sky',
    bgColor: 'bg-sky/10',
  },
  scenic: {
    icon: Eye,
    label: 'תצפית',
    color: 'text-gold-dark',
    bgColor: 'bg-gold/10',
  },
  food: {
    icon: Utensils,
    label: 'אוכל',
    color: 'text-terracotta',
    bgColor: 'bg-terracotta/10',
  },
  camp: {
    icon: Tent,
    label: 'לינה',
    color: 'text-sage',
    bgColor: 'bg-sage/10',
  },
  city: {
    icon: Building2,
    label: 'עיר',
    color: 'text-sky',
    bgColor: 'bg-sky/10',
  },
  activity: {
    icon: Star,
    label: 'פעילות',
    color: 'text-gold-dark',
    bgColor: 'bg-gold/10',
  },
  rest: {
    icon: Coffee,
    label: 'מנוחה',
    color: 'text-brown-light',
    bgColor: 'bg-brown/10',
  },
}

interface StopCardProps {
  stop: ItineraryStop
  index: number
}

export function StopCard({ stop, index }: StopCardProps) {
  const config = CATEGORY_CONFIG[stop.category ?? 'activity'] ?? CATEGORY_CONFIG.activity
  const Icon = config.icon

  const handleNavigate = () => {
    if (stop.lat && stop.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`,
        '_blank'
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
    <div className="rounded-xl border border-sand-dark bg-white/60 p-4 shadow-sm">
      {/* Header: Icon + Title + Category badge */}
      <div className="flex items-start gap-3">
        {/* Category icon circle */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
            config.bgColor
          )}
        >
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-brown">{stop.title}</h3>
              {stop.location && (
                <div className="mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-brown-light" />
                  <span className="truncate text-xs text-brown-light" dir="ltr">
                    {stop.location}
                  </span>
                </div>
              )}
            </div>

            {/* Stop number badge */}
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sand text-[10px] font-bold text-brown-light">
              {index + 1}
            </span>
          </div>

          {/* Time */}
          {timeRange && (
            <div className="mt-2 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-brown-light" />
              <span className="text-xs font-medium text-brown-light" dir="ltr">
                {timeRange}
              </span>
            </div>
          )}

          {/* Description */}
          {stop.description && (
            <p className="mt-2 text-xs leading-relaxed text-brown-light">
              {stop.description}
            </p>
          )}

          {/* Meta row: cost, booking */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {stop.cost_estimate != null && stop.cost_estimate > 0 && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold-dark">
                <DollarSign className="h-3 w-3" />
                ~${stop.cost_estimate}
              </span>
            )}

            {stop.booking_confirmation && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-sage/10 px-2 py-0.5 text-[11px] font-medium text-sage">
                <ExternalLink className="h-3 w-3" />
                {stop.booking_confirmation}
              </span>
            )}

            {/* Category label */}
            <span
              className={cn(
                'inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium',
                config.bgColor,
                config.color
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Notes */}
          {stop.notes && (
            <div className="mt-3 flex gap-2 rounded-lg bg-sand/60 p-2">
              <StickyNote className="mt-0.5 h-3 w-3 flex-shrink-0 text-gold-dark" />
              <p className="text-[11px] leading-relaxed text-brown-light">
                {stop.notes}
              </p>
            </div>
          )}

          {/* Navigate button */}
          {stop.lat && stop.lng && (
            <button
              onClick={handleNavigate}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-terracotta-light active:scale-95"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>נווט</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
