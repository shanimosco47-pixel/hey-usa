import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Tent, CheckCircle2, AlertTriangle, Clock, Filter } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppData } from '@/contexts/AppDataContext'
import type { CampsiteNight } from '@/lib/types'
import NightCard from './components/NightCard'
import AddOptionDialog from './components/AddOptionDialog'

type FilterMode = 'all' | 'urgent' | 'open' | 'booked' | 'private'

export default function BookingsPage() {
  const {
    campsiteNights,
    updateCampsiteOption,
    deleteCampsiteOption,
    markNightBooked,
    addCampsiteOption,
  } = useAppData()

  const [filter, setFilter] = useState<FilterMode>('all')
  const [addingForNight, setAddingForNight] = useState<string | null>(null)

  // Categorize nights
  const { urgent, openNow, booked, noRush, all } = useMemo(() => {
    const now = new Date()
    const _urgent: CampsiteNight[] = []
    const _openNow: CampsiteNight[] = []
    const _booked: CampsiteNight[] = []
    const _noRush: CampsiteNight[] = []

    for (const night of campsiteNights) {
      if (night.status === 'booked') {
        _booked.push(night)
        continue
      }

      const options = night.options || []
      const hasUpcomingWindow = options.some((o) => {
        if (!o.booking_opens_at || o.booking_status !== 'not_yet_open') return false
        const diff = new Date(o.booking_opens_at).getTime() - now.getTime()
        return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000
      })
      const hasOpenRecGov = options.some(
        (o) => o.booking_status === 'open' && (o.platform === 'recreation_gov' || o.platform === 'reserve_america'),
      )
      const allPrivate = options.every((o) => o.platform === 'private' || o.platform === 'other')

      if (hasUpcomingWindow) _urgent.push(night)
      else if (hasOpenRecGov) _openNow.push(night)
      else if (allPrivate) _noRush.push(night)
      else _openNow.push(night)
    }

    return { urgent: _urgent, openNow: _openNow, booked: _booked, noRush: _noRush, all: campsiteNights }
  }, [campsiteNights])

  const filteredNights = useMemo(() => {
    switch (filter) {
      case 'urgent': return urgent
      case 'open': return openNow
      case 'booked': return booked
      case 'private': return noRush
      default: return all
    }
  }, [filter, urgent, openNow, booked, noRush, all])

  const bookedCount = booked.length
  const totalCount = all.length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100">
          <Tent className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">הזמנות קמפינג</h1>
          <p className="text-xs text-apple-secondary">
            {bookedCount} מתוך {totalCount} לילות הוזמנו
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'דחוף', count: urgent.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'פתוח', count: openNow.length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'הוזמן', count: booked.length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'ללא לחץ', count: noRush.length, icon: Filter, color: 'text-gray-400', bg: 'bg-gray-50' },
        ].map((stat) => (
          <div key={stat.label} className={cn('rounded-xl p-3 text-center', stat.bg)}>
            <stat.icon className={cn('h-4 w-4 mx-auto', stat.color)} />
            <div className={cn('text-lg font-bold', stat.color)}>{stat.count}</div>
            <div className="text-[10px] text-apple-tertiary">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'הכל' },
          { key: 'urgent', label: 'דחוף' },
          { key: 'open', label: 'פתוח' },
          { key: 'booked', label: 'הוזמן' },
          { key: 'private', label: 'פרטי' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              filter === tab.key
                ? 'bg-ios-blue text-white'
                : 'bg-gray-100 text-apple-secondary hover:bg-gray-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Nights list */}
      <div className="space-y-3">
        {filteredNights.length === 0 ? (
          <div className="text-center text-sm text-apple-tertiary py-8">
            אין לילות בקטגוריה זו
          </div>
        ) : (
          filteredNights.map((night, i) => (
            <motion.div
              key={night.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <NightCard
                night={night}
                onUpdateOption={updateCampsiteOption}
                onDeleteOption={deleteCampsiteOption}
                onBookOption={markNightBooked}
                onAddOption={(nightId) => setAddingForNight(nightId)}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Add option dialog */}
      {addingForNight && (
        <AddOptionDialog
          nightId={addingForNight}
          onAdd={addCampsiteOption}
          onClose={() => setAddingForNight(null)}
        />
      )}
    </div>
  )
}
