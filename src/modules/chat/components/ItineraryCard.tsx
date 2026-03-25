import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/GlassCard'
import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface ItineraryCardData {
  dayId: string
  dayNumber: number
  title: string
  date: string
  stops: Array<{
    title: string
    time?: string
    category?: string
  }>
  weather?: {
    emoji: string
    temp: string
  }
}

interface ItineraryCardProps {
  data: ItineraryCardData
}

const categoryEmojis: Record<string, string> = {
  activity: '🎯',
  food: '🍽️',
  drive: '🚗',
  camp: '⛺',
  photo_op: '📸',
  shopping: '🛍️',
}

export function ItineraryCard({ data }: ItineraryCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div onClick={() => navigate(`/itinerary/${data.dayId}`)} className="cursor-pointer">
      <GlassCard elevation={1} padding="sm" className="mt-2 hover:shadow-glass-hover transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-ios-purple" />
            <span className="text-caption font-semibold text-ios-purple">יום {data.dayNumber}</span>
          </div>
          {data.weather && (
            <span className="text-caption">
              {data.weather.emoji} {data.weather.temp}
            </span>
          )}
        </div>

        <p className="text-subhead font-semibold mb-0.5">{data.title}</p>
        <p dir="ltr" className="text-caption text-apple-secondary mb-2">{data.date}</p>

        {data.stops.length > 0 && (
          <div className="space-y-1 border-t border-black/5 pt-1.5">
            {data.stops.slice(0, 5).map((stop, i) => (
              <div key={i} className="flex items-center gap-2 text-caption">
                <span>{categoryEmojis[stop.category || 'activity'] || '🎯'}</span>
                {stop.time && <span dir="ltr" className="text-apple-secondary shrink-0">{stop.time}</span>}
                <span className="truncate">{stop.title}</span>
              </div>
            ))}
            {data.stops.length > 5 && (
              <p className="text-caption text-apple-secondary">+{data.stops.length - 5} עוד...</p>
            )}
          </div>
        )}
      </GlassCard>
      </div>
    </motion.div>
  )
}
