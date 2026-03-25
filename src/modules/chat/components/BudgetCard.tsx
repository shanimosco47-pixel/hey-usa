import { motion } from 'framer-motion'
import { GlassCard } from '@/components/shared/GlassCard'
import { Wallet } from 'lucide-react'

export interface BudgetCardData {
  total: number
  spent: number
  categories: Array<{
    label: string
    allocated: number
    spent: number
  }>
}

interface BudgetCardProps {
  data: BudgetCardData
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  )
}

export function BudgetCard({ data }: BudgetCardProps) {
  const totalPercent = data.total > 0 ? Math.round((data.spent / data.total) * 100) : 0
  const totalColor = totalPercent > 90 ? 'bg-ios-red' : totalPercent > 70 ? 'bg-ios-orange' : 'bg-ios-green'

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <GlassCard elevation={1} padding="sm" className="mt-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Wallet className="h-3.5 w-3.5 text-ios-green" />
          <span className="text-caption font-semibold text-ios-green">תקציב</span>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-subhead mb-1">
            <span className="font-medium">סה"כ</span>
            <span dir="ltr" className="font-semibold">₪{data.spent.toLocaleString()} / ₪{data.total.toLocaleString()}</span>
          </div>
          <ProgressBar percent={totalPercent} color={totalColor} />
        </div>

        {data.categories.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-black/5">
            {data.categories.slice(0, 5).map((cat) => {
              const pct = cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 100) : 0
              const color = pct > 90 ? 'bg-ios-red' : pct > 70 ? 'bg-ios-orange' : 'bg-ios-blue'
              return (
                <div key={cat.label}>
                  <div className="flex justify-between text-caption mb-0.5">
                    <span>{cat.label}</span>
                    <span dir="ltr">₪{cat.spent.toLocaleString()} / ₪{cat.allocated.toLocaleString()}</span>
                  </div>
                  <ProgressBar percent={pct} color={color} />
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}
