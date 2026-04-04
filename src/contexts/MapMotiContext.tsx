import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface MapMotiAction {
  type: 'search_place' | 'show_directions'
  query?: string
  from?: string
  to?: string
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  lat?: number
  lng?: number
}

interface MapMotiContextType {
  pendingAction: MapMotiAction | null
  setPendingAction: (action: MapMotiAction | null) => void
  consumeAction: () => MapMotiAction | null
  chatPlaceContext: string | null
  setChatPlaceContext: (ctx: string | null) => void
}

const MapMotiContext = createContext<MapMotiContextType | null>(null)

export function MapMotiProvider({ children }: { children: ReactNode }) {
  const [pendingAction, setPendingAction] = useState<MapMotiAction | null>(null)
  const [chatPlaceContext, setChatPlaceContext] = useState<string | null>(null)

  const consumeAction = useCallback(() => {
    const action = pendingAction
    setPendingAction(null)
    return action
  }, [pendingAction])

  return (
    <MapMotiContext.Provider
      value={{
        pendingAction,
        setPendingAction,
        consumeAction,
        chatPlaceContext,
        setChatPlaceContext,
      }}
    >
      {children}
    </MapMotiContext.Provider>
  )
}

export function useMapMoti() {
  const ctx = useContext(MapMotiContext)
  if (!ctx) throw new Error('useMapMoti must be used within MapMotiProvider')
  return ctx
}
