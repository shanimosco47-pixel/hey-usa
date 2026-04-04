import { useState, useCallback, useRef, useEffect } from 'react'
import { useMapsLibrary, useMap, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { useNavigate } from 'react-router-dom'
import { Search, X, Star, MapPin, Navigation, Calendar, Bot, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppData } from '@/contexts/AppDataContext'
import { useMapMoti } from '@/contexts/MapMotiContext'
import { ITINERARY_DAYS } from '@/data/itinerary'
import { DAY_COLORS } from '@/constants'

interface PlaceResult {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  rating?: number
  userRatingsTotal?: number
  photos?: google.maps.places.PlacePhoto[]
  types?: string[]
}

export function PlaceSearch({ initialQuery }: { initialQuery?: string | null }) {
  const map = useMap()
  const placesLib = useMapsLibrary('places')
  const navigate = useNavigate()
  const { addItineraryStop } = useAppData()
  const { setChatPlaceContext } = useMapMoti()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [addedToDayId, setAddedToDayId] = useState<string | null>(null)

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!placesLib || !map) return
    autocompleteService.current = new placesLib.AutocompleteService()
    placesService.current = new placesLib.PlacesService(map)
  }, [placesLib, map])

  const searchPlaces = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setSuggestions([])
      return
    }

    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'us' },
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions)
        } else {
          setSuggestions([])
        }
      },
    )
  }, [])

  // Auto-search from Moti action
  const initialQueryConsumed = useRef(false)
  useEffect(() => {
    if (!initialQuery || initialQueryConsumed.current || !autocompleteService.current) return
    initialQueryConsumed.current = true
    setQuery(initialQuery)
    searchPlaces(initialQuery)
  }, [initialQuery, searchPlaces])

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => searchPlaces(value), 300)
    },
    [searchPlaces],
  )

  const handleTextSearch = useCallback(
    (text: string) => {
      if (!placesService.current || !text.trim()) return
      placesService.current.findPlaceFromQuery(
        {
          query: text,
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'user_ratings_total',
            'photos',
            'types',
            'place_id',
          ],
        },
        (results, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !results?.[0]?.geometry?.location
          )
            return
          const place = results[0]
          const result: PlaceResult = {
            placeId: place.place_id || '',
            name: place.name || text,
            address: place.formatted_address || '',
            lat: place.geometry!.location!.lat(),
            lng: place.geometry!.location!.lng(),
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            photos: place.photos,
            types: place.types,
          }
          setSelectedPlace(result)
          setSuggestions([])
          setIsOpen(false)
          setQuery(result.name)
          setShowDayPicker(false)
          setAddedToDayId(null)
          map?.panTo({ lat: result.lat, lng: result.lng })
          map?.setZoom(15)
        },
      )
    },
    [map],
  )

  const handleSelectSuggestion = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      if (!placesService.current) return

      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'user_ratings_total',
            'photos',
            'types',
          ],
        },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location)
            return

          const result: PlaceResult = {
            placeId: prediction.place_id,
            name: place.name || prediction.structured_formatting.main_text,
            address: place.formatted_address || prediction.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            photos: place.photos,
            types: place.types,
          }

          setSelectedPlace(result)
          setSuggestions([])
          setQuery(result.name)
          setShowDayPicker(false)
          setAddedToDayId(null)

          map?.panTo({ lat: result.lat, lng: result.lng })
          map?.setZoom(15)
        },
      )
    },
    [map],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0])
        setIsOpen(false)
      } else {
        handleTextSearch(query)
      }
    },
    [suggestions, handleSelectSuggestion, handleTextSearch, query],
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setSelectedPlace(null)
    setShowDayPicker(false)
    setAddedToDayId(null)
  }, [])

  const handleAddToItinerary = useCallback(
    (dayId: string) => {
      if (!selectedPlace) return
      addItineraryStop(dayId, {
        title: selectedPlace.name,
        description: selectedPlace.address,
        location: selectedPlace.address,
        category: 'activity',
      })
      setAddedToDayId(dayId)
      setShowDayPicker(false)
    },
    [selectedPlace, addItineraryStop],
  )

  const handleAskMoti = useCallback(() => {
    if (!selectedPlace) return
    setChatPlaceContext(
      `ספר לי על ${selectedPlace.name} (${selectedPlace.address}). ` +
        `דירוג: ${selectedPlace.rating || 'לא ידוע'}. ` +
        `האם כדאי לבקר שם?`,
    )
    navigate('/chat')
  }, [selectedPlace, setChatPlaceContext, navigate])

  return (
    <>
      {/* Search bar overlay */}
      <div className="absolute top-2 start-2 end-2 z-10" dir="rtl">
        <div className="relative">
          <div className="glass-float flex items-center rounded-apple-lg overflow-hidden">
            <Search className="h-4 w-4 text-apple-secondary me-2 ms-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder="חפש מקום בארה״ב..."
              className="flex-1 bg-transparent py-3 text-body text-apple-primary placeholder:text-apple-tertiary outline-none"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-4 w-4 text-apple-secondary" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="mt-1 glass-float rounded-apple overflow-hidden max-h-[280px] overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  onClick={() => {
                    handleSelectSuggestion(s)
                    setIsOpen(false)
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2.5 min-h-[44px] text-right hover:bg-black/5 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-apple-tertiary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-subhead font-medium text-apple-primary truncate">
                      {s.structured_formatting.main_text}
                    </p>
                    <p className="text-caption text-apple-tertiary truncate">
                      {s.structured_formatting.secondary_text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Close suggestions on map click */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute inset-0 z-[5]" onClick={() => setIsOpen(false)} />
      )}

      {/* Selected place marker */}
      {selectedPlace && (
        <>
          <AdvancedMarker position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ios-red border-[3px] border-white shadow-glass-float animate-bounce">
              <Search className="h-4 w-4 text-white" />
            </div>
          </AdvancedMarker>

          <InfoWindow
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => setSelectedPlace(null)}
            pixelOffset={[0, -45]}
          >
            <div className="text-right min-w-[220px] max-w-[280px]" dir="rtl">
              {/* Place photo */}
              {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                <div className="mb-2 -mx-2 -mt-2 overflow-hidden rounded-t">
                  <img
                    src={selectedPlace.photos[0].getUrl({ maxWidth: 280, maxHeight: 120 })}
                    alt={selectedPlace.name}
                    className="w-full h-[100px] object-cover"
                  />
                </div>
              )}

              {/* Place info */}
              <p className="font-bold text-sm">{selectedPlace.name}</p>

              {selectedPlace.rating && (
                <div className="flex items-center gap-1 mt-0.5" dir="ltr">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium">{selectedPlace.rating}</span>
                  {selectedPlace.userRatingsTotal && (
                    <span className="text-xs text-apple-tertiary">
                      ({selectedPlace.userRatingsTotal.toLocaleString()})
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-apple-secondary mt-1">{selectedPlace.address}</p>

              {/* Quick actions */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {addedToDayId ? (
                  <span className="flex items-center gap-1 rounded-full px-2.5 py-1 bg-ios-green/20 text-ios-green text-[11px] font-medium">
                    <Check className="h-3 w-3" />
                    נוסף ל{addedToDayId.replace('day-', 'יום ')}
                  </span>
                ) : (
                  <button
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1',
                      'bg-ios-blue/10 text-ios-blue text-[11px] font-medium',
                      'hover:bg-ios-blue/20 transition-colors',
                    )}
                    onClick={() => setShowDayPicker(!showDayPicker)}
                  >
                    <Calendar className="h-3 w-3" />
                    הוסף למסלול
                  </button>
                )}
                <button
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1',
                    'bg-ios-green/10 text-ios-green text-[11px] font-medium',
                    'hover:bg-ios-green/20 transition-colors',
                  )}
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`,
                      '_blank',
                    )
                  }}
                >
                  <Navigation className="h-3 w-3" />
                  ניווט
                </button>
                <button
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1',
                    'bg-ios-purple/10 text-ios-purple text-[11px] font-medium',
                    'hover:bg-ios-purple/20 transition-colors',
                  )}
                  onClick={handleAskMoti}
                >
                  <Bot className="h-3 w-3" />
                  שאל את מוטי
                </button>
              </div>

              {/* Day picker */}
              {showDayPicker && (
                <div className="mt-2 pt-2 border-t border-black/10">
                  <p className="text-[11px] text-apple-secondary mb-1.5">בחר יום:</p>
                  <div className="flex gap-1 flex-wrap max-h-[80px] overflow-y-auto">
                    {ITINERARY_DAYS.map((day, idx) => (
                      <button
                        key={day.id}
                        onClick={() => handleAddToItinerary(day.id)}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white transition-opacity hover:opacity-80"
                        style={{ backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] }}
                        title={day.title}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InfoWindow>
        </>
      )}
    </>
  )
}
