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

  // Reset dismissed state when going offline again
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
        'bg-gold/90 text-brown font-hebrew text-sm',
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>אופליין - השינויים יסונכרנו כשיחזור חיבור</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 hover:bg-gold-dark/20 transition-colors"
        aria-label="סגור התראה"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
