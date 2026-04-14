import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import type { MapMouseEvent } from '@vis.gl/react-google-maps'
import { Layers, Navigation, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import { DAY_COLORS } from '@/constants'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { getPrimaryLocationForCity } from '@/data/locations'
import { useMapMoti } from '@/contexts/MapMotiContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { PlaceSearch } from './components/PlaceSearch'
import { DrivingRoutePlanner, type StopOption } from './components/DrivingRoutePlanner'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const MAP_ID = 'hey-usa-map'

// RV/caravan speed multiplier — caravans are ~25% slower than cars
const RV_TIME_MULTIPLIER = 1.25

interface MapPoint {
  lat: number
  lng: number
  title: string
  dayTitle: string
  dayIndex: number
  location?: string
  time?: string
  city?: string
}

interface LegInfo {
  durationSec: number
  distanceM: number
  midpoint: google.maps.LatLngLiteral
  fromName: string
  toName: string
}

interface DayRouteData {
  polylinePath: google.maps.LatLngLiteral[]
  totalDurationSec: number
  totalDistanceM: number
  midpoint: google.maps.LatLngLiteral
  legs: LegInfo[]
}

// Format seconds to Hebrew duration string
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  if (hours === 0) return `${mins} דק׳`
  if (mins === 0) return `${hours} שע׳`
  return `${hours} שע׳ ${mins} דק׳`
}

function formatDistance(meters: number): string {
  const km = Math.round(meters / 1000)
  return `${km} ק״מ`
}

// Decode Google's encoded polyline string into lat/lng array
function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let b: number
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    result = 0
    shift = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

