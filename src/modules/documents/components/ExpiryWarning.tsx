import { AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ExpiryWarningProps {
  expiryDate: string | undefined
  className?: string
}

const TRIP_START = new Date('2026-09-10')

export function ExpiryWarning({ expiryDate, className }: ExpiryWarningProps) {
  if (!expiryDate) return null

  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
  const expiresBeforeTrip = expiry < TRIP_START

  if (daysUntilExpiry < 0) {
    return (
      <div className={cn('flex items-center gap-1 rounded-apple-sm bg-ios-red/10 px-2 py-1', className)}>
        <AlertTriangle className="h-3.5 w-3.5 text-ios-red" />
        <span className="text-caption text-ios-red font-medium">פג תוקף!</span>
      </div>
    )
  }

  if (expiresBeforeTrip) {
    return (
      <div className={cn('flex items-center gap-1 rounded-apple-sm bg-ios-orange/10 px-2 py-1', className)}>
        <AlertTriangle className="h-3.5 w-3.5 text-ios-orange" />
        <span className="text-caption text-ios-orange font-medium">פג לפני הטיול! ({daysUntilExpiry} ימים)</span>
      </div>
    )
  }

  if (daysUntilExpiry <= 90) {
    return (
      <div className={cn('flex items-center gap-1 rounded-apple-sm bg-ios-orange/10 px-2 py-1', className)}>
        <Clock className="h-3.5 w-3.5 text-ios-orange" />
        <span className="text-caption text-ios-orange">תוקף: עוד {daysUntilExpiry} ימים</span>
      </div>
    )
  }

  return null
}
