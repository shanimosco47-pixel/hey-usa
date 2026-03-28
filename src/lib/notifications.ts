import type { Task, CampsiteBooking } from '@/lib/types'

const LS_NOTIFIED_KEY = 'hey-usa-notifications-last-notified'

/** Send a browser notification, deduplicating by tag */
export function sendNotification(title: string, body: string, tag: string): void {
  if (Notification.permission !== 'granted') return

  const notifiedMap = getNotifiedMap()
  const today = new Date().toISOString().slice(0, 10)

  // Already notified for this tag today
  if (notifiedMap[tag] === today) return

  new Notification(title, { body, tag, icon: '/hey-usa/pwa-192x192.png' })

  notifiedMap[tag] = today
  localStorage.setItem(LS_NOTIFIED_KEY, JSON.stringify(notifiedMap))
}

function getNotifiedMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_NOTIFIED_KEY) || '{}')
  } catch {
    return {}
  }
}

/** Returns tasks that are due today or overdue (not done) */
export function getOverdueTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().slice(0, 10)
  return tasks.filter((t) => t.due_date && t.status !== 'done' && t.due_date <= today)
}

/** Returns bookings with registration opening within 3 days */
export function getUpcomingRegistrations(bookings: CampsiteBooking[]): CampsiteBooking[] {
  const today = new Date()
  const threeDaysFromNow = new Date(today)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const todayStr = today.toISOString().slice(0, 10)
  const futureStr = threeDaysFromNow.toISOString().slice(0, 10)

  return bookings.filter(
    (b) =>
      b.registration_opens &&
      b.status !== 'confirmed' &&
      b.status !== 'cancelled' &&
      b.registration_opens >= todayStr &&
      b.registration_opens <= futureStr,
  )
}
