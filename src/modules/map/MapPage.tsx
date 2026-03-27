import { useMemo, useState, useCallback, useRef } from 'react'
import MapGL, { Marker, Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre'
import { Map, Layers, Navigation, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DAY_COLORS } from '@/constants'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { getPrimaryLocationForCity } from '@/data/locations'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { MapRef } from 'react-map-gl/maplibre'
import type { GeoJSON } from 'geojson'

// Free vector tile style — high resolution, no API key needed
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
// Alternative styles:
// Voyager (colorful): 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
// Dark matter: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

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

export default function MapPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [popupInfo, setPopupInfo] = useState<MapPoint | null>(null)
  const mapRef = useRef<MapRef>(null)

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
    () =>
      selectedDay !== null
        ? allPoints.filter((p) => p.dayIndex === selectedDay)
        : allPoints,
    [allPoints, selectedDay],
  )

  // Build GeoJSON line features for route segments
  const routeGeoJSON = useMemo<GeoJSON>(() => {
    const features: GeoJSON.Feature[] = []

    if (selectedDay !== null) {
      const day = ITINERARY_DAYS[selectedDay]
      const color = DAY_COLORS[selectedDay % DAY_COLORS.length]
      const coords: [number, number][] = []
      for (const stop of day.stops) {
        if (stop.lat && stop.lng) coords.push([stop.lng, stop.lat])
      }
      if (coords.length >= 2) {
        features.push({
          type: 'Feature',
          properties: { color, dashed: false },
          geometry: { type: 'LineString', coordinates: coords },
        })
      }
    } else {
      let prevDayLastCoord: [number, number] | null = null
      for (let idx = 0; idx < ITINERARY_DAYS.length; idx++) {
        const day = ITINERARY_DAYS[idx]
        const color = DAY_COLORS[idx % DAY_COLORS.length]
        const coords: [number, number][] = []
        for (const stop of day.stops) {
          if (stop.lat && stop.lng) coords.push([stop.lng, stop.lat])
        }
        if (prevDayLastCoord && coords.length > 0) {
          features.push({
            type: 'Feature',
            properties: { color, dashed: true },
            geometry: { type: 'LineString', coordinates: [prevDayLastCoord, coords[0]] },
          })
        }
        if (coords.length >= 2) {
          features.push({
            type: 'Feature',
            properties: { color, dashed: false },
            geometry: { type: 'LineString', coordinates: coords },
          })
        }
        if (coords.length > 0) prevDayLastCoord = coords[coords.length - 1]
      }
    }

    return { type: 'FeatureCollection', features }
  }, [selectedDay])

  const solidRoutes = useMemo<GeoJSON>(() => ({
    type: 'FeatureCollection',
    features: (routeGeoJSON as GeoJSON.FeatureCollection).features.filter(
      (f) => !f.properties?.dashed,
    ),
  }), [routeGeoJSON])

  const dashedRoutes = useMemo<GeoJSON>(() => ({
    type: 'FeatureCollection',
    features: (routeGeoJSON as GeoJSON.FeatureCollection).features.filter(
      (f) => f.properties?.dashed,
    ),
  }), [routeGeoJSON])

  // Fly to selected day's center
  const handleDaySelect = useCallback((idx: number | null) => {
    setSelectedDay(idx)
    setPopupInfo(null)
    if (idx !== null && mapRef.current) {
      const dayPoints = allPoints.filter((p) => p.dayIndex === idx)
      if (dayPoints.length > 0) {
        const avgLat = dayPoints.reduce((s, p) => s + p.lat, 0) / dayPoints.length
        const avgLng = dayPoints.reduce((s, p) => s + p.lng, 0) / dayPoints.length
        mapRef.current.flyTo({ center: [avgLng, avgLat], zoom: 8, duration: 1000 })
      }
    } else if (mapRef.current) {
      mapRef.current.flyTo({ center: [-110, 37.5], zoom: 5, duration: 1000 })
    }
  }, [allPoints])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Compact header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-apple-primary">
            <Map className="ml-1.5 inline h-5 w-5" />
            מפת המסלול
          </h1>
          <span className="text-[11px] text-apple-tertiary font-medium">
            {ITINERARY_DAYS.length} ימים · {allPoints.length} עצירות
          </span>
        </div>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={cn(
            'rounded-lg px-2 py-1 text-[11px] font-medium transition-colors',
            showLabels ? 'bg-ios-blue text-white' : 'glass text-apple-secondary',
          )}
        >
          <Layers className="ml-1 inline h-3 w-3" />
          תוויות
        </button>
      </div>

      {/* Compact day filter */}
      <div className="flex gap-1.5 overflow-x-auto px-3 pb-1.5">
        <button
          onClick={() => handleDaySelect(null)}
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
            selectedDay === null
              ? 'bg-apple-primary text-white'
              : 'glass text-apple-secondary',
          )}
        >
          <Navigation className="ml-1 inline h-2.5 w-2.5" />
          הכל
        </button>
        {ITINERARY_DAYS.map((day, idx) => (
          <button
            key={day.id}
            onClick={() => handleDaySelect(selectedDay === idx ? null : idx)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap',
              selectedDay === idx
                ? 'text-white'
                : 'glass text-apple-secondary',
            )}
            style={selectedDay === idx ? { backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] } : undefined}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden rounded-t-apple-lg mx-2">
        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: -110,
            latitude: 37.5,
            zoom: 5,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          attributionControl={{ compact: true }}
        >
          <NavigationControl position="top-left" />

          {/* Route lines — solid */}
          <Source id="routes-solid" type="geojson" data={solidRoutes}>
            <Layer
              id="routes-solid-layer"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 4,
                'line-opacity': 0.8,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </Source>

          {/* Route lines — dashed connectors */}
          <Source id="routes-dashed" type="geojson" data={dashedRoutes}>
            <Layer
              id="routes-dashed-layer"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': 2,
                'line-opacity': 0.5,
                'line-dasharray': [3, 4],
              }}
            />
          </Source>

          {/* Markers */}
          {filteredPoints.map((point, i) => (
            <Marker
              key={`${point.dayIndex}-${i}`}
              longitude={point.lng}
              latitude={point.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setPopupInfo(point)
              }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125"
                style={{ backgroundColor: DAY_COLORS[point.dayIndex % DAY_COLORS.length] }}
              >
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
            </Marker>
          ))}

          {/* Popup */}
          {showLabels && popupInfo && (
            <Popup
              longitude={popupInfo.lng}
              latitude={popupInfo.lat}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeOnClick={false}
              offset={20}
            >
              <div className="text-right min-w-[160px]" dir="rtl">
                <p className="font-bold text-sm">{popupInfo.title}</p>
                <p className="text-xs text-gray-500">{popupInfo.dayTitle}</p>
                {popupInfo.location && (
                  <p className="text-xs text-gray-400 mt-1">{popupInfo.location}</p>
                )}
                {popupInfo.time && (
                  <p className="text-xs text-gray-400">{popupInfo.time}</p>
                )}
                {(() => {
                  const loc = getPrimaryLocationForCity(popupInfo.city)
                  return loc ? (
                    <a
                      href={`/hey-usa/locations/${loc.id}`}
                      className="inline-block mt-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      📍 {loc.nameHe} — הערות ומסמכים
                    </a>
                  ) : null
                })()}
              </div>
            </Popup>
          )}
        </MapGL>
      </div>
    </div>
  )
}
