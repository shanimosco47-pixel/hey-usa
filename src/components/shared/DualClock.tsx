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

export function DualClock({ usaTimezone = 'America/Denver' }: DualClockProps) {
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
    <div className="flex items-center gap-2 text-xs text-brown-light font-hebrew">
      <span className="flex items-center gap-1">
        <span role="img" aria-label="Israel">
          🇮🇱
        </span>
        <span>{israelTime}</span>
      </span>
      <span className="text-brown-light/50">|</span>
      <span className="flex items-center gap-1">
        <span role="img" aria-label="USA">
          🇺🇸
        </span>
        <span>{usaTime}</span>
      </span>
    </div>
  )
}
