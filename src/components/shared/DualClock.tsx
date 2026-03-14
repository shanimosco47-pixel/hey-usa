import { useState, useEffect } from 'react'

interface DualClockProps {
  usaTimezone?: string
}

function formatTime(timezone: string): string {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(new Date())
}

export function DualClock({ usaTimezone = 'America/Los_Angeles' }: DualClockProps) {
  const [israelTime, setIsraelTime] = useState(() =>
    formatTime('Asia/Jerusalem'),
  )
  const [usaTime, setUsaTime] = useState(() => formatTime(usaTimezone))

  useEffect(() => {
    function updateTimes() {
      setIsraelTime(formatTime('Asia/Jerusalem'))
      setUsaTime(formatTime(usaTimezone))
    }

    updateTimes()
    const interval = setInterval(updateTimes, 60_000)

    return () => clearInterval(interval)
  }, [usaTimezone])

  return (
    <div className="flex items-center gap-2.5 text-[12px] tabular-nums text-apple-secondary">
      <span className="flex items-center gap-1">
        <span role="img" aria-label="Israel" className="text-[11px]">
          🇮🇱
        </span>
        <span className="font-medium">{israelTime}</span>
        <span className="text-[10px] text-apple-tertiary">IL</span>
      </span>
      <span className="text-apple-tertiary/50">|</span>
      <span className="flex items-center gap-1">
        <span role="img" aria-label="USA" className="text-[11px]">
          🇺🇸
        </span>
        <span className="font-medium">{usaTime}</span>
        <span className="text-[10px] text-apple-tertiary">PT</span>
      </span>
    </div>
  )
}
