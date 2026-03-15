import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { useAppData } from '@/contexts/AppDataContext'
import { Check, Pencil } from 'lucide-react'

// Budget categories for the table rows
const BUDGET_ROWS = [
  { key: 'accommodation', label: 'לינה / קמפינג', emoji: '🏕️' },
  { key: 'gas', label: 'דלק', emoji: '⛽' },
  { key: 'food', label: 'אוכל', emoji: '🍔' },
  { key: 'attractions', label: 'כניסה לאתרים', emoji: '🎟️' },
  { key: 'groceries', label: 'סופר / מכולת', emoji: '🛒' },
  { key: 'misc', label: 'שונות', emoji: '📦' },
] as const

type BudgetRowKey = (typeof BUDGET_ROWS)[number]['key']

// Pre-trip categories (separate from daily)
const PRETRIP_ROWS = [
  { key: 'flights', label: 'טיסות', emoji: '✈️' },
  { key: 'rv_rental', label: 'השכרת קרוואן', emoji: '🚐' },
  { key: 'insurance', label: 'ביטוח נסיעות', emoji: '🛡️' },
  { key: 'esta', label: 'ESTA', emoji: '📋' },
  { key: 'gear', label: 'ציוד', emoji: '🎒' },
] as const

type PretripRowKey = (typeof PRETRIP_ROWS)[number]['key']

// Moti's estimated daily costs for family of 5 in RV (USD)
const MOTI_DAILY_ESTIMATES: Record<BudgetRowKey, number> = {
  accommodation: 45,   // RV campground average
  gas: 65,             // RV fuel ~10-12 mpg, ~150 miles/day
  food: 120,           // Mix of cooking in RV and eating out
  attractions: 40,     // Average across trip (some days $0, some $100+)
  groceries: 35,       // Supermarket runs
  misc: 25,            // Tips, laundry, supplies
}

// Moti's pre-trip estimates (USD)
const MOTI_PRETRIP_ESTIMATES: Record<PretripRowKey, number> = {
  flights: 7500,       // Family of 5, TLV→LAX roundtrip
  rv_rental: 4200,     // Cruise America C30, ~20 days
  insurance: 1500,     // Travel insurance family
  esta: 105,           // $21 × 5 people
  gear: 500,           // Misc gear purchases
}

interface CellData {
  value: number
  isUserSet: boolean
}

// Storage key for persisting user edits
const STORAGE_KEY = 'hey-usa-daily-budget'

