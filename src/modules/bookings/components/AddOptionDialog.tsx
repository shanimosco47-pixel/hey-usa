import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CampsiteOption, BookingPlatform } from '@/lib/types'

interface AddOptionDialogProps {
  nightId: string
  onAdd: (option: Omit<CampsiteOption, 'id' | 'created_at' | 'updated_at'>) => void
  onClose: () => void
}

export default function AddOptionDialog({ nightId, onAdd, onClose }: AddOptionDialogProps) {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<BookingPlatform>('recreation_gov')
  const [platformUrl, setPlatformUrl] = useState('')
  const [price, setPrice] = useState('')
  const [hookups, setHookups] = useState('none')
  const [maxLength, setMaxLength] = useState('')
  const [bookingOpensAt, setBookingOpensAt] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      night_id: nightId,
      name: name.trim(),
      platform,
      platform_url: platformUrl || undefined,
      price_per_night: price ? Number(price) : undefined,
      rv_friendly: true,
      hookups: hookups || undefined,
      max_rv_length: maxLength ? Number(maxLength) : undefined,
      booking_opens_at: bookingOpensAt ? new Date(bookingOpensAt).toISOString() : undefined,
      alert_sent: false,
      booking_status: bookingOpensAt ? 'not_yet_open' : 'open',
      priority: 0,
      notes: notes || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">הוסף אפשרות קמפינג</h3>
          <button onClick={onClose} className="p-1 text-apple-tertiary hover:text-apple-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-apple-secondary mb-1">שם הקמפינג *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none"
              placeholder="Canyon Village Campground"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-apple-secondary mb-1">פלטפורמה</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as BookingPlatform)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none"
              >
                <option value="recreation_gov">Recreation.gov</option>
                <option value="reserve_america">ReserveAmerica</option>
                <option value="private">פרטי</option>
                <option value="other">אחר</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-apple-secondary mb-1">מחיר ללילה ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none"
                placeholder="35"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-apple-secondary mb-1">קישור להזמנה</label>
            <input
              value={platformUrl}
              onChange={(e) => setPlatformUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-apple-secondary mb-1">חיבורים</label>
              <select
                value={hookups}
                onChange={(e) => setHookups(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none"
              >
                <option value="none">ללא</option>
                <option value="partial">חלקי</option>
                <option value="full">מלא</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-apple-secondary mb-1">אורך מקס (רגל)</label>
              <input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none"
                placeholder="40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-apple-secondary mb-1">תאריך פתיחת הזמנה</label>
            <input
              type="datetime-local"
              value={bookingOpensAt}
              onChange={(e) => setBookingOpensAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-apple-secondary mb-1">הערות</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-ios-blue focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              הוסף
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
