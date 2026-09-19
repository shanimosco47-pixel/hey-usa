import { act, renderHook } from '@testing-library/react'
import { googleMapsUrl, suggestRouteName, useSavedRoutes } from '../useSavedRoutes'
import type { StopOption } from '../../components/DrivingRoutePlanner'

const stop = (title: string, lat: number, lng: number): StopOption => ({
  label: title,
  title,
  lat,
  lng,
  dayIndex: 0,
})

const stops = [stop('Bozeman', 45.68, -111.04), stop('Jackson', 43.48, -110.76)]

beforeEach(() => {
  localStorage.clear()
})

describe('googleMapsUrl', () => {
  it('builds a multi-stop directions link in order', () => {
    expect(googleMapsUrl(stops)).toBe('https://www.google.com/maps/dir/45.68,-111.04/43.48,-110.76')
  })
})

describe('suggestRouteName', () => {
  it('names a route by its endpoints', () => {
    expect(suggestRouteName(stops)).toBe('Bozeman → Jackson')
  })

  it('falls back to the single stop, and to empty for none', () => {
    expect(suggestRouteName([stops[0]])).toBe('Bozeman')
    expect(suggestRouteName([])).toBe('')
  })
})

describe('useSavedRoutes', () => {
  it('saves a route and persists it for the next mount', () => {
    const { result } = renderHook(() => useSavedRoutes())
    act(() => result.current.saveRoute('ילוסטון', stops))

    expect(result.current.routes).toHaveLength(1)
    expect(result.current.routes[0].name).toBe('ילוסטון')

    const remount = renderHook(() => useSavedRoutes())
    expect(remount.result.current.routes[0].name).toBe('ילוסטון')
  })

  it('falls back to the suggested name when none is typed', () => {
    const { result } = renderHook(() => useSavedRoutes())
    act(() => result.current.saveRoute('   ', stops))
    expect(result.current.routes[0].name).toBe('Bozeman → Jackson')
  })

  it('refuses a route with fewer than two stops', () => {
    const { result } = renderHook(() => useSavedRoutes())
    act(() => result.current.saveRoute('חצי מסלול', [stops[0]]))
    expect(result.current.routes).toEqual([])
  })

  it('keeps ids distinct when two routes are saved in the same millisecond', () => {
    const { result } = renderHook(() => useSavedRoutes())
    act(() => {
      result.current.saveRoute('a', stops)
      result.current.saveRoute('b', stops)
    })
    const [first, second] = result.current.routes
    expect(first.id).not.toBe(second.id)
  })

  it('deletes only the route asked for', () => {
    const { result } = renderHook(() => useSavedRoutes())
    act(() => result.current.saveRoute('a', stops))
    act(() => result.current.saveRoute('b', stops))
    act(() => result.current.deleteRoute(result.current.routes[0].id))

    expect(result.current.routes).toHaveLength(1)
    expect(result.current.routes[0].name).toBe('a')
  })

  it('ignores corrupt storage instead of throwing', () => {
    localStorage.setItem('hey-usa-saved-routes', '{not json')
    const { result } = renderHook(() => useSavedRoutes())
    expect(result.current.routes).toEqual([])
  })

  it('drops stored rows that lost their shape', () => {
    localStorage.setItem(
      'hey-usa-saved-routes',
      JSON.stringify([
        { id: 'x', name: 'broken' },
        { id: 'y', name: 'ok', stops },
      ]),
    )
    const { result } = renderHook(() => useSavedRoutes())
    expect(result.current.routes.map((r) => r.name)).toEqual(['ok'])
  })
})