function RouteLines({ selectedDay }: { selectedDay: number | null; allPoints: MapPoint[] }) {
  const map = useMap()
  const routesLib = useMapsLibrary('routes')
  const serviceRef = useRef<google.maps.DirectionsService | null>(null)
  const routeCacheRef = useRef<Record<number, DayRouteData>>({})
  const [dayRoutes, setDayRoutes] = useState<Record<number, DayRouteData>>({})
  const fetchingRef = useRef<Set<number>>(new Set())

  // Initialize DirectionsService
  useEffect(() => {
    if (!routesLib) return
    serviceRef.current = new routesLib.DirectionsService()
  }, [routesLib])

  // Fetch driving route for a single day
  const fetchDayRoute = useCallback(async (dayIdx: number) => {
    if (!serviceRef.current) return
    if (routeCacheRef.current[dayIdx]) return
    if (fetchingRef.current.has(dayIdx)) return

    const day = ITINERARY_DAYS[dayIdx]
    const stopsWithCoords = day.stops.filter((s) => s.lat && s.lng)
    const coords = stopsWithCoords.map((s) => ({ lat: s.lat!, lng: s.lng! }))
    if (coords.length < 2) return

    fetchingRef.current.add(dayIdx)

    try {
      const origin = coords[0]
      const destination = coords[coords.length - 1]
      const waypoints = coords.slice(1, -1).map((c) => ({
        location: c as google.maps.LatLngLiteral,
        stopover: true,
      }))

      const result = await serviceRef.current.route({
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        language: 'he',
      } as google.maps.DirectionsRequest)

      if (result.routes.length > 0) {
        const route = result.routes[0]
        // Use overview_path (pre-decoded LatLng[]) first, fall back to decoding the encoded polyline
        let polylinePath: google.maps.LatLngLiteral[] = coords
        if (route.overview_path?.length) {
          polylinePath = route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }))
        } else {
          const encoded =
            typeof route.overview_polyline === 'string'
              ? route.overview_polyline
              : (route.overview_polyline as { points?: string })?.points
          if (encoded) polylinePath = decodePolyline(encoded)
        }

        // Collect per-leg info with stop names and midpoints
        let totalDurationSec = 0
        let totalDistanceM = 0
        const legs: LegInfo[] = []
        for (let li = 0; li < route.legs.length; li++) {
          const leg = route.legs[li]
          const dur = leg.duration?.value || 0
          const dist = leg.distance?.value || 0
          totalDurationSec += dur
          totalDistanceM += dist

          // Midpoint of this leg for label placement
          const legPath =
            leg.steps?.flatMap((s) => s.path?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || []) ||
            []
          const legMid =
            legPath.length > 0
              ? legPath[Math.floor(legPath.length / 2)]
              : {
                  lat: (coords[li].lat + coords[li + 1].lat) / 2,
                  lng: (coords[li].lng + coords[li + 1].lng) / 2,
                }

          legs.push({
            durationSec: dur,
            distanceM: dist,
            midpoint: legMid,
            fromName: stopsWithCoords[li]?.title || '',
            toName: stopsWithCoords[li + 1]?.title || '',
          })
        }

        // Find midpoint of the polyline for day-level label
        const midIdx = Math.floor(polylinePath.length / 2)
        const midpoint = polylinePath[midIdx] || coords[0]

        const data: DayRouteData = {
          polylinePath,
          totalDurationSec,
          totalDistanceM,
          midpoint,
          legs,
        }
        routeCacheRef.current[dayIdx] = data
        setDayRoutes((prev) => ({ ...prev, [dayIdx]: data }))
      }
    } catch {
      // Directions API failed for this day — fall back to straight line
      const fallbackCoords = stopsWithCoords.map((s) => ({ lat: s.lat!, lng: s.lng! }))
      if (fallbackCoords.length >= 2) {
        const data: DayRouteData = {
          polylinePath: fallbackCoords,
          totalDurationSec: 0,
          totalDistanceM: 0,
          midpoint: fallbackCoords[Math.floor(fallbackCoords.length / 2)],
          legs: [],
        }
        routeCacheRef.current[dayIdx] = data
        setDayRoutes((prev) => ({ ...prev, [dayIdx]: data }))
      }
    } finally {
      fetchingRef.current.delete(dayIdx)
    }
  }, [])

  // Fetch routes for visible days
  useEffect(() => {
    if (!serviceRef.current) return

    if (selectedDay !== null) {
      fetchDayRoute(selectedDay)
    } else {
      // Stagger requests to avoid rate limits (50ms apart)
      ITINERARY_DAYS.forEach((_, idx) => {
        setTimeout(() => fetchDayRoute(idx), idx * 50)
      })
    }
  }, [selectedDay, fetchDayRoute, routesLib])

  // Render polylines on the map
  useEffect(() => {
    if (!map) return

    const polylines: google.maps.Polyline[] = []
    const overlays: google.maps.OverlayView[] = []

    const daysToRender = selectedDay !== null ? [selectedDay] : Object.keys(dayRoutes).map(Number)

    for (const idx of daysToRender.sort((a, b) => a - b)) {
      const routeData = dayRoutes[idx]
      const color = DAY_COLORS[idx % DAY_COLORS.length]

      if (!routeData) continue

      // Driving route polyline (no inter-day connectors — they look like straight lines)
      polylines.push(
        new google.maps.Polyline({
          path: routeData.polylinePath,
          strokeColor: color,
          strokeWeight: selectedDay !== null ? 5 : 4,
          strokeOpacity: 0.85,
          map,
        }),
      )

      // Add driving time labels
      if (routeData.totalDurationSec > 0) {
        if (selectedDay !== null && routeData.legs.length > 0) {
          // Per-leg labels when viewing a single day
          for (const leg of routeData.legs) {
            if (leg.durationSec > 0) {
              const rvDur = Math.round(leg.durationSec * RV_TIME_MULTIPLIER)
              const label = `🚐 ${formatDuration(rvDur)} · ${formatDistance(leg.distanceM)}`
              const subtitle = `${leg.fromName} → ${leg.toName}`
              const overlay = createDrivingTimeLabel(leg.midpoint, label, subtitle, color, map)
              overlays.push(overlay)
            }
          }
        } else {
          // Compact day total when viewing all days
          const rvDuration = Math.round(routeData.totalDurationSec * RV_TIME_MULTIPLIER)
          const label = `יום ${idx + 1}: ${formatDuration(rvDuration)} · ${formatDistance(routeData.totalDistanceM)}`
          const overlay = createDrivingTimeLabel(routeData.midpoint, label, '', color, map)
          overlays.push(overlay)
        }
      }
    }

    return () => {
      polylines.forEach((p) => p.setMap(null))
      overlays.forEach((o) => o.setMap(null))
    }
  }, [map, selectedDay, dayRoutes])

  return null
}

