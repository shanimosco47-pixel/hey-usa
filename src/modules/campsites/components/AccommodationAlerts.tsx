// src/modules/campsites/components/AccommodationAlerts.tsx
import { BedDouble, CalendarX } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface AlertCardProps {
  icon: ReactNode
  title: string
  variant: 'warning' | 'error'
  children: ReactNode
}

function AlertCard({ icon, title, variant, children }: AlertCardProps) {
  const colors =
    variant === 'error' ? 'border-ios-red/20 bg-ios-red/5' : 'border-ios-orange/20 bg-ios-orange/5'

  return (
    <div className={cn('glass rounded-apple-lg p-4 border', colors)}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-headline text-apple-primary">{title}</h4>
      </div>
      {children}
    </div>
  )
}

interface AccommodationAlertsProps {
  missingNights: Array<{ date: string; dayLabel: string }>
  doubleBookings: Array<{ date: string; bookings: string[] }>
}

export function AccommodationAlerts({ missingNights, doubleBookings }: AccommodationAlertsProps) {
  if (missingNights.length === 0 && doubleBookings.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {missingNights.length > 0 && (
        <AlertCard
          icon={<CalendarX className="h-5 w-5 text-ios-orange" />}
          title={`${missingNights.length} לילות ללא לינה`}
          variant="warning"
        >
          <div className="flex flex-wrap gap-2">
            {missingNights.map((gap) => (
              <span
                key={gap.date}
                className="text-caption bg-ios-orange/10 rounded-apple-sm px-2 py-1 text-ios-orange"
              >
                {gap.dayLabel} ({gap.date.slice(5)})
              </span>
            ))}
          </div>
        </AlertCard>
      )}

      {doubleBookings.length > 0 && (
        <AlertCard
          icon={<BedDouble className="h-5 w-5 text-ios-red" />}
          title={`${doubleBookings.length} הזמנות כפולות`}
          variant="error"
        >
          <div className="flex flex-col gap-1">
            {doubleBookings.map((db) => (
              <p key={db.date} className="text-caption text-apple-primary">
                {new Date(db.date + 'T12:00:00').toLocaleDateString('he-IL', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                })}
                : {db.bookings.join(' + ')}
              </p>
            ))}
          </div>
        </AlertCard>
      )}
    </div>
  )
}
