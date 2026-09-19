import { useCallback, useEffect, useRef, useState } from 'react'
import { AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { motion, AnimatePresence } from 'framer-motion'
import { LocateFixed, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

interface CurrentPosition {
  lat: number
  lng: number
  accuracy: number
}

const GEO_ERROR_MESSAGES: Record<number, string> = {
  1: 'אין הרשאה לשימוש במיקום. אפשר גישה למיקום בהגדרות הדפדפן',
  2: 'לא הצלחנו לאתר את המיקום שלך',
  3: 'איתור המיקום ארך זמן רב מדי, נסו שוב',
}

/**
 * Locates the user and shows them on the map: a blue dot plus an accuracy
 * circle. Must render inside <Map> — it relies on the map instance.
 */
export function CurrentLocationButton() {
  const map = useMap()
  const mapsLib = useMapsLibrary('maps')
  const [position, setPosition] = useState<CurrentPosition | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accuracyCircle = useRef<google.maps.Circle | null>(null)

  // Accuracy circle lives on the map instance directly — it scales with zoom,
  // which a DOM overlay cannot do
  useEffect(() => {
    if (!map || !mapsLib || !position) return
    const circle = new mapsLib.Circle({
      map,
      center: { lat: position.lat, lng: position.lng },
      radius: position.accuracy,
      strokeColor: '#007AFF',
      strokeOpacity: 0.4,
      strokeWeight: 1,
      fillColor: '#007AFF',
      fillOpacity: 0.12,
      clickable: false,
    })
    accuracyCircle.current = circle
    return () => {
      circle.setMap(null)
      accuracyCircle.current = null
    }
  }, [map, mapsLib, position])

  // Auto-dismiss the error toast
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(timer)
  }, [error])

  const handleLocate = useCallback(() => {
    if (!map) return
    if (!('geolocation' in navigator)) {
      setError('הדפדפן שלך לא תומך באיתור מיקום')
      return
    }
    setError(null)
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        setPosition(next)
        setIsLocating(false)
        map.panTo({ lat: next.lat, lng: next.lng })
        const zoom = map.getZoom() ?? 5
        if (zoom < 13) map.setZoom(13)
      },
      (err) => {
        setIsLocating(false)
        setError(GEO_ERROR_MESSAGES[err.code] ?? 'לא הצלחנו לאתר את המיקום שלך')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }, [map])

  return (
    <>
      {position && (
        <AdvancedMarker
          position={{ lat: position.lat, lng: position.lng }}
          title="המיקום שלי"
          zIndex={20}
        >
          <div className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-ios-blue/40" />
            <span className="h-4 w-4 rounded-full border-2 border-white bg-ios-blue shadow-glass-float" />
          </div>
        </AdvancedMarker>
      )}

      <button
        onClick={handleLocate}
        disabled={isLocating}
        aria-label="הצג את המיקום הנוכחי שלי במפה"
        className={cn(
          'absolute bottom-32 end-3 z-10 glass-float flex h-11 w-11 items-center justify-center rounded-apple transition-colors hover:bg-black/5 disabled:opacity-60',
          position && 'text-ios-blue',
          !position && 'text-apple-primary',
        )}
      >
        {isLocating ? (
          <Loader2 className="h-5 w-5 animate-spin text-ios-blue" />
        ) : (
          <LocateFixed className="h-5 w-5" />
        )}
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="absolute bottom-44 start-1/2 -translate-x-1/2 z-30 glass-float rounded-apple px-4 py-2.5 text-subhead font-medium text-apple-primary whitespace-nowrap"
            dir="rtl"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
