import { useMemo, useState, useCallback, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { Layers, Navigation, MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DAY_COLORS } from '@/constants'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { getPrimaryLocationForCity } from '@/data/locations'
import { useMapMoti } from '@/contexts/MapMotiContext'
import { PlaceSearch } from './components/PlaceSearch'
import { DrivingRoutePlanner } from './components/DrivingRoutePlanner'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const MAP_ID = 'hey-usa-map'

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

function RouteLines({
  selectedDay,
  allPoints,
}: {
  selectedDay: number | null
  allPoints: MapPoint[]
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const polylines: google.maps.Polyline[] = []

    if (selectedDay !== null) {
      const day = ITINERARY_DAYS[selectedDay]
      const color = DAY_COLORS[selectedDay % DAY_COLORS.length]
      const coords: google.maps.LatLngLiteral[] = []
      for (const stop of day.stops) {
        if (stop.lat && stop.lng) coords.push({ lat: stop.lat, lng: stop.lng })
      }
      if (coords.length >= 2) {
        polylines.push(
          new google.maps.Polyline({
            path: coords,
            strokeColor: color,
            strokeWeight: 4,
            strokeOpacity: 0.8,
            map,
          }),
        )
      }
    } else {
      let prevDayLastCoord: google.maps.LatLngLiteral | null = null
      for (let idx = 0; idx < ITINERARY_DAYS.length; idx++) {
        const day = ITINERARY_DAYS[idx]
        const color = DAY_COLORS[idx % DAY_COLORS.length]
        const coords: google.maps.LatLngLiteral[] = []
        for (const stop of day.stops) {
          if (stop.lat && stop.lng) coords.push({ lat: stop.lat, lng: stop.lng })
        }
        // Dashed connector from previous day
        if (prevDayLastCoord && coords.length > 0) {
          polylines.push(
            new google.maps.Polyline({
              path: [prevDayLastCoord, coords[0]],
              strokeColor: color,
              strokeWeight: 2,
              strokeOpacity: 0.5,
              icons: [
                {
                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                  offset: '0',
                  repeat: '12px',
                },
              ],
              map,
            }),
          )
        }
        // Solid route within day
        if (coords.length >= 2) {
          polylines.push(
            new google.maps.Polyline({
              path: coords,
              strokeColor: color,
              strokeWeight: 4,
              strokeOpacity: 0.8,
              map,
            }),
          )
        }
        if (coords.length > 0) prevDayLastCoord = coords[coords.length - 1]
      }
    }

    return () => {
      polylines.forEach((p) => p.setMap(null))
    }
  }, [map, selectedDay, allPoints])

  return null
}

function MapContent() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [popupInfo, setPopupInfo] = useState<MapPoint | null>(null)
  const [isDrivingMode, setIsDrivingMode] = useState(false)
  const [showSavedRoutes, setShowSavedRoutes] = useState(false)
  const map = useMap()
  const { consumeAction } = useMapMoti()
  const [initialSearchQuery, setInitialSearchQuery] = useState<string | null>(null)

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

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <Map
          defaultCenter={{ lat: 37.5, lng: -110 }}
          defaultZoom={5}
          mapId={MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          <PlaceSearch initialQuery={initialSearchQuery} />
          {!isDrivingMode && <RouteLines selectedDay={selectedDay} allPoints={allPoints} />}
          <DrivingRoutePlanner
            selectedDay={selectedDay}
            isDrivingMode={isDrivingMode}
            onToggleDrivingMode={() => setIsDrivingMode((v) => !v)}
          />

          {filteredPoints.map((point, i) => (
            <AdvancedMarker
              key={`${point.dayIndex}-${i}`}
              position={{ lat: point.lat, lng: point.lng }}
              onClick={() => setPopupInfo(point)}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-glass-float cursor-pointer transition-transform hover:scale-125"
                style={{ backgroundColor: DAY_COLORS[point.dayIndex % DAY_COLORS.length] }}
              >
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
            </AdvancedMarker>
          ))}

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

      {/* Overlay: bottom-start controls (labels toggle + saved routes) */}
      <div
        className="pointer-events-none absolute bottom-16 start-3 z-[8] flex flex-col items-start gap-1.5"
        dir="rtl"
      >
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={cn(
            'pointer-events-auto rounded-apple-sm px-3 py-2 text-caption font-medium transition-colors shadow-glass',
            showLabels
              ? 'bg-ios-blue text-white'
              : 'bg-white/90 text-apple-secondary backdrop-blur-sm',
          )}
        >
          <Layers className="ms-1 inline h-3 w-3" />
          תוויות
        </button>
        <button
          onClick={() => setShowSavedRoutes(!showSavedRoutes)}
          className={cn(
            'pointer-events-auto rounded-apple-sm px-3 py-2 text-caption font-medium transition-colors shadow-glass',
            showSavedRoutes
              ? 'bg-ios-green text-white'
              : 'bg-white/90 text-apple-secondary backdrop-blur-sm',
          )}
        >
          <ExternalLink className="ms-1 inline h-3 w-3" />
          מסלולים שמורים
        </button>
      </div>

      {/* Saved routes panel (slides up from bottom-start) */}
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