// Factory for driving time label overlays — draggable with auto-return
function createDrivingTimeLabel(
  position: google.maps.LatLngLiteral,
  text: string,
  subtitle: string,
  color: string,
  map: google.maps.Map,
): google.maps.OverlayView {
  const overlay = new google.maps.OverlayView()
  let div: HTMLDivElement | null = null
  let dragOffset = { x: 0, y: 0 }
  let isDragging = false
  let returnTimer: ReturnType<typeof setTimeout> | null = null

  overlay.onAdd = () => {
    div = document.createElement('div')
    div.style.cssText = `
      position: absolute;
      background: white;
      border: 2px solid ${color};
      border-radius: 14px;
      padding: ${subtitle ? '6px 12px' : '4px 10px'};
      pointer-events: auto;
      cursor: grab;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transform: translate(-50%, -50%);
      direction: rtl;
      text-align: center;
      z-index: 1;
      transition: left 0.4s ease, top 0.4s ease;
      user-select: none;
    `
    // Main time/distance line
    const mainLine = document.createElement('div')
    mainLine.style.cssText = `
      font-size: 14px;
      font-weight: 700;
      color: #1d1d1f;
      white-space: nowrap;
      line-height: 1.3;
    `
    mainLine.textContent = text
    div.appendChild(mainLine)

    // Subtitle with stop names
    if (subtitle) {
      const subLine = document.createElement('div')
      subLine.style.cssText = `
        font-size: 11px;
        font-weight: 500;
        color: #86868b;
        white-space: nowrap;
        line-height: 1.2;
        margin-top: 1px;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
      `
      subLine.textContent = subtitle
      div.appendChild(subLine)
    }

    // Draggable behavior
    div.addEventListener('pointerdown', (e) => {
      if (!div) return
      isDragging = true
      div.style.cursor = 'grabbing'
      div.style.transition = 'none'
      div.setPointerCapture(e.pointerId)
      const rect = div.getBoundingClientRect()
      dragOffset = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      }
      if (returnTimer) clearTimeout(returnTimer)
      e.stopPropagation()
    })

    div.addEventListener('pointermove', (e) => {
      if (!isDragging || !div) return
      const projection = overlay.getProjection()
      if (!projection) return
      const containerPixel = projection.fromLatLngToContainerPixel(new google.maps.LatLng(position))
      if (!containerPixel) return
      // Convert client coords to overlay pixel coords
      const pane = overlay.getPanes()?.overlayLayer
      if (!pane) return
      const paneRect = pane.getBoundingClientRect()
      const newLeft = e.clientX - paneRect.left - dragOffset.x
      const newTop = e.clientY - paneRect.top - dragOffset.y
      div.style.left = `${newLeft}px`
      div.style.top = `${newTop}px`
      e.stopPropagation()
    })

    const endDrag = () => {
      if (!isDragging || !div) return
      isDragging = false
      div.style.cursor = 'grab'
      // Auto-return after 3 seconds
      returnTimer = setTimeout(() => {
        if (!div) return
        div.style.transition = 'left 0.4s ease, top 0.4s ease'
        overlay.draw()
      }, 3000)
    }
    div.addEventListener('pointerup', endDrag)
    div.addEventListener('pointercancel', endDrag)

    const panes = overlay.getPanes()
    panes?.overlayLayer.appendChild(div)
  }

  overlay.draw = () => {
    if (!div || isDragging) return
    const projection = overlay.getProjection()
    if (!projection) return
    const pos = projection.fromLatLngToDivPixel(new google.maps.LatLng(position))
    if (pos) {
      div.style.left = `${pos.x}px`
      div.style.top = `${pos.y}px`
    }
  }

  overlay.onRemove = () => {
    if (returnTimer) clearTimeout(returnTimer)
    if (div?.parentNode) {
      div.parentNode.removeChild(div)
      div = null
    }
  }

  overlay.setMap(map)
  return overlay
}

