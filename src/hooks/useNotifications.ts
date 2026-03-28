import { useState, useEffect, useCallback, useRef } from 'react'
import type { Task, CampsiteBooking } from '@/lib/types'
import { sendNotification, getOverdueTasks, getUpcomingRegistrations } from '@/lib/notifications'

const LS_ENABLED_KEY = 'hey-usa-notifications-enabled'
const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(LS_ENABLED_KEY) === 'true'
  } catch {
    return false
  }
}

export function useNotifications(tasks: Task[], campsiteBookings: CampsiteBooking[]) {
  const [enabled, setEnabled] = useState(loadEnabled)
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied' as const
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const toggleEnabled = useCallback(async () => {
    if (!enabled) {
      // Turning on — need permission first
      let perm = permission
      if (perm !== 'granted') {
        perm = await requestPermission()
      }
      if (perm === 'granted') {
        setEnabled(true)
        localStorage.setItem(LS_ENABLED_KEY, 'true')
      }
    } else {
      // Turning off
      setEnabled(false)
      localStorage.setItem(LS_ENABLED_KEY, 'false')
    }
  }, [enabled, permission, requestPermission])

  const checkAndNotify = useCallback(
    (taskList: Task[], bookings: CampsiteBooking[]) => {
      if (!enabled || Notification.permission !== 'granted') return

      const overdue = getOverdueTasks(taskList)
      for (const task of overdue) {
        const isOverdue = task.due_date! < new Date().toISOString().slice(0, 10)
        sendNotification(
          isOverdue ? '⏰ משימה באיחור' : '📋 משימה להיום',
          task.title,
          `task-${task.id}`,
        )
      }

      const upcoming = getUpcomingRegistrations(bookings)
      for (const booking of upcoming) {
        sendNotification(
          '🏕️ הרשמה נפתחת בקרוב',
          `${booking.location} — ${booking.registration_opens}`,
          `reg-${booking.id}`,
        )
      }
    },
    [enabled],
  )

  // Run check on mount and every 30 minutes
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    checkAndNotify(tasks, campsiteBookings)

    intervalRef.current = setInterval(() => {
      checkAndNotify(tasks, campsiteBookings)
    }, CHECK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, tasks, campsiteBookings, checkAndNotify])

  // Also check on window focus
  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => checkAndNotify(tasks, campsiteBookings)
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [enabled, tasks, campsiteBookings, checkAndNotify])

  return {
    enabled,
    permission,
    toggleEnabled,
    requestPermission,
    supported: typeof Notification !== 'undefined',
  }
}
