import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { useAppData } from '@/contexts/AppDataContext'
import { Check, Pencil } from 'lucide-react'

// Budget categories for the table rows
const BUDGET_ROWS = [
  { key: 'accommodation', label: 'לינה / קמפינג', emoji: '🏕️' },
  { key: 'gas', label: 'דלק', emoji: '⛽' },
  { key: 'food', label: 'אוכל (מסעדות)', emoji: '🍔' },
  { key: 'groceries', label: 'סופר / מכולת', emoji: '🛒' },
  { key: 'attractions', label: 'כניסה לאתרים', emoji: '🎟️' },
  { key: 'shopping', label: 'קניות', emoji: '🛍️' },
  { key: 'communication', label: 'תקשורת / SIM', emoji: '📱' },
  { key: 'laundry', label: 'כביסה', emoji: '🧺' },
  { key: 'tips', label: 'טיפים', emoji: '💵' },
  { key: 'parking', label: 'חנייה', emoji: '🅿️' },
  { key: 'unexpected', label: 'בלתי צפוי / אחר', emoji: '❓' },
] as const

type BudgetRowKey = (typeof BUDGET_ROWS)[number]['key']

// Pre-trip categories (separate from daily)
const PRETRIP_ROWS = [
  { key: 'flights', label: 'טיסות', emoji: '✈️' },
  { key: 'rv_rental', label: 'השכרת קרוואן', emoji: '🚐' },
  { key: 'insurance', label: 'ביטוח נסיעות', emoji: '🛡️' },
  { key: 'esta', label: 'ESTA', emoji: '📋' },
  { key: 'gear', label: 'ציוד', emoji: '🎒' },
  { key: 'sim_cards', label: 'כרטיסי SIM', emoji: '📶' },
  { key: 'campground_reservations', label: 'הזמנות קמפינג מראש', emoji: '📋' },
] as const

type PretripRowKey = (typeof PRETRIP_ROWS)[number]['key']

// Moti's default daily costs for family of 5 in RV (USD)
const MOTI_DAILY_DEFAULTS: Record<BudgetRowKey, number> = {
  accommodation: 45,   // RV campground/hookup avg ($30-60/night)
  gas: 50,             // RV fuel ~10-12 mpg, avg driving day
  food: 70,            // Eating out: ~$14/person/meal, ~1 meal/day out
  groceries: 40,       // Supermarket for RV cooking: breakfast+lunch+snacks
  attractions: 35,     // National parks $35/vehicle entry amortized
  shopping: 15,        // Souvenirs, small purchases
  communication: 3,    // T-Mobile prepaid SIM amortized daily
  laundry: 0,          // Only on laundry days
  tips: 12,            // Restaurant/service tips ~18-20%
  parking: 0,          // Free at campgrounds/parks, paid in cities
  unexpected: 20,      // Buffer for unplanned expenses
}

