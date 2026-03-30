import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import type { ItineraryDay } from '@/lib/types'

interface NextStopCardProps {
  nextDay: ItineraryDay
  tripDayIndex: number | null
}

export function NextStopCard({ nextDay, tripDayIndex }: NextStopCardProps) {
  return (
    <Link to="/itinerary">
      <div
        className="rounded-apple-lg bg-white p-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-apple-sm bg-ios-orange/10">
              <MapPin className="h-4 w-4 text-ios-orange" strokeWidth={2} />
            </div>
            <div>
              <p className="text-body font-semibold text-passport-slate">
                {nextDay.city || nextDay.title}
              </p>
              <p className="text-caption text-apple-secondary">
                {tripDayIndex !== null ? `יום ${tripDayIndex + 1}` : 'יום 1'} — {nextDay.title}
              </p>
            </div>
          </div>
          <span className="text-caption text-apple-secondary font-medium">
            {nextDay.stops.length} עצירות
          </span>
        </div>
        {nextDay.stops.slice(0, 2).map((stop, i) => (
          <div key={stop.id || i} className="flex items-center gap-2 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-ios-orange shrink-0" />
            <span className="text-subhead text-apple-secondary truncate">{stop.title}</span>
            {stop.start_time && (
              <span className="text-caption text-apple-secondary ms-auto">{stop.start_time}</span>
            )}
          </div>
        ))}
        {nextDay.stops.length > 2 && (
          <p className="text-caption text-apple-secondary mt-1">
            +{nextDay.stops.length - 2} עצירות נוספות
          </p>
        )}
      </div>
    </Link>
  )
}
