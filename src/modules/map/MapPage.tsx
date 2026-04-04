import { useMemo, useState, useCallback, useEffect } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { Map as MapIcon, Layers, Navigation, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DAY_COLORS } from '@/constants'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { getPrimaryLocationForCity } from '@/data/locations'

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
  const map = useMap()

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
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Compact header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-apple-primary">
            <MapIcon className="ms-1.5 inline h-5 w-5" />
            מפת המסלול
          </h2>
          <span className="text-caption text-apple-tertiary font-medium">
            {ITINERARY_DAYS.length} ימים · {allPoints.length} עצירות
          </span>
        </div>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={cn(
            'rounded-lg px-3 py-2 min-h-[44px] text-caption font-medium transition-colors',
            showLabels ? 'bg-ios-blue text-white' : 'glass text-apple-secondary',
          )}
        >
          <Layers className="ms-1 inline h-3 w-3" />
          תוויות
        </button>
      </div>

      {/* Compact day filter */}
      <div className="flex gap-1.5 overflow-x-auto px-3 pb-1.5">
        <button
          onClick={() => handleDaySelect(null)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 min-h-[44px] text-caption font-medium transition-colors flex items-center',
            selectedDay === null ? 'bg-apple-primary text-white' : 'glass text-apple-secondary',
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
              'shrink-0 rounded-full px-3 py-1.5 min-h-[44px] text-caption font-medium transition-colors whitespace-nowrap flex items-center',
              selectedDay === idx ? 'text-white' : 'glass text-apple-secondary',
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

      {/* Map */}
      <div className="flex-1 overflow-hidden rounded-t-apple-lg mx-2">
        <Map
          defaultCenter={{ lat: 37.5, lng: -110 }}
          defaultZoom={5}
          mapId={MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          <RouteLines selectedDay={selectedDay} allPoints={allPoints} />

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
