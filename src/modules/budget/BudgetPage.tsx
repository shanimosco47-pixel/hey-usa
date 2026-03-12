import { useState, useMemo } from 'react'
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
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { FAMILY_MEMBERS, getFamilyMember } from '@/lib/constants'
import {
  SAMPLE_EXPENSES,
  SAMPLE_BUDGET_SETTINGS,
} from './data/sampleExpenses'
import type { Expense, BudgetSettings } from '@/lib/types'
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
  '#c44d34',
  '#4a90d9',
  '#2d7d46',
  '#f5c542',
  '#6c5ce7',
  '#e8735e',
  '#00b894',
  '#636e72',
  '#0984e3',
]

export default function BudgetPage() {
  const [expenses, setExpenses] = useState<Expense[]>(SAMPLE_EXPENSES)
  const [settings] = useState<BudgetSettings>(SAMPLE_BUDGET_SETTINGS)
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
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      title: newExpense.title,
      amount: Number(newExpense.amount),
      currency: settings.currency,
      category: newExpense.category,
      paid_by: newExpense.paid_by,
      date: new Date().toISOString().split('T')[0],
      notes: newExpense.notes || undefined,
      created_at: new Date().toISOString(),
    }
    setExpenses((prev) => [expense, ...prev])
    setNewExpense({ title: '', amount: '', category: 'food', paid_by: 'aba', notes: '' })
    setShowAddForm(false)
  }

  function handleDelete(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brown">תקציב</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          הוצאה חדשה
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
          <p className="text-xs text-brown-light">תקציב כולל</p>
          <p className="mt-1 text-lg font-bold text-brown">
            {settings.currency}{settings.total_budget.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
          <p className="text-xs text-brown-light">הוצאות</p>
          <p className="mt-1 text-lg font-bold text-terracotta">
            {settings.currency}{totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
          <p className="text-xs text-brown-light">נותר</p>
          <p className={cn('mt-1 text-lg font-bold', remaining >= 0 ? 'text-sage' : 'text-terracotta')}>
            {settings.currency}{remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brown-light">ניצול תקציב</span>
          <span className={cn('font-bold', spentPercent > 80 ? 'text-terracotta' : 'text-sage')}>
            {spentPercent.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-sand-dark">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              spentPercent > 80 ? 'bg-terracotta' : spentPercent > 50 ? 'bg-gold' : 'bg-sage',
            )}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="rounded-2xl bg-white/90 p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-brown">הוצאה חדשה</h3>
          <input
            type="text"
            placeholder="שם ההוצאה"
            value={newExpense.title}
            onChange={(e) => setNewExpense((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50"
          />
          <input
            type="number"
            placeholder="סכום"
            value={newExpense.amount}
            onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
            className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50"
          />
          <select
            value={newExpense.category}
            onChange={(e) => setNewExpense((p) => ({ ...p, category: e.target.value }))}
            className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown"
          >
            {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={newExpense.paid_by}
            onChange={(e) => setNewExpense((p) => ({ ...p, paid_by: e.target.value as 'aba' | 'ima' | 'kid1' | 'kid2' | 'kid3' }))}
            className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown"
          >
            {FAMILY_MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>{m.avatar_emoji} {m.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAddExpense}
              className="flex-1 rounded-xl bg-sage px-4 py-2 text-sm font-medium text-white"
            >
              הוסף
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-xl bg-sand-dark px-4 py-2 text-sm font-medium text-brown-light"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-brown">חלוקה לפי קטגוריה</h3>
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
              <Tooltip
                formatter={(value) => `${settings.currency}${Number(value).toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs text-brown-light">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-brown">תקציב מול הוצאות</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => `${settings.currency}${Number(value).toLocaleString()}`}
              />
              <Bar dataKey="budget" fill="#e8d5b8" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="spent" fill="#c44d34" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs text-brown-light">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-[#e8d5b8]" />
              תקציב
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-terracotta" />
              הוצאות
            </div>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-brown">הוצאות אחרונות</h3>
        {expenses.map((expense) => {
          const IconComp = CATEGORY_ICONS[expense.category] || DollarSign
          const member = getFamilyMember(expense.paid_by)
          return (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-dark/50">
                <IconComp className="h-5 w-5 text-brown-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brown truncate">{expense.title}</p>
                <p className="text-xs text-brown-light">
                  {member.avatar_emoji} {member.name} · {expense.date}
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-sm font-bold text-terracotta">
                  {expense.currency}{expense.amount.toLocaleString()}
                </p>
                <p className="text-xs text-brown-light">
                  {EXPENSE_CATEGORIES[expense.category]?.label}
                </p>
              </div>
              <button
                onClick={() => handleDelete(expense.id)}
                className="shrink-0 rounded-lg p-1.5 text-brown-light/50 hover:bg-terracotta/10 hover:text-terracotta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