function DraggableControls({
  showLabels,
  onToggleLabels,
  showSavedRoutes,
  onToggleSavedRoutes,
}: {
  showLabels: boolean
  onToggleLabels: () => void
  showSavedRoutes: boolean
  onToggleSavedRoutes: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)
  const pointerId = useRef<number | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    hasMoved.current = false
    pointerId.current = e.pointerId
    const rect = containerRef.current!.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return
    if (!hasMoved.current) {
      hasMoved.current = true
      containerRef.current.setPointerCapture(e.pointerId)
    }
    const parent = containerRef.current.parentElement!
    const parentRect = parent.getBoundingClientRect()
    const newX = Math.max(
      0,
      Math.min(
        e.clientX - parentRect.left - dragOffset.current.x,
        parentRect.width - containerRef.current.offsetWidth,
      ),
    )
    const newY = Math.max(
      0,
      Math.min(
        e.clientY - parentRect.top - dragOffset.current.y,
        parentRect.height - containerRef.current.offsetHeight,
      ),
    )
    containerRef.current.style.left = `${newX}px`
    containerRef.current.style.top = `${newY}px`
    containerRef.current.style.bottom = 'auto'
    containerRef.current.style.right = 'auto'
  }, [])

  const onPointerUp = useCallback(() => {
    if (containerRef.current && pointerId.current !== null && hasMoved.current) {
      containerRef.current.releasePointerCapture(pointerId.current)
    }
    dragging.current = false
    pointerId.current = null
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute bottom-16 start-3 z-[8] flex flex-col items-start gap-1.5 cursor-grab active:cursor-grabbing touch-none select-none"
      dir="rtl"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <button
        onClick={onToggleLabels}
        className={cn(
          'rounded-apple-sm px-3 py-2 text-caption font-medium transition-colors shadow-glass',
          showLabels
            ? 'bg-ios-blue text-white'
            : 'bg-white/90 text-apple-secondary backdrop-blur-sm',
        )}
      >
        <Layers className="ms-1 inline h-3 w-3" />
        תוויות
      </button>
      <button
        onClick={onToggleSavedRoutes}
        className={cn(
          'rounded-apple-sm px-3 py-2 text-caption font-medium transition-colors shadow-glass',
          showSavedRoutes
            ? 'bg-ios-green text-white'
            : 'bg-white/90 text-apple-secondary backdrop-blur-sm',
        )}
      >
        <ExternalLink className="ms-1 inline h-3 w-3" />
        מסלולים שמורים
      </button>
    </div>
  )
}