function loadSavedData(): Record<string, CellData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCellData(data: Record<string, CellData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function DailyBudgetTable() {
  const { itineraryDays, budgetSettings } = useAppData()
  const currency = budgetSettings.currency

  const [cellOverrides, setCellOverrides] = useState<Record<string, CellData>>(loadSavedData)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Get cell value: user override or Moti estimate
  const getCellValue = useCallback((cellKey: string, defaultValue: number): CellData => {
    if (cellOverrides[cellKey]) return cellOverrides[cellKey]
    return { value: defaultValue, isUserSet: false }
  }, [cellOverrides])

  const setCellValue = useCallback((cellKey: string, value: number) => {
    const updated = { ...cellOverrides, [cellKey]: { value, isUserSet: true } }
    setCellOverrides(updated)
    saveCellData(updated)
  }, [cellOverrides])

  // Computed totals
  const { dayTotals, categoryTotals, grandTotal, pretripTotal } = useMemo(() => {
    const dayTotals: Record<string, number> = {}
    const categoryTotals: Record<string, number> = {}
    let grandTotal = 0

    // Pre-trip totals
    let pretripTotal = 0
    for (const row of PRETRIP_ROWS) {
      const cell = getCellValue(`pretrip-${row.key}`, MOTI_PRETRIP_ESTIMATES[row.key])
      pretripTotal += cell.value
      categoryTotals[`pretrip-${row.key}`] = cell.value
    }
    grandTotal += pretripTotal

    // Daily totals
    for (const day of itineraryDays) {
      let dayTotal = 0
      for (const row of BUDGET_ROWS) {
        const cell = getCellValue(`${day.id}-${row.key}`, MOTI_DAILY_ESTIMATES[row.key])
        dayTotal += cell.value
        categoryTotals[row.key] = (categoryTotals[row.key] || 0) + cell.value
      }
      dayTotals[day.id] = dayTotal
      grandTotal += dayTotal
    }

    return { dayTotals, categoryTotals, grandTotal, pretripTotal }
  }, [itineraryDays, getCellValue])

  function startEdit(cellKey: string, currentValue: number) {
    setEditingCell(cellKey)
    setEditValue(String(currentValue))
  }

  function saveEdit(cellKey: string) {
    const val = Number(editValue)
    if (!isNaN(val) && val >= 0) {
      setCellValue(cellKey, val)
    }
    setEditingCell(null)
  }

  function renderCell(cellKey: string, defaultValue: number) {
    const cell = getCellValue(cellKey, defaultValue)
    const isEditing = editingCell === cellKey

    if (isEditing) {
      return (
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit(cellKey)
              if (e.key === 'Escape') setEditingCell(null)
            }}
            className="w-16 rounded border border-ios-blue/40 bg-white px-1 py-0.5 text-xs text-left font-medium focus:outline-none"
            autoFocus
            dir="ltr"
          />
          <button onClick={() => saveEdit(cellKey)} className="text-ios-green">
            <Check className="h-3 w-3" />
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => startEdit(cellKey, cell.value)}
        className={cn(
          'group flex items-center gap-0.5 rounded px-1 py-0.5 text-xs font-medium transition-colors hover:bg-black/[0.04]',
          cell.isUserSet ? 'text-apple-primary' : 'text-apple-secondary italic',
        )}
        title={cell.isUserSet ? 'הוזן ידנית' : 'הערכת מוטי 🤖 — לחץ לעריכה'}
      >
        {!cell.isUserSet && <span className="text-[9px] opacity-60">🤖</span>}
        <span dir="ltr">{cell.value}</span>
        <Pencil className="h-2.5 w-2.5 text-apple-tertiary opacity-0 group-hover:opacity-100" />
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-apple-secondary">
        <span className="flex items-center gap-1">
          <span className="italic text-apple-secondary">🤖 123</span> = הערכת מוטי
        </span>
        <span className="flex items-center gap-1">
          <span className="font-medium text-apple-primary">123</span> = הוזן ידנית
        </span>
        <span className="text-apple-tertiary">לחצו על תא כדי לערוך</span>
      </div>

      {/* Pre-trip table */}
      <div className="glass rounded-apple-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-black/[0.06] bg-ios-blue/5">
          <h3 className="text-sm font-bold text-apple-primary">✈️ הוצאות טרום-טיול</h3>
        </div>
        <div className="p-2">
          <table className="w-full text-sm">
            <tbody>
              {PRETRIP_ROWS.map((row) => {
                const cellKey = `pretrip-${row.key}`
                return (
                  <tr key={row.key} className="border-b border-black/[0.03] last:border-0">
                    <td className="py-1.5 px-2 text-xs font-medium text-apple-primary whitespace-nowrap">
                      {row.emoji} {row.label}
                    </td>
                    <td className="py-1.5 px-2 text-left" dir="ltr">
                      {renderCell(cellKey, MOTI_PRETRIP_ESTIMATES[row.key])}
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-black/[0.02]">
                <td className="py-1.5 px-2 text-xs font-bold text-apple-primary">סה״כ טרום-טיול</td>
                <td className="py-1.5 px-2 text-left text-xs font-bold text-apple-primary" dir="ltr">
                  {currency}{pretripTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily budget table */}
      <div className="glass rounded-apple-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-black/[0.06] bg-ios-green/5">
          <h3 className="text-sm font-bold text-apple-primary">📅 תקציב יומי</h3>
          <p className="text-[10px] text-apple-secondary">גללו ימינה לראות את כל הימים</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/[0.02]">
                <th className="sticky right-0 z-10 bg-white/90 backdrop-blur-sm py-2 px-2 text-right text-[11px] font-bold text-apple-primary border-l border-black/[0.06] min-w-[100px]">
                  קטגוריה
                </th>
                {itineraryDays.map((day, i) => (
                  <th key={day.id} className="py-2 px-1.5 text-center min-w-[60px] border-l border-black/[0.04]">
                    <div className="text-[10px] font-bold text-apple-primary">יום {i + 1}</div>
                    <div className="text-[9px] text-apple-tertiary truncate max-w-[60px]" title={day.city}>
                      {day.city?.split('→')[0]?.trim()?.slice(0, 8) || ''}
                    </div>
                  </th>
                ))}
                <th className="py-2 px-2 text-center min-w-[70px] bg-black/[0.03] border-r border-black/[0.06]">
                  <div className="text-[10px] font-bold text-apple-primary">סה״כ</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {BUDGET_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-black/[0.03]">
                  <td className="sticky right-0 z-10 bg-white/90 backdrop-blur-sm py-1.5 px-2 text-right text-[11px] font-medium text-apple-primary whitespace-nowrap border-l border-black/[0.06]">
                    {row.emoji} {row.label}
                  </td>
                  {itineraryDays.map((day) => {
                    const cellKey = `${day.id}-${row.key}`
                    return (
                      <td key={day.id} className="py-1 px-1 text-center border-l border-black/[0.04]">
                        {renderCell(cellKey, MOTI_DAILY_ESTIMATES[row.key])}
                      </td>
                    )
                  })}
                  <td className="py-1.5 px-2 text-center font-bold text-apple-primary bg-black/[0.03] border-r border-black/[0.06]">
                    {currency}{(categoryTotals[row.key] || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {/* Daily totals row */}
              <tr className="bg-black/[0.02] border-t border-black/[0.08]">
                <td className="sticky right-0 z-10 bg-gray-50/90 backdrop-blur-sm py-2 px-2 text-right text-[11px] font-bold text-apple-primary border-l border-black/[0.06]">
                  סה״כ יומי
                </td>
                {itineraryDays.map((day) => (
                  <td key={day.id} className="py-2 px-1 text-center text-[11px] font-bold text-apple-primary border-l border-black/[0.04]">
                    {currency}{(dayTotals[day.id] || 0).toLocaleString()}
                  </td>
                ))}
                <td className="py-2 px-2 text-center text-[11px] font-bold text-ios-blue bg-black/[0.03] border-r border-black/[0.06]">
                  {currency}{(grandTotal - pretripTotal).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grand total */}
      <div className="glass rounded-apple-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-apple-primary">סה״כ כללי (טרום-טיול + ימי טיול)</span>
          <span className={cn(
            'text-lg font-bold',
            grandTotal > budgetSettings.total_budget ? 'text-ios-red' : 'text-ios-green',
          )}>
            {currency}{grandTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-apple-secondary">תקציב מאושר</span>
          <span className="text-xs font-medium text-apple-secondary">
            {currency}{budgetSettings.total_budget.toLocaleString()}
          </span>
        </div>
        {grandTotal !== budgetSettings.total_budget && (
          <p className={cn(
            'text-xs mt-2 font-medium',
            grandTotal > budgetSettings.total_budget ? 'text-ios-red' : 'text-ios-green',
          )}>
            {grandTotal > budgetSettings.total_budget
              ? `⚠️ חריגה של ${currency}${(grandTotal - budgetSettings.total_budget).toLocaleString()} מהתקציב`
              : `✅ רזרבה של ${currency}${(budgetSettings.total_budget - grandTotal).toLocaleString()}`}
          </p>
        )}
      </div>
    </div>
  )
}
