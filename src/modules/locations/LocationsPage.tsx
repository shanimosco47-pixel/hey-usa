import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useAppData } from '@/contexts/AppDataContext'
import { LOCATIONS, getDaysForLocation, getLocationDateRange } from '@/data/locations'
import { LocationCard } from './components/LocationCard'
import { format, parseISO } from 'date-fns'

function formatDateRange(range: { start: string; end: string } | null): string | null {
  if (!range) return null
  const start = format(parseISO(range.start), 'dd/MM')
  const end = format(parseISO(range.end), 'dd/MM')
  return start === end ? start : `${start} – ${end}`
}

export default function LocationsPage() {
  const { itineraryDays, locationNotes, documents } = useAppData()

  const locationStats = useMemo(() => {
    return LOCATIONS.map((loc) => {
      const days = getDaysForLocation(loc.id, itineraryDays)
      const stopCount = days.reduce((acc, d) => acc + d.stops.length, 0)
      const dateRange = getLocationDateRange(loc.id, itineraryDays)
      const noteCount = locationNotes.filter((n) => n.locationId === loc.id).length
      const docCount = documents.filter((d) => d.locationId === loc.id).length
      return { location: loc, stopCount, dateRange, noteCount, docCount }
    })
  }, [itineraryDays, locationNotes, documents])

  return (
    <div className="min-h-screen cork-bg">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="px-4 pt-8 pb-6 md:px-8 md:pt-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-3">
              <MapPin className="h-4 w-4 text-white" />
              <span className="text-[13px] font-semibold text-white tracking-wide">
                {LOCATIONS.length} יעדים
              </span>
            </div>
            <h1 className="text-hero text-white drop-shadow-lg mb-1">
              🗺️ היעדים שלנו
            </h1>
            <p className="text-[15px] text-white/80 font-medium">
              לחצו על יעד כדי לראות הערות, מסמכים ותכנון
            </p>
          </motion.div>
        </div>

        {/* Cork frame edge */}
        <div className="h-3 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.08)]" />
      </div>

      {/* Polaroid Grid */}
      <div className="px-4 py-8 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7 max-w-6xl mx-auto">
          {locationStats.map((stat, index) => (
            <LocationCard
              key={stat.location.id}
              location={stat.location}
              dateRange={formatDateRange(stat.dateRange)}
              noteCount={stat.noteCount}
              docCount={stat.docCount}
              stopCount={stat.stopCount}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Bottom shadow for depth */}
      <div className="h-8 bg-gradient-to-t from-[rgba(0,0,0,0.1)] to-transparent" />
    </div>
  )
}
