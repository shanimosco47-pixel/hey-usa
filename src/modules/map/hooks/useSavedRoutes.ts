import { useCallback, useState } from 'react'
import type { StopOption } from '../components/DrivingRoutePlanner'

const STORAGE_KEY = 'hey-usa-saved-routes'

export interface SavedRoute {
  id: string
  name: string
  stops: StopOption[]
  createdAt: string
}

/** Google Maps multi-stop directions URL for a list of stops */
export function googleMapsUrl(stops: StopOption[]): string {
  return `https://www.google.com/maps/dir/${stops.map((s) => `${s.lat},${s.lng}`).join('/')}`
}

/** Default name for a route: first stop → last stop */
export function suggestRouteName(stops: StopOption[]): string {
  if (stops.length === 0) return ''
  if (stops.length === 1) return stops[0].title
  return `${stops[0].title} → ${stops[stops.length - 1].title}`
}

function readStored(): SavedRoute[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Drop anything that lost its shape rather than rendering a broken row
    return parsed.filter(
      (r): r is SavedRoute =>
        !!r &&
        typeof (r as SavedRoute).id === 'string' &&
        typeof (r as SavedRoute).name === 'string' &&
        Array.isArray((r as SavedRoute).stops) &&
        (r as SavedRoute).stops.length > 0,
    )
  } catch {
    // Private mode, cleared site data, or corrupt JSON — start empty
    return []
  }
}

function writeStored(routes: SavedRoute[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes))
  } catch (err) {
    console.warn('[map] Could not persist saved routes:', err)
  }
}

/**
 * Routes the user saved from the driving planner.
 *
 * Deliberately device-local: these are scratch routes someone builds while
 * planning, not trip data the family shares, so they never reach Supabase.
 */
export function useSavedRoutes() {
  const [routes, setRoutes] = useState<SavedRoute[]>(readStored)

  const saveRoute = useCallback((name: string, stops: StopOption[]): void => {
    if (stops.length < 2) return
    const route: SavedRoute = {
      id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || suggestRouteName(stops),
      stops,
      createdAt: new Date().toISOString(),
    }
    setRoutes((prev) => {
      const next = [route, ...prev]
      writeStored(next)
      return next
    })
  }, [])

  const deleteRoute = useCallback((id: string): void => {
    setRoutes((prev) => {
      const next = prev.filter((r) => r.id !== id)
      writeStored(next)
      return next
    })
  }, [])

  return { routes, saveRoute, deleteRoute }
}
