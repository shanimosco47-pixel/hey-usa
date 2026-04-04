import { useState, useCallback, useRef, useEffect } from 'react'
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps'
import { Navigation, X, ChevronDown, ChevronUp, ExternalLink, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ITINERARY_DAYS } from '@/data/itinerary'

interface DirectionStop {
  label: string
  lat: number
  lng: number
}

function buildStopList(): DirectionStop[] {
  const stops: DirectionStop[] = []
  ITINERARY_DAYS.forEach((day, idx) => {
    day.stops.forEach((stop) => {
      if (stop.lat && stop.lng) {
        stops.push({
          label: `יום ${idx + 1}: ${stop.title}`,
          lat: stop.lat,
          lng: stop.lng,
        })
      }
    })
  })
  return stops
}

export function DirectionsPanel() {
  const map = useMap()
  const routesLib = useMapsLibrary('routes')

  const [isOpen, setIsOpen] = useState(false)
  const [origin, setOrigin] = useState<DirectionStop | null>(null)
  const [destination, setDestination] = useState<DirectionStop | null>(null)
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null)
  const [stepsOpen, setStepsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)

  const stops = useRef(buildStopList()).current

  // Initialize services
  useEffect(() => {
    if (!routesLib || !map) return
    directionsServiceRef.current = new routesLib.DirectionsService()
    rendererRef.current = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#007AFF',
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    })

    return () => {
      rendererRef.current?.setMap(null)
    }
  }, [routesLib, map])

  const calculateRoute = useCallback(async () => {
    if (!directionsServiceRef.current || !rendererRef.current || !origin || !destination) return

    setLoading(true)
    setError(null)
    setRoute(null)

    try {
      const result = await directionsServiceRef.current.route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        language: 'he',
      })

      setRoute(result)
      rendererRef.current.setDirections(result)
      setStepsOpen(false)
    } catch {
      setError('לא ניתן לחשב מסלול. נסו שוב.')
      rendererRef.current.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult)
    } finally {
      setLoading(false)
    }
  }, [origin, destination])

  const clearRoute = useCallback(() => {
    setRoute(null)
    setOrigin(null)
    setDestination(null)
    setError(null)
    setStepsOpen(false)
    rendererRef.current?.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult)
  }, [])

  const openGoogleMapsNav = useCallback(() => {
    if (!origin || !destination) return
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
    window.open(url, '_blank')
  }, [origin, destination])

  const leg = route?.routes[0]?.legs[0]

  return (
    <div className="absolute bottom-2 start-2 end-2 z-10" dir="rtl">
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="glass-float flex items-center gap-2 rounded-apple px-4 py-3 min-h-[44px] text-subhead font-medium text-apple-primary hover:bg-black/5 transition-colors"
        >
          <Navigation className="h-4 w-4 text-ios-blue" />
          ניווט בין נקודות
        </button>
      )}

      {/* Directions panel */}
      {isOpen && (
        <div className="glass-float rounded-apple-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
            <span className="text-subhead font-semibold text-apple-primary flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-ios-blue" />
              ניווט
            </span>
            <button
              onClick={() => {
                setIsOpen(false)
                clearRoute()
              }}
              className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-4 w-4 text-apple-secondary" />
            </button>
          </div>

          {/* Origin & Destination selectors */}
          <div className="px-3 py-2 space-y-2">
            <StopSelector
              label="מאיפה"
              value={origin}
              stops={stops}
              onChange={setOrigin}
              accentColor="text-ios-green"
            />
            <StopSelector
              label="לאן"
              value={destination}
              stops={stops}
              onChange={setDestination}
              accentColor="text-ios-red"
            />

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={calculateRoute}
                disabled={!origin || !destination || loading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-apple py-2.5 min-h-[44px]',
                  'text-subhead font-medium transition-colors',
                  origin && destination && !loading
                    ? 'bg-ios-blue text-white active:bg-ios-blue/80'
                    : 'bg-black/5 text-apple-tertiary cursor-not-allowed',
                )}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {loading ? 'מחשב...' : 'חשב מסלול'}
              </button>
              {route && (
                <button
                  onClick={clearRoute}
                  className="rounded-apple px-3 py-2.5 min-h-[44px] bg-black/5 text-apple-secondary text-subhead font-medium"
                >
                  נקה
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-3 mb-2 rounded-apple bg-ios-red/10 px-3 py-2 text-caption text-ios-red">
              {error}
            </div>
          )}

          {/* Route summary */}
          {leg && (
            <div className="border-t border-black/5 px-3 py-2 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3" dir="ltr">
                  <span className="text-headline font-bold text-apple-primary">
                    {leg.duration?.text}
                  </span>
                  <span className="text-subhead text-apple-secondary">{leg.distance?.text}</span>
                </div>
                <button
                  onClick={openGoogleMapsNav}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3 py-1.5 min-h-[44px]',
                    'bg-ios-green text-white text-caption font-semibold',
                    'active:bg-ios-green/80 transition-colors',
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                  נווט בגוגל
                </button>
              </div>

              {/* Step-by-step toggle */}
              <button
                onClick={() => setStepsOpen(!stepsOpen)}
                className="flex items-center gap-1 text-caption text-ios-blue font-medium py-1"
              >
                {stepsOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {stepsOpen ? 'הסתר הנחיות' : 'הצג הנחיות נסיעה'}
              </button>

              {/* Steps */}
              {stepsOpen && leg.steps && (
                <div className="max-h-[200px] overflow-y-auto space-y-1 pb-1">
                  {leg.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-apple-sm bg-black/[0.03] px-2.5 py-2"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ios-blue/10 text-[10px] font-bold text-ios-blue mt-0.5">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-caption text-apple-primary leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: step.instructions }}
                        />
                        <div className="flex items-center gap-2 mt-0.5" dir="ltr">
                          <span className="text-[10px] text-apple-tertiary">
                            {step.distance?.text}
                          </span>
                          <span className="text-[10px] text-apple-tertiary">
                            {step.duration?.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-2.5 py-2 text-caption text-ios-green font-medium">
                    <CornerDownLeft className="h-3 w-3" />
                    הגעתם ליעד!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Stop Selector ──────────────────────────────────────────

function StopSelector({
  label,
  value,
  stops,
  onChange,
  accentColor,
}: {
  label: string
  value: DirectionStop | null
  stops: DirectionStop[]
  onChange: (stop: DirectionStop | null) => void
  accentColor: string
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const filtered = filter ? stops.filter((s) => s.label.includes(filter)) : stops

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-2 rounded-apple-sm border px-3 py-2 min-h-[44px] cursor-pointer',
          'transition-colors',
          open ? 'border-ios-blue bg-ios-blue/5' : 'border-black/10 bg-black/[0.02]',
        )}
        onClick={() => setOpen(!open)}
      >
        <span className={cn('text-caption font-semibold shrink-0', accentColor)}>{label}</span>
        <span className="text-subhead text-apple-primary truncate flex-1">
          {value?.label || 'בחר עצירה...'}
        </span>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
              setFilter('')
            }}
            className="p-1"
          >
            <X className="h-3 w-3 text-apple-tertiary" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute start-0 end-0 bottom-full mb-1 z-20 glass-float rounded-apple overflow-hidden max-h-[200px] flex flex-col">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="חפש עצירה..."
            className="bg-transparent px-3 py-2 text-caption outline-none border-b border-black/5"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className="overflow-y-auto">
            {filtered.map((stop, i) => (
              <button
                key={i}
                className="w-full text-right px-3 py-2 min-h-[44px] text-caption text-apple-primary hover:bg-black/5 transition-colors flex items-center"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(stop)
                  setOpen(false)
                  setFilter('')
                }}
              >
                {stop.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-caption text-apple-tertiary">אין תוצאות</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
