import { useState, useCallback, useRef, useEffect } from 'react'
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Plus,
  Route,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { ITINERARY_DAYS } from '@/data/itinerary'

// Build flat stop list with day labels for the selector
export interface StopOption {
  label: string
  lat: number
  lng: number
  dayIndex: number
  title: string
  isCustomWaypoint?: boolean
}

interface DrivingRoutePlannerProps {
  selectedDay: number | null
  isDrivingMode: boolean
  onToggleDrivingMode: () => void
  selectedStops: StopOption[]
  onSelectedStopsChange: (stops: StopOption[]) => void
}

function buildStopOptions(): StopOption[] {
  const opts: StopOption[] = []
  ITINERARY_DAYS.forEach((day, idx) => {
    day.stops.forEach((stop) => {
      if (stop.lat && stop.lng) {
        opts.push({
          label: `יום ${idx + 1}: ${stop.title}`,
          lat: stop.lat,
          lng: stop.lng,
          dayIndex: idx,
          title: stop.title,
        })
      }
    })
  })
  return opts
}

const ALL_STOP_OPTIONS = buildStopOptions()

// ─── DrivingRoutePlanner ──────────────────────────────────────

export function DrivingRoutePlanner({
  selectedDay,
  isDrivingMode,
  onToggleDrivingMode,
  selectedStops,
  onSelectedStopsChange,
}: DrivingRoutePlannerProps) {
  const map = useMap()
  const routesLib = useMapsLibrary('routes')
  const [routeResult, setRouteResult] = useState<google.maps.DirectionsResult | null>(null)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avoidHighways, setAvoidHighways] = useState(false)
  const [avoidTolls, setAvoidTolls] = useState(false)
  const [legDetailsOpen, setLegDetailsOpen] = useState(false)
  const [addStopOpen, setAddStopOpen] = useState(false)
  const [addStopFilter, setAddStopFilter] = useState('')

  const serviceRef = useRef<google.maps.DirectionsService | null>(null)
  // Primary renderer + alt renderers
  const primaryRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const altRenderersRef = useRef<google.maps.DirectionsRenderer[]>([])

  // Initialize DirectionsService
  useEffect(() => {
    if (!routesLib || !map) return
    serviceRef.current = new routesLib.DirectionsService()
    primaryRendererRef.current = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#007AFF',
        strokeWeight: 6,
        strokeOpacity: 1,
      },
    })
    return () => {
      primaryRendererRef.current?.setMap(null)
      altRenderersRef.current.forEach((r) => r.setMap(null))
    }
  }, [routesLib, map])

  // Clear alt renderers helper
  const clearAltRenderers = useCallback(() => {
    altRenderersRef.current.forEach((r) => r.setMap(null))
    altRenderersRef.current = []
  }, [])

  // Clear everything
  const clearRoute = useCallback(() => {
    setRouteResult(null)
    setSelectedRouteIndex(0)
    setError(null)
    setLegDetailsOpen(false)
    primaryRendererRef.current?.setDirections({
      routes: [],
    } as unknown as google.maps.DirectionsResult)
    clearAltRenderers()
  }, [clearAltRenderers])

  // When driving mode closes, clear route
  useEffect(() => {
    if (!isDrivingMode) {
      clearRoute()
      onSelectedStopsChange([])
    }
  }, [isDrivingMode, clearRoute, onSelectedStopsChange])

  // Calculate route
  const calculateRoute = useCallback(async () => {
    if (!serviceRef.current || selectedStops.length < 2) return
    setIsCalculating(true)
    setError(null)
    setRouteResult(null)
    setSelectedRouteIndex(0)
    clearAltRenderers()

    const first = selectedStops[0]
    const last = selectedStops[selectedStops.length - 1]
    const waypoints = selectedStops.slice(1, -1).map((s) => ({
      location: { lat: s.lat, lng: s.lng } as google.maps.LatLngLiteral,
      stopover: true,
    }))

    try {
      const result = await serviceRef.current.route({
        origin: { lat: first.lat, lng: first.lng },
        destination: { lat: last.lat, lng: last.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        language: 'he',
        avoidHighways,
        avoidTolls,
      } as google.maps.DirectionsRequest)

      setRouteResult(result)

      // Render primary route
      if (primaryRendererRef.current && result.routes.length > 0) {
        primaryRendererRef.current.setDirections(result)
        primaryRendererRef.current.setRouteIndex(0)
      }

      // Render alt routes with muted style
      if (routesLib && map && result.routes.length > 1) {
        for (let i = 1; i < result.routes.length; i++) {
          const altRenderer = new routesLib.DirectionsRenderer({
            map,
            suppressMarkers: true,
            routeIndex: i,
            polylineOptions: {
              strokeColor: '#86868b',
              strokeWeight: 4,
              strokeOpacity: 0.5,
            },
          })
          altRenderer.setDirections(result)
          altRenderer.setRouteIndex(i)
          altRenderersRef.current.push(altRenderer)
        }
      }
    } catch {
      setError('לא ניתן לחשב מסלול. בדקו את הבחירות ונסו שוב.')
    } finally {
      setIsCalculating(false)
    }
  }, [selectedStops, avoidHighways, avoidTolls, clearAltRenderers, routesLib, map])

  // Select an alternative route
  const selectRoute = useCallback(
    (idx: number) => {
      setSelectedRouteIndex(idx)
      if (!routeResult || !routesLib || !map) return

      // Set primary renderer to chosen route
      if (primaryRendererRef.current) {
        primaryRendererRef.current.setDirections(routeResult)
        primaryRendererRef.current.setRouteIndex(idx)
      }

      // Rebuild alt renderers for all other routes
      clearAltRenderers()
      for (let i = 0; i < routeResult.routes.length; i++) {
        if (i === idx) continue
        const altRenderer = new routesLib.DirectionsRenderer({
          map,
          suppressMarkers: true,
          routeIndex: i,
          polylineOptions: {
            strokeColor: '#86868b',
            strokeWeight: 4,
            strokeOpacity: 0.5,
          },
        })
        altRenderer.setDirections(routeResult)
        altRenderer.setRouteIndex(i)
        altRenderersRef.current.push(altRenderer)
      }
    },
    [routeResult, routesLib, map, clearAltRenderers],
  )

  // Add a stop from the selector
  const addStop = useCallback(
    (opt: StopOption) => {
      onSelectedStopsChange([...selectedStops, opt])
      setAddStopOpen(false)
      setAddStopFilter('')
    },
    [selectedStops, onSelectedStopsChange],
  )

  // Remove a stop by index
  const removeStop = useCallback(
    (index: number) => {
      onSelectedStopsChange(selectedStops.filter((_, i) => i !== index))
      clearRoute()
    },
    [selectedStops, onSelectedStopsChange, clearRoute],
  )

  // Quick-fill: all stops for the selected day
  const fillDayStops = useCallback(() => {
    if (selectedDay === null) return
    const dayOpts = ALL_STOP_OPTIONS.filter((o) => o.dayIndex === selectedDay)
    onSelectedStopsChange(dayOpts)
    clearRoute()
  }, [selectedDay, onSelectedStopsChange, clearRoute])

  // Google Maps multi-stop URL
  const openGoogleMapsNav = useCallback(() => {
    if (selectedStops.length < 2) return
    const parts = selectedStops.map((s) => `${s.lat},${s.lng}`)
    const url = `https://www.google.com/maps/dir/${parts.join('/')}`
    window.open(url, '_blank')
  }, [selectedStops])

  // Filtered options for add-stop dropdown (exclude already selected)
  const selectedKeys = new Set(selectedStops.map((s) => `${s.lat},${s.lng}`))
  const filteredOptions = ALL_STOP_OPTIONS.filter(
    (o) =>
      !selectedKeys.has(`${o.lat},${o.lng}`) && (!addStopFilter || o.label.includes(addStopFilter)),
  )

  // Summary for selected route
  const selectedRoute = routeResult?.routes[selectedRouteIndex]
  const totalDuration = selectedRoute?.legs.reduce(
    (sum, leg) => sum + (leg.duration?.value ?? 0),
    0,
  )
  const totalDistance = selectedRoute?.legs.reduce(
    (sum, leg) => sum + (leg.distance?.value ?? 0),
    0,
  )
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.round((secs % 3600) / 60)
    return h > 0 ? `${h}ש' ${m}ד'` : `${m}ד'`
  }
  const formatDistance = (meters: number) => {
    const km = Math.round(meters / 1000)
    return `${km} ק"מ`
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Floating trigger button (when not in driving mode) */}
      <AnimatePresence>
        {!isDrivingMode && (
          <motion.div
            key="trigger"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="absolute bottom-16 end-3 z-10"
          >
            <button
              onClick={onToggleDrivingMode}
              className="glass-float flex items-center gap-2 rounded-apple px-4 py-3 min-h-[44px] text-subhead font-medium text-apple-primary hover:bg-black/5 transition-colors"
            >
              <Car className="h-4 w-4 text-ios-blue" />
              תכנון נסיעה
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet (when in driving mode) */}
      <AnimatePresence>
        {isDrivingMode && (
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="absolute bottom-0 start-0 end-0 z-20 glass rounded-t-apple-lg overflow-hidden"
            dir="rtl"
            style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-black/10" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2 shrink-0">
              <span className="text-headline font-bold text-apple-primary flex items-center gap-2">
                <Route className="h-4 w-4 text-ios-blue" />
                תכנון מסלול נסיעה
              </span>
              <button
                onClick={onToggleDrivingMode}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-apple-sm hover:bg-black/5 transition-colors"
              >
                <X className="h-4 w-4 text-apple-secondary" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-3">
              {/* Quick-fill day button */}
              {selectedDay !== null && (
                <button
                  onClick={fillDayStops}
                  className="w-full flex items-center gap-2 rounded-apple py-2.5 px-3 min-h-[44px] bg-ios-blue/10 text-ios-blue text-subhead font-medium hover:bg-ios-blue/20 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  טען את כל העצירות של יום {selectedDay + 1}
                </button>
              )}

              {/* Selected stops list */}
              {selectedStops.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-caption font-semibold text-apple-secondary">עצירות נבחרות</p>
                  {selectedStops.map((stop, i) => (
                    <div
                      key={`${stop.lat}-${stop.lng}-${i}`}
                      className="flex items-center gap-2.5 rounded-apple-sm bg-black/[0.03] px-3 py-2.5 min-h-[44px]"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ios-blue/10 text-[11px] font-bold text-ios-blue">
                        {i + 1}
                      </div>
                      <span className="flex-1 text-subhead text-apple-primary truncate">
                        {stop.label}
                      </span>
                      <button
                        onClick={() => removeStop(i)}
                        className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-apple-sm hover:bg-ios-red/10 transition-colors group"
                      >
                        <X className="h-3.5 w-3.5 text-apple-tertiary group-hover:text-ios-red" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add stop section */}
              <div className="relative">
                <button
                  onClick={() => setAddStopOpen((v) => !v)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-apple px-3 py-2.5 min-h-[44px] border text-subhead font-medium transition-colors',
                    addStopOpen
                      ? 'border-ios-blue bg-ios-blue/5 text-ios-blue'
                      : 'border-black/10 bg-black/[0.02] text-apple-secondary',
                  )}
                >
                  <Plus className="h-4 w-4" />
                  הוסף עצירה
                </button>

                {addStopOpen && (
                  <div className="mt-1 rounded-apple overflow-hidden glass-float z-10 relative">
                    <input
                      type="text"
                      value={addStopFilter}
                      onChange={(e) => setAddStopFilter(e.target.value)}
                      placeholder="חפש עצירה..."
                      className="w-full bg-transparent px-3 py-2.5 text-caption outline-none border-b border-black/5"
                      autoFocus
                    />
                    <div className="max-h-[180px] overflow-y-auto">
                      {filteredOptions.length === 0 ? (
                        <p className="px-3 py-2.5 text-caption text-apple-tertiary">אין תוצאות</p>
                      ) : (
                        filteredOptions.map((opt, i) => (
                          <button
                            key={i}
                            className="w-full text-right px-3 py-2.5 min-h-[44px] text-caption text-apple-primary hover:bg-black/5 transition-colors flex items-center"
                            onClick={() => addStop(opt)}
                          >
                            {opt.label}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex gap-3">
                <ToggleOption
                  label="הימנע מכבישים מהירים"
                  checked={avoidHighways}
                  onChange={setAvoidHighways}
                />
                <ToggleOption
                  label="הימנע מכבישי אגרה"
                  checked={avoidTolls}
                  onChange={setAvoidTolls}
                />
              </div>

              {/* Calculate button */}
              <button
                onClick={calculateRoute}
                disabled={selectedStops.length < 2 || isCalculating}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-apple py-3 min-h-[44px]',
                  'text-subhead font-semibold transition-colors',
                  selectedStops.length >= 2 && !isCalculating
                    ? 'bg-ios-blue text-white active:bg-ios-blue/80'
                    : 'bg-black/5 text-apple-tertiary cursor-not-allowed',
                )}
              >
                {isCalculating ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Car className="h-4 w-4" />
                )}
                {isCalculating ? 'מחשב מסלול...' : 'חשב מסלול'}
              </button>

              {/* Error */}
              {error && (
                <div className="rounded-apple bg-ios-red/10 px-3 py-2.5 text-caption text-ios-red">
                  {error}
                </div>
              )}

              {/* Route results */}
              {routeResult && routeResult.routes.length > 0 && (
                <div className="space-y-2">
                  {/* Route alternatives */}
                  {routeResult.routes.length > 1 && (
                    <div>
                      <p className="text-caption font-semibold text-apple-secondary mb-1.5">
                        בחר מסלול
                      </p>
                      <div className="space-y-1">
                        {routeResult.routes.map((route, i) => {
                          const legDur = route.legs.reduce(
                            (s, l) => s + (l.duration?.value ?? 0),
                            0,
                          )
                          const legDist = route.legs.reduce(
                            (s, l) => s + (l.distance?.value ?? 0),
                            0,
                          )
                          return (
                            <button
                              key={i}
                              onClick={() => selectRoute(i)}
                              className={cn(
                                'w-full flex items-center justify-between rounded-apple-sm px-3 py-2.5 min-h-[44px] border transition-colors text-right',
                                i === selectedRouteIndex
                                  ? 'border-ios-blue bg-ios-blue/10'
                                  : 'border-black/10 bg-black/[0.02] hover:bg-black/5',
                              )}
                            >
                              <span
                                className={cn(
                                  'text-caption font-medium',
                                  i === selectedRouteIndex
                                    ? 'text-ios-blue'
                                    : 'text-apple-secondary',
                                )}
                              >
                                {i === 0 ? 'מסלול מומלץ' : i === 1 ? 'חלופה א׳' : `חלופה ${i}`}
                              </span>
                              <div className="flex items-center gap-2" dir="ltr">
                                <span className="text-subhead font-bold text-apple-primary">
                                  {formatDuration(legDur)}
                                </span>
                                <span className="text-caption text-apple-secondary">
                                  {formatDistance(legDist)}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected route summary */}
                  {selectedRoute && totalDuration !== undefined && totalDistance !== undefined && (
                    <div className="rounded-apple bg-ios-blue/5 border border-ios-blue/20 px-3 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-headline font-bold text-apple-primary">
                            {formatDuration(totalDuration)}
                          </span>
                          <span className="text-body text-apple-secondary">
                            {formatDistance(totalDistance)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={openGoogleMapsNav}
                            className="flex items-center gap-1 rounded-full px-3 py-1.5 min-h-[36px] bg-ios-green text-white text-caption font-semibold active:bg-ios-green/80 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            ניווט
                          </button>
                          <button
                            onClick={clearRoute}
                            className="flex items-center gap-1 rounded-full px-3 py-1.5 min-h-[36px] bg-black/5 text-apple-secondary text-caption font-semibold active:bg-black/10 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            נקה
                          </button>
                        </div>
                      </div>

                      {/* Leg breakdown toggle */}
                      <button
                        onClick={() => setLegDetailsOpen((v) => !v)}
                        className="flex items-center gap-1 text-caption text-ios-blue font-medium"
                      >
                        {legDetailsOpen ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {legDetailsOpen ? 'הסתר פירוט' : 'הצג פירוט לכל קטע'}
                      </button>

                      {/* Per-leg breakdown */}
                      {legDetailsOpen && selectedRoute.legs.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {selectedRoute.legs.map((leg, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 rounded-apple-sm bg-white/40 px-2.5 py-2"
                            >
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ios-blue/10 text-[10px] font-bold text-ios-blue mt-0.5">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-caption text-apple-primary leading-snug truncate">
                                  🚗 {selectedStops[i]?.title ?? leg.start_address} →{' '}
                                  {selectedStops[i + 1]?.title ?? leg.end_address}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5" dir="ltr">
                                  <span className="text-[11px] font-semibold text-ios-blue">
                                    {leg.duration?.text}
                                  </span>
                                  <span className="text-[11px] text-apple-secondary">
                                    {leg.distance?.text}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Small toggle option ──────────────────────────────────────

function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'flex-1 flex items-center gap-1.5 rounded-apple-sm px-2.5 py-2 min-h-[36px] border text-caption font-medium transition-colors text-right',
        checked
          ? 'border-ios-blue bg-ios-blue/10 text-ios-blue'
          : 'border-black/10 bg-black/[0.02] text-apple-secondary',
      )}
    >
      <div
        className={cn(
          'h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors',
          checked ? 'border-ios-blue bg-ios-blue' : 'border-apple-tertiary',
        )}
      />
      <span className="truncate text-[11px]">{label}</span>
    </button>
  )
}
