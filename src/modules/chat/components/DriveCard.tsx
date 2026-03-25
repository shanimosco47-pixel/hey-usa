import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/GlassCard'
import { Car } from 'lucide-react'

export interface DriveCardData {
  from: string
  to: string
  duration: string
  distance: string
  tips?: string[]
}

interface DriveCardProps {
  data: DriveCardData
}

export function DriveCard({ data }: DriveCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <GlassCard elevation={1} padding="sm" className="mt-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Car className="h-3.5 w-3.5 text-ios-orange" />
          <span className="text-caption font-semibold text-ios-orange">זמן נסיעה</span>
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-subhead font-medium">{data.from}</span>
          <span className="text-apple-secondary">←</span>
          <span className="text-subhead font-medium">{data.to}</span>
        </div>

        <div className="flex gap-4 mb-1">
          <div>
            <p className="text-caption text-apple-secondary">זמן</p>
            <p dir="ltr" className="text-body font-semibold">{data.duration}</p>
          </div>
          <div>
            <p className="text-caption text-apple-secondary">מרחק</p>
            <p dir="ltr" className="text-body font-semibold">{data.distance}</p>
          </div>
        </div>

        {data.tips && data.tips.length > 0 && (
          <div className="border-t border-black/5 pt-1.5 mt-1">
            {data.tips.map((tip, i) => (
              <p key={i} className="text-caption text-apple-secondary">💡 {tip}</p>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}
