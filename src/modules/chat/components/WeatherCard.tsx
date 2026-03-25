import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/GlassCard'
import { Cloud } from 'lucide-react'

export interface WeatherCardData {
  city: string
  date: string
  tempMin: number
  tempMax: number
  weatherEmoji: string
  weatherLabel: string
  precipitationProbability: number
}

interface WeatherCardProps {
  data: WeatherCardData | WeatherCardData[]
}

function WeatherRow({ w }: { w: WeatherCardData }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl">{w.weatherEmoji}</span>
        <div className="min-w-0">
          <p className="text-subhead font-medium text-apple-primary truncate">{w.city}</p>
          <p dir="ltr" className="text-caption text-apple-secondary">{w.date}</p>
        </div>
      </div>
      <div className="text-left shrink-0">
        <p dir="ltr" className="text-body font-semibold text-apple-primary">
          {w.tempMin}°–{w.tempMax}°C
        </p>
        {w.precipitationProbability > 0 && (
          <p className="text-caption text-ios-blue">💧 {w.precipitationProbability}%</p>
        )}
      </div>
    </div>
  )
}

export function WeatherCard({ data }: WeatherCardProps) {
  const items = Array.isArray(data) ? data : [data]

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <GlassCard elevation={1} padding="sm" className="mt-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Cloud className="h-3.5 w-3.5 text-ios-blue" />
          <span className="text-caption font-semibold text-ios-blue">מזג אוויר</span>
        </div>
        <div className="space-y-2">
          {items.map((w, i) => (
            <WeatherRow key={i} w={w} />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  )
}