// Per-day overrides based on actual route & activities
// Day IDs: day-1 (Sep 10 Denver) through day-21 (Sep 30 SF→home)
const DAY_OVERRIDES: Record<string, Partial<Record<BudgetRowKey, number>>> = {
  'day-1':  { accommodation: 150, gas: 0,   food: 50,  groceries: 0,   attractions: 0,   parking: 0,  tips: 8,   unexpected: 15 },  // Denver hotel, evening arrival only
  'day-2':  { accommodation: 40,  gas: 35,  food: 60,  groceries: 80,  attractions: 0,   parking: 0,  tips: 10 },                    // Bozeman→Gardiner, RV pickup, Walmart stock-up
  'day-3':  { accommodation: 40,  gas: 30,  food: 60,  groceries: 30,  attractions: 35,  parking: 0 },                               // Yellowstone North (Mammoth, Lamar)
  'day-4':  { accommodation: 40,  gas: 25,  food: 60,  groceries: 25,  attractions: 0,   parking: 0 },                               // Canyon of Yellowstone, waterfalls
  'day-5':  { accommodation: 40,  gas: 35,  food: 60,  groceries: 25,  attractions: 0,   parking: 0 },                               // Geysers, Old Faithful, Grand Prismatic
  'day-6':  { accommodation: 45,  gas: 55,  food: 70,  groceries: 20,  attractions: 15,  parking: 0 },                               // Jenny Lake, Grand Teton → Jackson
  'day-7':  { accommodation: 45,  gas: 15,  food: 90,  groceries: 20,  attractions: 250, parking: 10, tips: 30, shopping: 30 },       // Jackson: rafting ($200) + gondola ($50)
  'day-8':  { accommodation: 35,  gas: 120, food: 70,  groceries: 30,  attractions: 0,   parking: 0,  tips: 12, laundry: 15 },        // Long drive Jackson→Provo/Nephi (7hrs)
  'day-9':  { accommodation: 35,  gas: 40,  food: 60,  groceries: 20,  attractions: 35,  parking: 0 },                               // Bryce Canyon hoodoos trail
  'day-10': { accommodation: 40,  gas: 45,  food: 60,  groceries: 20,  attractions: 35,  parking: 0 },                               // Drive to Zion via Hwy 20
  'day-11': { accommodation: 40,  gas: 10,  food: 70,  groceries: 25,  attractions: 0,   parking: 0,  tips: 15 },                    // Zion: Angels Landing + Narrows (free w/ park pass)
  'day-12': { accommodation: 130, gas: 50,  food: 100, groceries: 0,   attractions: 30,  parking: 20, tips: 20, shopping: 25 },       // Drive to Vegas, Strip evening, hotel
  'day-13': { accommodation: 130, gas: 0,   food: 120, groceries: 0,   attractions: 40,  parking: 25, tips: 25, shopping: 80, laundry: 15 }, // Vegas free day (rest & shopping)
  'day-14': { accommodation: 35,  gas: 100, food: 60,  groceries: 40,  attractions: 0,   parking: 0 },                               // Drive Vegas→Mammoth Lakes (5.5hrs)
  'day-15': { accommodation: 40,  gas: 40,  food: 60,  groceries: 25,  attractions: 35,  parking: 0 },                               // Enter Yosemite via Tioga Pass
  'day-16': { accommodation: 40,  gas: 10,  food: 60,  groceries: 25,  attractions: 0,   parking: 0 },                               // Yosemite Valley: El Capitan, Half Dome views
  'day-17': { accommodation: 40,  gas: 30,  food: 60,  groceries: 20,  attractions: 0,   parking: 0 },                               // Glacier Point & giant sequoias
  'day-18': { accommodation: 45,  gas: 80,  food: 70,  groceries: 30,  attractions: 0,   parking: 0, laundry: 15 },                  // Drive toward SF, Anthony Chabot (4hrs)
  'day-19': { accommodation: 50,  gas: 25,  food: 60,  groceries: 20,  attractions: 0,   parking: 0 },                               // Organize day, clean RV, Marin
  'day-20': { accommodation: 200, gas: 15,  food: 90,  groceries: 0,   attractions: 20,  parking: 25, tips: 20, shopping: 30 },       // Return RV, move to SF hotel
  'day-21': { accommodation: 0,   gas: 0,   food: 100, groceries: 0,   attractions: 50,  parking: 20, tips: 20, shopping: 40, unexpected: 30 }, // SF sightseeing, evening flight home
}

// Get the estimate for a specific day + category
function getMotiEstimate(dayId: string, category: BudgetRowKey): number {
  return DAY_OVERRIDES[dayId]?.[category] ?? MOTI_DAILY_DEFAULTS[category]
}

// Pre-trip estimates (USD) — updated with real booking data from emails
const MOTI_PRETRIP_ESTIMATES: Record<PretripRowKey, number> = {
  flights: 8081,       // United Airlines HQ51BY, 5 pax TLV→YYZ→DEN→BZN + SFO→MUC→TLV ($7,630.50 + $450.30 seats)
  rv_rental: 5202,     // Bandana/Cruise America C-30, order 137724-1-0, Bozeman→Newark CA
  insurance: 1500,     // Travel insurance family — pending purchase (PassportCard ~$8/day or Harel ~$6.5/day)
  esta: 105,           // $21 × 5 people
  gear: 500,           // Misc gear purchases
  sim_cards: 100,      // 2 prepaid SIM cards ~$50 each
  campground_reservations: 350,  // Grant Campground $52 + Indian Creek + others from Recreation.gov
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
        const cell = getCellValue(`${day.id}-${row.key}`, getMotiEstimate(day.id, row.key))
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
                        {renderCell(cellKey, getMotiEstimate(day.id, row.key))}
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
