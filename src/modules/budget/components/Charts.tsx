import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PIE_COLORS } from '@/constants'

function GlassTooltip({ active, payload, label, currency }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string; currency: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-apple px-3 py-2 shadow-glass-hover border border-black/[0.06]">
      {label && <p className="text-xs text-apple-secondary mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium text-apple-primary">
          {entry.name}: {currency}{Number(entry.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

interface BudgetBarChartProps {
  data: Array<{ name: string; budget: number; spent: number }>
  currency: string
}

export function BudgetBarChart({ data, currency }: BudgetBarChartProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
          <Tooltip content={<GlassTooltip currency={currency} />} />
          <Bar dataKey="budget" name="תקציב" fill="#8E8E93" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="spent" name="הוצאות" fill="#007AFF" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-4 text-xs text-apple-secondary">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-ios-gray" />
          תקציב מתוכנן
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-ios-blue" />
          הוצאות בפועל
        </div>
      </div>
    </>
  )
}

interface BudgetPieChartProps {
  data: Array<{ name: string; value: number }>
  currency: string
}

export function BudgetPieChart({ data, currency }: BudgetPieChartProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<GlassTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1 text-xs text-apple-secondary">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {entry.name}
          </div>
        ))}
      </div>
    </>
  )
}