function MapContent() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [popupInfo, setPopupInfo] = useState<MapPoint | null>(null)
  const [isDrivingMode, setIsDrivingMode] = useState(false)
  const [showSavedRoutes, setShowSavedRoutes] = useState(false)
  const [selectedStops, setSelectedStops] = useState<StopOption[]>([])
  const [drivingHintVisible, setDrivingHintVisible] = useState(false)
  const map = useMap()
  const { consumeAction } = useMapMoti()
  const [initialSearchQuery, setInitialSearchQuery] = useState<string | null>(null)
  const { setCollapsed } = useSidebar()

  // Auto-collapse sidebar on map page for maximum map area
  useEffect(() => {
    setCollapsed(true)
    return () => setCollapsed(false)
  }, [setCollapsed])

  // Consume pending Moti action on mount
  useEffect(() => {
    const action = consumeAction()
    if (!action) return
    if (action.type === 'search_place' && action.query) {
      setInitialSearchQuery(action.query)
    }
    // show_directions could be handled here in the future
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allPoints = useMemo<MapPoint[]>(() => {
    const points: MapPoint[] = []
    ITINERARY_DAYS.forEach((day, dayIdx) => {
      day.stops.forEach((stop) => {
        if (stop.lat && stop.lng) {
          points.push({
            lat: stop.lat,
            lng: stop.lng,
            title: stop.title,
            dayTitle: day.title,
            dayIndex: dayIdx,
            location: stop.location,
            time: stop.start_time,
            city: day.city,
          })
        }
      })
    })
    return points
  }, [])

  const filteredPoints = useMemo(
    () => (selectedDay !== null ? allPoints.filter((p) => p.dayIndex === selectedDay) : allPoints),
    [allPoints, selectedDay],
  )

  const handleDaySelect = useCallback(
    (idx: number | null) => {
      setSelectedDay(idx)
      setPopupInfo(null)
      if (idx !== null && map) {
        const dayPoints = allPoints.filter((p) => p.dayIndex === idx)
        if (dayPoints.length > 0) {
          const avgLat = dayPoints.reduce((s, p) => s + p.lat, 0) / dayPoints.length
          const avgLng = dayPoints.reduce((s, p) => s + p.lng, 0) / dayPoints.length
          map.panTo({ lat: avgLat, lng: avgLng })
          map.setZoom(8)
        }
      } else if (map) {
        map.panTo({ lat: 37.5, lng: -110 })
        map.setZoom(5)
      }
    },
    [allPoints, map],
  )

  // Show hint toast when driving mode activates
  useEffect(() => {
    if (isDrivingMode) {
      setDrivingHintVisible(true)
      const t = setTimeout(() => setDrivingHintVisible(false), 3500)
      return () => clearTimeout(t)
    } else {
      setDrivingHintVisible(false)
    }
  }, [isDrivingMode])

  // Handle marker click in driving mode — add stop to route
  const handleMarkerClick = useCallback(
    (point: MapPoint) => {
      if (isDrivingMode) {
        const alreadyAdded = selectedStops.some((s) => s.lat === point.lat && s.lng === point.lng)
        if (!alreadyAdded) {
          setSelectedStops((prev) => [
            ...prev,
            {
              label: `יום ${point.dayIndex + 1}: ${point.title}`,
              lat: point.lat,
              lng: point.lng,
              dayIndex: point.dayIndex,
              title: point.title,
            },
          ])
        }
      } else {
        setPopupInfo(point)
      }
    },
    [isDrivingMode, selectedStops],
  )

  // Handle map click for arbitrary waypoints in driving mode
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!isDrivingMode) return
      const lat = e.detail.latLng?.lat
      const lng = e.detail.latLng?.lng
      if (lat == null || lng == null) return

      // Add immediately with coords, then try reverse geocoding to update name
      const coordLabel = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      const newStop: StopOption = {
        label: coordLabel,
        lat,
        lng,
        dayIndex: -1,
        title: coordLabel,
        isCustomWaypoint: true,
      }
      setSelectedStops((prev) => [...prev, newStop])

      // Try reverse geocoding to get a friendly name
      try {
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }).then((response) => {
          if (response.results[0]) {
            const name = response.results[0].formatted_address.split(',').slice(0, 2).join(',')
            setSelectedStops((prev) =>
              prev.map((s) =>
                s.lat === lat && s.lng === lng && s.isCustomWaypoint
                  ? { ...s, label: name, title: name }
                  : s,
              ),
            )
          }
        })
      } catch {
        // Keep coord label
      }
    },
    [isDrivingMode],
  )

  // Build set of stop keys for badge rendering
  const stopOrderMap = useMemo(() => {
    const m: Record<string, number> = {}
    selectedStops.forEach((s, i) => {
      m[`${s.lat},${s.lng}`] = i + 1
    })
    return m
  }, [selectedStops])

  // Custom waypoints (not from itinerary)
  const customWaypoints = useMemo(
    () => selectedStops.filter((s) => s.isCustomWaypoint),
    [selectedStops],
  )

  return (
    <div className={cn('relative h-[calc(100vh-4rem)]', isDrivingMode && 'cursor-crosshair')}>
      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <Map
          defaultCenter={{ lat: 37.5, lng: -110 }}
          defaultZoom={5}
          mapId={MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
          onClick={handleMapClick}
        >
          <PlaceSearch initialQuery={initialSearchQuery} />
          {!isDrivingMode && <RouteLines selectedDay={selectedDay} allPoints={allPoints} />}
          <DrivingRoutePlanner
            selectedDay={selectedDay}
            isDrivingMode={isDrivingMode}
            onToggleDrivingMode={() => setIsDrivingMode((v) => !v)}
            selectedStops={selectedStops}
            onSelectedStopsChange={setSelectedStops}
          />

          {filteredPoints.map((point, i) => {
            const routeOrder = stopOrderMap[`${point.lat},${point.lng}`]
            return (
              <AdvancedMarker
                key={`${point.dayIndex}-${i}`}
                position={{ lat: point.lat, lng: point.lng }}
                onClick={() => handleMarkerClick(point)}
              >
                <div className="relative">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-glass-float cursor-pointer transition-transform hover:scale-125',
                      routeOrder && 'ring-2 ring-ios-blue ring-offset-1',
                    )}
                    style={{ backgroundColor: DAY_COLORS[point.dayIndex % DAY_COLORS.length] }}
                  >
                    <span className="text-[10px] font-bold text-white leading-none">
                      {point.dayIndex + 1}
                    </span>
                  </div>
                  {routeOrder && (
                    <div className="absolute -top-2 -end-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-ios-blue text-[9px] font-bold text-white border border-white shadow-sm">
                      {routeOrder}
                    </div>
                  )}
                </div>
              </AdvancedMarker>
            )
          })}

          {/* Custom waypoint markers */}
          {customWaypoints.map((wp, i) => {
            const routeOrder = stopOrderMap[`${wp.lat},${wp.lng}`]
            return (
              <AdvancedMarker key={`custom-${i}`} position={{ lat: wp.lat, lng: wp.lng }}>
                <div className="relative">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-glass-float bg-ios-orange">
                    <span className="text-[10px] font-bold text-white leading-none">📍</span>
                  </div>
                  {routeOrder && (
                    <div className="absolute -top-2 -end-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-ios-blue text-[9px] font-bold text-white border border-white shadow-sm">
                      {routeOrder}
                    </div>
                  )}
                </div>
              </AdvancedMarker>
            )
          })}

          {showLabels && popupInfo && (
            <InfoWindow
              position={{ lat: popupInfo.lat, lng: popupInfo.lng }}
              onCloseClick={() => setPopupInfo(null)}
              pixelOffset={[0, -30]}
            >
              <div className="text-right min-w-[160px]" dir="rtl">
                <p className="font-bold text-sm">{popupInfo.title}</p>
                <p className="text-xs text-apple-secondary">{popupInfo.dayTitle}</p>
                {popupInfo.location && (
                  <p className="text-xs text-apple-tertiary mt-1">{popupInfo.location}</p>
                )}
                {popupInfo.time && <p className="text-xs text-apple-tertiary">{popupInfo.time}</p>}
                {(() => {
                  const loc = getPrimaryLocationForCity(popupInfo.city)
                  return loc ? (
                    <a
                      href={`/hey-usa/locations/${loc.id}`}
                      className="inline-block mt-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      {loc.nameHe}
                    </a>
                  ) : null
                })()}
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

      {/* Overlay: day filter chips (below search bar) */}
      <div className="pointer-events-none absolute top-14 start-2 end-2 z-[8]" dir="rtl">
        <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => handleDaySelect(null)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-caption font-medium transition-colors flex items-center shadow-glass',
              selectedDay === null
                ? 'bg-apple-primary text-white'
                : 'bg-white/90 text-apple-secondary backdrop-blur-sm',
            )}
          >
            <Navigation className="ms-1 inline h-2.5 w-2.5" />
            הכל
          </button>
          {ITINERARY_DAYS.map((day, idx) => (
            <button
              key={day.id}
              onClick={() => handleDaySelect(selectedDay === idx ? null : idx)}
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-caption font-medium transition-colors whitespace-nowrap flex items-center shadow-glass',
                selectedDay === idx
                  ? 'text-white'
                  : 'bg-white/90 text-apple-secondary backdrop-blur-sm',
              )}
              style={
                selectedDay === idx
                  ? { backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] }
                  : undefined
              }
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay: draggable controls (labels toggle + saved routes) */}
      <DraggableControls
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        showSavedRoutes={showSavedRoutes}
        onToggleSavedRoutes={() => setShowSavedRoutes(!showSavedRoutes)}
      />

      {/* Saved routes panel (slides up from bottom-start) */}
      {/* Driving mode hint toast */}
      <AnimatePresence>
        {drivingHintVisible && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="absolute top-28 start-1/2 -translate-x-1/2 z-30 glass-float rounded-apple px-4 py-2.5 text-subhead font-medium text-apple-primary whitespace-nowrap"
            dir="rtl"
          >
            לחצו על נקודות במפה לבניית מסלול
          </motion.div>
        )}
      </AnimatePresence>

      {showSavedRoutes && (
        <div
          className="absolute bottom-32 start-3 z-[9] w-[min(calc(100%-1.5rem),360px)]"
          dir="rtl"
        >
          <div className="glass-float rounded-apple p-2 flex flex-col gap-1.5">
            <a
              href="https://www.google.com/maps/dir/Mammoth+Lakes,+California+93546,+USA/Mono+Lake,+California+93541,+USA/Tioga+Rd,+California,+USA/North+Pines+Campground,+Yosemite+National+Park,+9024+Southside+Dr,+TUOLUMNE+MEADOWS,+CA+95389,+United+States/Marin+RV+Park,+2140+Redwood+Hwy,+Greenbrae,+CA+94904,+United+States/@38.2480539,-123.3573915,574674m"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-apple-sm px-3 py-2 text-subhead text-ios-blue hover:bg-ios-blue/10 transition-colors flex items-center gap-2"
              dir="ltr"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Mammoth Lakes → Mono Lake → Yosemite → Marin</span>
            </a>
            <a
              href="https://www.google.com/maps/dir/Bryce+Canyon+City,+Utah,+USA/Kanab,+Utah+84741,+USA/Hurricane,+Utah+84737,+USA/Zion+Canyon+Campground+and+RV+Resort,+479+Zion+Park+Blvd,+Springdale,+UT+84767,+United+States/@37.3017932,-113.3804657,145519m"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-apple-sm px-3 py-2 text-subhead text-ios-blue hover:bg-ios-blue/10 transition-colors flex items-center gap-2"
              dir="ltr"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Bryce Canyon → Kanab → Hurricane → Zion</span>
            </a>
            <a
              href="https://www.google.com/maps/dir/69+New+Ventures+Dr,+Bozeman,+MT+59718,+USA/Gardiner,+Montana+59030,+USA/Mammoth+Hot+Springs,+Mammoth,+WY+82190,+United+States/Madison+Campground,+30+Madison+Campground+E+Loop,+Yellowstone+National+Park,+WY+82190,+United+States/Old+Faithful,+Yellowstone+National+Park,+WY+82190,+United+States/Colter+Bay+Village,+Wyoming+83013,+USA/Jackson,+Wyoming,+USA/@44.1717642,-112.8630199,262427m"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-apple-sm px-3 py-2 text-subhead text-ios-blue hover:bg-ios-blue/10 transition-colors flex items-center gap-2"
              dir="ltr"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Bozeman → Mammoth Hot Springs → Old Faithful → Jackson
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-apple-secondary text-body">
          Google Maps API key missing. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in .env
        </p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <MapContent />
    </APIProvider>
  )
}
