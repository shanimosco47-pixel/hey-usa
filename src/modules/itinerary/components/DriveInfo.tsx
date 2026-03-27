import { Car, Clock, Route } from 'lucide-react'
import type { DriveTime } from '@/data/driveTimes'
import { formatDuration, formatDistance } from '@/data/driveTimes'

interface DriveInfoProps {
  driveTime?: DriveTime
}

export function DriveInfo({ driveTime }: DriveInfoProps) {
  // No data — render the same simple dashed divider as DriveSegment
  if (!driveTime || (driveTime.durationMinutes === 0 && driveTime.distanceKm === 0)) {
    // Still show local tips if available
    if (driveTime && driveTime.tips.length > 0) {
      return (
        <div className="mx-0 mb-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 rounded-apple bg-ios-teal/8 px-3 py-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ios-teal/15">
              <Car className="h-3.5 w-3.5 text-ios-teal" />
            </div>
            <span className="text-[11px] text-apple-secondary leading-snug">
              {driveTime.tips[0]}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  const duration = formatDuration(driveTime.durationMinutes)
  const distance = formatDistance(driveTime.distanceKm)
  const tip = driveTime.tips[0] ?? null

  return (
    <div className="mb-3 flex flex-col gap-1.5">
      {/* Main pill */}
      <div className="flex items-center gap-2 rounded-apple border border-ios-teal/20 bg-ios-teal/8 px-3 py-2.5">
        {/* Car icon */}
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ios-teal/15">
          <Car className="h-3.5 w-3.5 text-ios-teal" />
        </div>

        {/* Stats */}
        <div className="flex flex-1 items-center gap-3 min-w-0" dir="rtl">
          {/* Duration */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-ios-teal/70 flex-shrink-0" />
            <span className="text-[12px] font-medium text-ios-teal">{duration}</span>
          </div>

          {/* Separator */}
          <span className="text-ios-teal/30 text-xs">·</span>

          {/* Distance */}
          <div className="flex items-center gap-1">
            <Route className="h-3 w-3 text-ios-teal/70 flex-shrink-0" />
            <span className="text-[12px] text-apple-secondary" dir="ltr">{distance}</span>
          </div>
        </div>

        {/* From → To */}
        <div className="flex-shrink-0 text-[11px] text-apple-secondary/60 hidden sm:block" dir="ltr">
          {driveTime.from} → {driveTime.to}
        </div>
      </div>

      {/* Optional tip */}
      {tip && (
        <div className="flex items-start gap-2 px-1">
          <span className="mt-0.5 text-[10px] text-ios-teal/60">💡</span>
          <span className="text-[11px] leading-relaxed text-apple-secondary">{tip}</span>
        </div>
      )}
    </div>
  )
}
