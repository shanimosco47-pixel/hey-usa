import { useState, useEffect } from 'react'
import { WifiOff, X } from 'lucide-react'
import { cn } from '@/lib/cn'

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setDismissed(false)
    }
  }, [isOnline])

  if (isOnline || dismissed) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-4 py-2',
        'glass border-b border-ios-orange/30',
        'text-apple-primary text-sm',
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0 text-ios-orange" />
        <span>אופליין - השינויים יסונכרנו כשיחזור חיבור</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full p-1 hover:bg-black/[0.04] transition-colors"
        aria-label="סגור התראה"
      >
        <X className="h-3.5 w-3.5 text-apple-secondary" />
      </button>
    </div>
  )
}
