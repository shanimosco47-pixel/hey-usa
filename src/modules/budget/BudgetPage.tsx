import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Plus,
  Plane,
  Bed,
  UtensilsCrossed,
  Car,
  Ticket,
  ShoppingBag,
  Phone,
  Shield,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { FAMILY_MEMBERS, getFamilyMember } from '@/lib/constants'
import { useTripData } from '@/contexts/TripDataContext'
import type { Expense } from '@/lib/types'
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

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  flights: Plane,
  accommodation: Bed,
  food: UtensilsCrossed,
  transport: Car,
  attractions: Ticket,
  shopping: ShoppingBag,
  communication: Phone,
  insurance: Shield,
  other: MoreHorizontal,
}

const PIE_COLORS = [
  '#007AFF', '#FF3B30', '#34C759', '#FF9500', '#5856D6',
  '#FF2D55', '#5AC8FA', '#AF52DE', '#FFCC00',
]

export default function BudgetPage() {
  const { budgetSettings: settings, expenses, addExpense, deleteExpense } = useTripData()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState<{
    title: string
    amount: string
    category: string
    paid_by: 'aba' | 'ima' | 'kid1' | 'kid2' | 'kid3'
    notes: string
  }>({
    title: '',
    amount: '',
    category: 'food',
    paid_by: 'aba',
    notes: '',
  })

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )

  const remaining = settings.total_budget - totalSpent
  const spentPercent = (totalSpent / settings.total_budget) * 100

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    }
    return totals
  }, [expenses])

  const pieData = useMemo(
    () =>
      Object.entries(categoryTotals).map(([cat, amount]) => ({
        name: EXPENSE_CATEGORIES[cat]?.label || cat,
        value: amount,
      })),
    [categoryTotals],
  )

  const barData = useMemo(
    () =>
      Object.entries(settings.category_budgets).map(([cat, budget]) => ({
        name: EXPENSE_CATEGORIES[cat]?.label || cat,
        budget,
        spent: categoryTotals[cat] || 0,
      })),
    [settings.category_budgets, categoryTotals],
  )

  function handleAddExpense() {
    if (!newExpense.title || !newExpense.amount) return
    const expense: Omit<Expense, 'id' | 'created_at'> = {
      title: newExpense.title,
      amount: Number(newExpense.amount),
      currency: settings.currency,
      category: newExpense.category,
      paid_by: newExpense.paid_by,
      date: new Date().toISOString().split('T')[0],
      notes: newExpense.notes || undefined,
    }
    addExpense(expense)
    setNewExpense({ title: '', amount: '', category: 'food', paid_by: 'aba', notes: '' })
    setShowAddForm(false)
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h1 className="text-2xl font-bold text-apple-primary">תקציב</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4" />
          הוצאה חדשה
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-apple-lg p-4 text-center shadow-sm">
          <p className="text-xs text-apple-secondary">תקציב כולל</p>
          <p className="mt-1 text-lg font-bold text-apple-primary">
            {settings.currency}{settings.total_budget.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-apple-lg p-4 text-center shadow-sm">
          <p className="text-xs text-apple-secondary">הוצאות</p>
          <p className="mt-1 text-lg font-bold text-ios-red">
            {settings.currency}{totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="glass rounded-apple-lg p-4 text-center shadow-sm">
          <p className="text-xs text-apple-secondary">נותר</p>
          <p className={cn('mt-1 text-lg font-bold', remaining >= 0 ? 'text-ios-green' : 'text-ios-red')}>
            {settings.currency}{remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass rounded-apple-lg p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-apple-secondary">ניצול תקציב</span>
          <span className={cn('font-bold', spentPercent > 80 ? 'text-ios-red' : 'text-ios-green')}>
            {spentPercent.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/[0.04]">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              spentPercent > 80 ? 'bg-ios-red' : spentPercent > 50 ? 'bg-ios-orange' : 'bg-ios-green',
            )}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="glass rounded-apple-lg p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-apple-primary">הוצאה חדשה</h3>
          <input
            type="text"
            placeholder="שם ההוצאה"
            value={newExpense.title}
            onChange={(e) => setNewExpense((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary hover:bg-black/[0.02] focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30 transition-colors"
          />
          <input
            type="number"
            placeholder="סכום"
            value={newExpense.amount}
            onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
            className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary hover:bg-black/[0.02] focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30 transition-colors"
          />
          <select
            value={newExpense.category}
            onChange={(e) => setNewExpense((p) => ({ ...p, category: e.target.value }))}
            className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary hover:bg-black/[0.02] focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30 transition-colors"
          >
            {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={newExpense.paid_by}
            onChange={(e) => setNewExpense((p) => ({ ...p, paid_by: e.target.value as 'aba' | 'ima' | 'kid1' | 'kid2' | 'kid3' }))}
            className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary hover:bg-black/[0.02] focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30 transition-colors"
          >
            {FAMILY_MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>{m.avatar_emoji} {m.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button onClick={handleAddExpense} variant="success" className="flex-1">
              הוסף
            </Button>
            <Button onClick={() => setShowAddForm(false)} variant="secondary">
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Pie Chart */}
        <div className="glass rounded-apple-lg p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-apple-primary">חלוקה לפי קטגוריה</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip currency={settings.currency} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs text-apple-secondary">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass rounded-apple-lg p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-apple-primary">תקציב מול הוצאות</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
              <Tooltip content={<GlassTooltip currency={settings.currency} />} />
              <Bar dataKey="budget" fill="#d1d1d6" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="spent" fill="#007AFF" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs text-apple-secondary">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[#d1d1d6]" />
              תקציב
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-ios-blue" />
              הוצאות
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h3 className="text-sm font-bold text-apple-primary">הוצאות אחרונות</h3>
        {expenses.map((expense) => {
          const IconComp = CATEGORY_ICONS[expense.category] || DollarSign
          const member = getFamilyMember(expense.paid_by)
          return (
            <div
              key={expense.id}
              className="flex items-center gap-3 glass rounded-apple-lg p-3 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04]">
                <IconComp className="h-5 w-5 text-apple-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-apple-primary truncate">{expense.title}</p>
                <p className="text-xs text-apple-secondary">
                  {member.avatar_emoji} {member.name} · {expense.date}
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-sm font-bold text-ios-red">
                  {expense.currency}{expense.amount.toLocaleString()}
                </p>
                <p className="text-xs text-apple-secondary">
                  {EXPENSE_CATEGORIES[expense.category]?.label}
                </p>
              </div>
              <button
                onClick={() => deleteExpense(expense.id)}
                className="shrink-0 rounded-lg p-1.5 text-apple-tertiary hover:bg-ios-red/10 hover:text-ios-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
