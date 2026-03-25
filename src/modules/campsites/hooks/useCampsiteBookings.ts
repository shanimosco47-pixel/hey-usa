import { useState, useEffect, useCallback } from 'react'
import type { CampsiteBooking, BookingChangeEntry } from '@/types'
import { supabase } from '@/lib/supabase'
import { sampleCampsiteBookings } from '../data/campsiteBookings'

const LS_KEY = 'hey-usa-campsite-bookings'
const LS_VERSION_KEY = 'hey-usa-campsite-bookings-v'
const CACHE_VERSION = '2'

function loadFromLocalStorage(): CampsiteBooking[] | null {
  try {
    if (localStorage.getItem(LS_VERSION_KEY) !== CACHE_VERSION) {
      localStorage.removeItem(LS_KEY)
      return null
    }
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToLocalStorage(data: CampsiteBooking[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
  localStorage.setItem(LS_VERSION_KEY, CACHE_VERSION)
}

export function useCampsiteBookings() {
  const [bookings, setBookings] = useState<CampsiteBooking[]>(
    () => loadFromLocalStorage() ?? sampleCampsiteBookings,
  )
  const [loading, setLoading] = useState(true)

  // Fetch from Supabase on mount
  useEffect(() => {
    async function fetchFromSupabase() {
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('campsite_bookings')
          .select('*')
          .order('check_in', { ascending: true })
        if (error) throw error
        if (data && data.length > 0) {
          const mapped: CampsiteBooking[] = data.map((r) => ({
            id: r.id,
            check_in: r.check_in,
            check_out: r.check_out,
            location: r.location,
            area: r.area ?? '',
            type: r.type ?? 'unknown',
            priority: r.priority ?? 'primary',
            registration_opens: r.registration_opens ?? undefined,
            status: r.status ?? 'not_open',
            confirmation: r.confirmation ?? undefined,
            booking_url: r.booking_url ?? undefined,
            cost: r.cost != null ? Number(r.cost) : undefined,
            cancellation_deadline: r.cancellation_deadline ?? undefined,
            refund_amount: r.refund_amount != null ? Number(r.refund_amount) : undefined,
            notes: r.notes ?? '',
            source: r.source ?? 'manual',
            changelog: r.changelog ?? [],
            created_at: r.created_at,
            updated_at: r.updated_at,
          }))
          setBookings(mapped)
          saveToLocalStorage(mapped)
        }
      } catch (err) {
        console.warn('Failed to fetch campsite bookings from Supabase, using local data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFromSupabase()
  }, [])

  const updateBooking = useCallback(
    async (id: string, changes: Partial<CampsiteBooking>) => {
      const now = new Date().toISOString()

      setBookings((prev) => {
        const updated = prev.map((b) => {
          if (b.id !== id) return b
          // Build changelog entries
          const newEntries: BookingChangeEntry[] = []
          for (const [key, val] of Object.entries(changes)) {
            if (key === 'changelog' || key === 'updated_at') continue
            const oldVal = String((b as unknown as Record<string, unknown>)[key] ?? '')
            const newVal = String(val ?? '')
            if (oldVal !== newVal) {
              newEntries.push({ field: key, old_value: oldVal, new_value: newVal, changed_at: now })
            }
          }
          return {
            ...b,
            ...changes,
            changelog: [...(b.changelog ?? []), ...newEntries],
            updated_at: now,
          }
        })
        saveToLocalStorage(updated)
        return updated
      })

      // Sync to Supabase
      if (supabase) {
        try {
          // Re-read current state for changelog
          const current = bookings.find((b) => b.id === id)
          const newEntries: BookingChangeEntry[] = []
          if (current) {
            for (const [key, val] of Object.entries(changes)) {
              if (key === 'changelog' || key === 'updated_at') continue
              const oldVal = String((current as unknown as Record<string, unknown>)[key] ?? '')
              const newVal = String(val ?? '')
              if (oldVal !== newVal) {
                newEntries.push({
                  field: key,
                  old_value: oldVal,
                  new_value: newVal,
                  changed_at: now,
                })
              }
            }
          }
          const { error } = await supabase
            .from('campsite_bookings')
            .update({
              ...changes,
              changelog: supabase ? [...(current?.changelog ?? []), ...newEntries] : undefined,
              updated_at: now,
            } as unknown as Record<string, unknown>)
            .eq('id', id)
          if (error) console.warn('Supabase update failed:', error)
        } catch (err) {
          console.warn('Failed to sync update to Supabase:', err)
        }
      }
    },
    [bookings],
  )

  const addBooking = useCallback(
    async (booking: Omit<CampsiteBooking, 'id' | 'changelog' | 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString()
      const newBooking: CampsiteBooking = {
        ...booking,
        source: 'manual',
        id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        changelog: [],
        created_at: now,
        updated_at: now,
      }

      setBookings((prev) => {
        const updated = [...prev, newBooking].sort(
          (a, b) => a.check_in.localeCompare(b.check_in) || a.priority.localeCompare(b.priority),
        )
        saveToLocalStorage(updated)
        return updated
      })

      if (supabase) {
        try {
          const { error } = await supabase
            .from('campsite_bookings')
            .insert(newBooking as unknown as Record<string, unknown>)
          if (error) console.warn('Supabase insert failed:', error)
        } catch (err) {
          console.warn('Failed to sync insert to Supabase:', err)
        }
      }

      return newBooking
    },
    [],
  )

  const sortedBookings = [...bookings].sort(
    (a, b) => a.check_in.localeCompare(b.check_in) || a.priority.localeCompare(b.priority),
  )

  const confirmedCount = bookings.filter(
    (b) => b.status === 'confirmed' && b.priority === 'primary',
  ).length
  const totalNights = new Set(
    bookings.filter((b) => b.priority === 'primary').map((b) => b.check_in),
  ).size

  return {
    bookings: sortedBookings,
    loading,
    updateBooking,
    addBooking,
    confirmedCount,
    totalNights,
  }
}
