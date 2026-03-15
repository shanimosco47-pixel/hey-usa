import { useState, useMemo, useEffect } from 'react'
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
  Calculator,
  Receipt,
  Pencil,
  Check,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { FAMILY_MEMBERS, getFamilyMember } from '@/lib/constants'
import { useAppData } from '@/contexts/AppDataContext'
import type { Expense } from '@/lib/types'
import { isSampleData } from '@/lib/sampleData'
import { DailyBudgetTable } from './components/DailyBudgetTable'
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

type BudgetTab = 'planning' | 'actual' | 'daily'

export default function BudgetPage() {
  const { budgetSettings: settings, expenses, addExpense, deleteExpense, updateBudgetCategory, updateTotalBudget, itineraryDays } = useAppData()
  const [activeTab, setActiveTab] = useState<BudgetTab>('planning')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editingTotal, setEditingTotal] = useState(false)
  const [editTotalValue, setEditTotalValue] = useState('')
  const [newExpense, setNewExpense] = useState<{
    title: string
    amount: string
    category: string
    paid_by: 'aba' | 'ima' | 'kid1' | 'kid2' | 'kid3'
    notes: string
    day_id: string
  }>({
    title: '',
    amount: '',
    category: 'food',
    paid_by: 'aba',
    notes: '',
    day_id: '',
  })

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )

  const remaining = settings.total_budget - totalSpent
  const spentPercent = settings.total_budget > 0 ? (totalSpent / settings.total_budget) * 100 : 0

  const spendingMood = useMemo(() => {
    if (spentPercent > 100) return 'חרגנו מהתקציב! 🚨'
    if (spentPercent >= 80) return 'אוי אוי, קרובים לגבול! 😬'
    if (spentPercent >= 60) return 'כדאי להתחיל לשים לב... 👀'
    if (spentPercent >= 30) return 'בדיוק בכיוון הנכון 👍'
    return 'חוסכים כמו ישראלים אמיתיים 💪'
  }, [spentPercent])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    }
    return totals
  }, [expenses])

  const nonOtherPlanned = useMemo(
    () => Object.entries(settings.category_budgets)
      .filter(([cat]) => cat !== 'other')
      .reduce((sum, [, v]) => sum + v, 0),
    [settings.category_budgets],
  )

  const otherBudgetRemainder = settings.total_budget - nonOtherPlanned

  // Keep "other" category_budgets in sync with the calculated remainder
  useEffect(() => {
    if (settings.category_budgets['other'] !== otherBudgetRemainder) {
      updateBudgetCategory('other', otherBudgetRemainder)
    }
  }, [otherBudgetRemainder, settings.category_budgets, updateBudgetCategory])

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
    const matchedDay = itineraryDays.find((d) => d.id === newExpense.day_id)
    const expense: Omit<Expense, 'id' | 'created_at'> = {
      title: newExpense.title,
      amount: Number(newExpense.amount),
      currency: settings.currency,
      category: newExpense.category,
      paid_by: newExpense.paid_by,
      date: matchedDay?.date || new Date().toISOString().split('T')[0],
      day_id: newExpense.day_id || undefined,
      notes: newExpense.notes || undefined,
    }
    addExpense(expense)
    setNewExpense({ title: '', amount: '', category: 'food', paid_by: 'aba', notes: '', day_id: '' })
    setShowAddForm(false)
  }

  function handleEditCategory(cat: string) {
    setEditingCategory(cat)
    setEditValue(String(settings.category_budgets[cat] || 0))
  }

  function handleSaveCategory(cat: string) {
    const val = Number(editValue)
    if (!isNaN(val) && val >= 0) {
      updateBudgetCategory(cat, val)
    }
    setEditingCategory(null)
  }

  function handleEditTotal() {
    setEditingTotal(true)
    setEditTotalValue(String(settings.total_budget))
  }

  function handleSaveTotal() {
    const val = Number(editTotalValue)
    if (!isNaN(val) && val > 0) {
      updateTotalBudget(val)
    }
    setEditingTotal(false)
  }

  const inputClass = "w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary hover:bg-black/[0.02] focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30 transition-colors"

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
        <p className="mt-2 text-center text-xs font-medium text-apple-secondary">
          {spendingMood}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-apple-lg glass p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('planning')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            activeTab === 'planning'
              ? 'bg-white text-apple-primary shadow-sm'
              : 'text-apple-secondary hover:text-apple-primary hover:bg-black/[0.04]',
          )}
        >
          <Calculator className="h-4 w-4" />
          <span>תכנון תקציב</span>
        </button>
        <button
          onClick={() => setActiveTab('actual')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            activeTab === 'actual'
              ? 'bg-white text-apple-primary shadow-sm'
              : 'text-apple-secondary hover:text-apple-primary hover:bg-black/[0.04]',
          )}
        >
          <Receipt className="h-4 w-4" />
          <span>הוצאות בפועל</span>
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            activeTab === 'daily'
              ? 'bg-white text-apple-primary shadow-sm'
              : 'text-apple-secondary hover:text-apple-primary hover:bg-black/[0.04]',
          )}
        >
          <CalendarDays className="h-4 w-4" />
          <span>יומי</span>
        </button>
      </div>

      {/* ═══ PLANNING TAB ═══ */}
      {activeTab === 'planning' && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Total Budget Editor */}
          <div className="glass rounded-apple-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-apple-primary">תקציב כולל לטיול</h3>
              {!editingTotal ? (
                <button
                  onClick={handleEditTotal}
                  className="flex items-center gap-1 text-xs text-ios-blue hover:underline"
                >
                  <Pencil className="h-3 w-3" />
                  ערוך
                </button>
              ) : (
                <button
                  onClick={handleSaveTotal}
                  className="flex items-center gap-1 text-xs text-ios-green font-medium"
                >
                  <Check className="h-3 w-3" />
                  שמור
                </button>
              )}
            </div>
            {editingTotal ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-apple-primary">{settings.currency}</span>
                <input
                  type="number"
                  value={editTotalValue}
                  onChange={(e) => setEditTotalValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTotal()}
                  className={cn(inputClass, 'text-lg font-bold')}
                  autoFocus
                />
              </div>
            ) : (
              <p className="text-2xl font-bold text-apple-primary">
                {settings.currency}{settings.total_budget.toLocaleString()}
              </p>
            )}
          </div>

          {/* Category Budgets */}
          <div className="glass rounded-apple-lg p-4 shadow-sm">
            <h3 className="text-sm font-bold text-apple-primary mb-3">תקציב לפי קטגוריה</h3>
            <div className="space-y-2">
              {Object.entries(EXPENSE_CATEGORIES).map(([cat, { label }]) => {
                const IconComp = CATEGORY_ICONS[cat] || DollarSign
                const isOther = cat === 'other'
                const planned = isOther ? otherBudgetRemainder : (settings.category_budgets[cat] || 0)
                const spent = categoryTotals[cat] || 0
                const catPercent = planned > 0 ? (spent / planned) * 100 : 0
                const isEditing = editingCategory === cat

                return (
                  <div key={cat} className={cn('rounded-xl border p-3', isOther ? 'border-black/[0.08] bg-black/[0.02]' : 'border-black/[0.04]')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isOther ? 'bg-black/[0.06]' : 'bg-black/[0.04]')}>
                        <IconComp className={cn('h-4 w-4', isOther ? 'text-apple-tertiary' : 'text-apple-secondary')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn('text-sm font-medium', isOther ? 'text-apple-secondary' : 'text-apple-primary')}>
                            {label}
                            {isOther && <span className="text-[10px] text-apple-tertiary mr-1"> (יתרה אוטומטית)</span>}
                          </span>
                          {isOther ? (
                            <span className={cn('text-sm font-medium', planned < 0 ? 'text-ios-red' : 'text-apple-secondary')}>
                              {settings.currency}{planned.toLocaleString()}
                            </span>
                          ) : isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory(cat)}
                                className="w-24 rounded-lg border border-ios-blue/30 bg-surface-primary px-2 py-1 text-sm text-left font-medium focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
                                autoFocus
                                dir="ltr"
                              />
                              <button
                                onClick={() => handleSaveCategory(cat)}
                                className="rounded-lg p-1 text-ios-green hover:bg-ios-green/10"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="flex items-center gap-1 text-sm font-medium text-apple-primary hover:text-ios-blue"
                            >
                              {settings.currency}{planned.toLocaleString()}
                              <Pencil className="h-3 w-3 text-apple-tertiary" />
                            </button>
                          )}
                        </div>
                        {/* Mini progress bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-black/[0.04]">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                catPercent > 100 ? 'bg-ios-red' : catPercent > 70 ? 'bg-ios-orange' : 'bg-ios-blue',
                              )}
                              style={{ width: `${Math.min(Math.max(catPercent, 0), 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-apple-tertiary whitespace-nowrap">
                            {settings.currency}{spent.toLocaleString()} / {settings.currency}{planned.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bar Chart: Budget vs Actual */}
          <div className="glass rounded-apple-lg p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-bold text-apple-primary">תקציב מול הוצאות</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
                <Tooltip content={<GlassTooltip currency={settings.currency} />} />
                <Bar dataKey="budget" name="תקציב" fill="#d1d1d6" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="spent" name="הוצאות" fill="#007AFF" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-xs text-apple-secondary">
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full bg-[#d1d1d6]" />
                תקציב מתוכנן
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2.5 w-2.5 rounded-full bg-ios-blue" />
                הוצאות בפועל
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ ACTUAL EXPENSES TAB ═══ */}
      {activeTab === 'actual' && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Add expense button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4" />
              הוצאה חדשה
            </Button>
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
                className={inputClass}
              />
              <input
                type="number"
                placeholder="סכום"
                value={newExpense.amount}
                onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
                className={inputClass}
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense((p) => ({ ...p, category: e.target.value }))}
                className={inputClass}
              >
                {Object.entries(EXPENSE_CATEGORIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={newExpense.paid_by}
                onChange={(e) => setNewExpense((p) => ({ ...p, paid_by: e.target.value as 'aba' | 'ima' | 'kid1' | 'kid2' | 'kid3' }))}
                className={inputClass}
              >
                {FAMILY_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>{m.avatar_emoji} {m.name}</option>
                ))}
              </select>
              <select
                value={newExpense.day_id}
                onChange={(e) => setNewExpense((p) => ({ ...p, day_id: e.target.value }))}
                className={inputClass}
              >
                <option value="">יום בטיול (אופציונלי)</option>
                {itineraryDays.map((d, i) => (
                  <option key={d.id} value={d.id}>יום {i + 1} — {d.title}</option>
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

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="glass rounded-apple-lg p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-bold text-apple-primary">חלוקת הוצאות בפועל</h3>
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
          )}

          {/* Expense List */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-apple-primary">
              הוצאות ({expenses.length})
            </h3>
            {expenses.length === 0 && (
              <div className="glass rounded-apple-lg p-6 text-center shadow-sm">
                <Receipt className="mx-auto h-8 w-8 text-apple-tertiary mb-2" />
                <p className="text-sm text-apple-secondary">עדיין אין הוצאות</p>
                <p className="text-xs text-apple-tertiary mt-1">לחצו על "הוצאה חדשה" כדי להתחיל</p>
              </div>
            )}
            {expenses.map((expense) => {
              const IconComp = CATEGORY_ICONS[expense.category] || DollarSign
              const member = getFamilyMember(expense.paid_by)
              const planned = settings.category_budgets[expense.category] || 0
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 glass rounded-apple-lg p-3 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/[0.04]">
                    <IconComp className="h-5 w-5 text-apple-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-apple-primary truncate">{isSampleData(expense.id) && <span className="text-[10px] ml-1 opacity-60" title="דוגמה מאת מוטי">🤖</span>}{expense.title}</p>
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
                      {planned > 0 && (
                        <span className="text-apple-tertiary"> / {expense.currency}{planned.toLocaleString()}</span>
                      )}
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
          </div>
        </motion.div>
      )}

      {/* ═══ DAILY TAB ═══ */}
      {activeTab === 'daily' && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DailyBudgetTable />
        </motion.div>
      )}
    </div>
  )
}
