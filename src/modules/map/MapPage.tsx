import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Map, Layers, Navigation } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ITINERARY_DAYS } from '@/data/itinerary'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue in Leaflet + bundlers
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const DAY_COLORS = [
  '#c44d34', '#4a90d9', '#2d7d46', '#f5c542', '#6c5ce7',
  '#e8735e', '#00b894', '#636e72', '#0984e3', '#fd79a8',
  '#c44d34', '#4a90d9', '#2d7d46', '#f5c542', '#6c5ce7',
  '#e8735e', '#00b894', '#636e72', '#0984e3', '#fd79a8',
]

interface MapPoint {
  lat: number
  lng: number
  title: string
  dayTitle: string
  dayIndex: number
  location?: string
  time?: string
}

export default function MapPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showLabels, setShowLabels] = useState(true)

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
          })
        }
      })
    })
    return points
  }, [])

  const filteredPoints = useMemo(
    () =>
      selectedDay !== null
        ? allPoints.filter((p) => p.dayIndex === selectedDay)
        : allPoints,
    [allPoints, selectedDay],
  )

  const routeLines = useMemo(() => {
    const lines: { positions: [number, number][]; color: string }[] = []
    const daysToShow =
      selectedDay !== null
        ? [{ day: ITINERARY_DAYS[selectedDay], idx: selectedDay }]
        : ITINERARY_DAYS.map((day, idx) => ({ day, idx }))

    for (const { day, idx } of daysToShow) {
      const coords: [number, number][] = []
      for (const stop of day.stops) {
        if (stop.lat && stop.lng) {
          coords.push([stop.lat, stop.lng])
        }
      }
      if (coords.length >= 2) {
        lines.push({ positions: coords, color: DAY_COLORS[idx % DAY_COLORS.length] })
      }
    }
    return lines
  }, [selectedDay])

  // Center of the US
  const center: [number, number] = selectedDay !== null && filteredPoints.length > 0
    ? [filteredPoints[0].lat, filteredPoints[0].lng]
    : [37.5, -110]

  const zoom = selectedDay !== null ? 8 : 5

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-bold text-brown">
          <Map className="ml-2 inline h-6 w-6" />
          מפת המסלול
        </h1>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={cn(
            'rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
            showLabels ? 'bg-sky text-white' : 'bg-white/60 text-brown-light',
          )}
        >
          <Layers className="ml-1 inline h-3.5 w-3.5" />
          תוויות
        </button>
      </div>

      {/* Day filter */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        <button
          onClick={() => setSelectedDay(null)}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            selectedDay === null
              ? 'bg-brown text-white'
              : 'bg-white/60 text-brown-light',
          )}
        >
          <Navigation className="ml-1 inline h-3 w-3" />
          כל המסלול
        </button>
        {ITINERARY_DAYS.map((day, idx) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              selectedDay === idx
                ? 'text-white'
                : 'bg-white/60 text-brown-light',
            )}
            style={selectedDay === idx ? { backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] } : undefined}
          >
            יום {idx + 1}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden rounded-t-2xl mx-2">
        <MapContainer
          key={`${center[0]}-${center[1]}-${zoom}`}
          center={center}
          zoom={zoom}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route lines */}
          {routeLines.map((line, i) => (
            <Polyline
              key={i}
              positions={line.positions}
              color={line.color}
              weight={3}
              opacity={0.7}
              dashArray="8 4"
            />
          ))}

          {/* Markers */}
          {filteredPoints.map((point, i) => (
            <Marker key={i} position={[point.lat, point.lng]} icon={defaultIcon}>
              {showLabels && (
                <Popup>
                  <div className="text-right" dir="rtl">
                    <p className="font-bold text-sm">{point.title}</p>
                    <p className="text-xs text-gray-500">{point.dayTitle}</p>
                    {point.location && (
                      <p className="text-xs text-gray-400 mt-1">{point.location}</p>
                    )}
                    {point.time && (
                      <p className="text-xs text-gray-400">{point.time}</p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-around bg-white/80 px-4 py-2 text-center">
        <div>
          <p className="text-lg font-bold text-brown">{ITINERARY_DAYS.length}</p>
          <p className="text-xs text-brown-light">ימים</p>
        </div>
        <div>
          <p className="text-lg font-bold text-sky">{allPoints.length}</p>
          <p className="text-xs text-brown-light">עצירות</p>
        </div>
        <div>
          <p className="text-lg font-bold text-terracotta">
            {selectedDay !== null ? filteredPoints.length : allPoints.length}
          </p>
          <p className="text-xs text-brown-light">מוצגות</p>
        </div>
      </div>
    </div>
  )
}
