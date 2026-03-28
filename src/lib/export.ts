import type { Expense, ItineraryDay } from '@/lib/types'
import { EXPENSE_CATEGORIES } from '@/constants'

// ─── CSV Export ─────────────────────────────────────────────────────

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportExpensesCsv(expenses: Expense[]): void {
  const headers = ['תאריך', 'כותרת', 'סכום', 'מטבע', 'קטגוריה', 'שולם ע"י', 'הערות']
  const rows = expenses.map((e) => [
    e.date,
    escapeCsv(e.title),
    e.amount.toString(),
    e.currency,
    EXPENSE_CATEGORIES[e.category]?.label || e.category,
    e.paid_by,
    escapeCsv(e.notes || ''),
  ])

  // BOM for Hebrew support in Excel
  const bom = '\uFEFF'
  const csv = bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  downloadFile(csv, 'hey-usa-expenses.csv', 'text/csv;charset=utf-8')
}

// ─── Itinerary Text Export ──────────────────────────────────────────

export function exportItineraryText(days: ItineraryDay[]): void {
  const lines: string[] = ['Hey USA — מסלול הטיול', '═'.repeat(40), '']

  for (const day of days) {
    lines.push(`📅 ${day.date} — ${day.title}`)
    if (day.city) lines.push(`   📍 ${day.city}`)
    lines.push('')

    for (const stop of day.stops) {
      const time = stop.start_time ? `[${stop.start_time}] ` : ''
      lines.push(`   • ${time}${stop.title}`)
      if (stop.location) lines.push(`     ${stop.location}`)
      if (stop.cost_estimate) lines.push(`     💰 $${stop.cost_estimate}`)
      if (stop.notes) lines.push(`     📝 ${stop.notes}`)
    }

    if (day.notes) {
      lines.push(`   📝 ${day.notes}`)
    }
    lines.push('')
    lines.push('─'.repeat(40))
    lines.push('')
  }

  const text = lines.join('\n')
  downloadFile(text, 'hey-usa-itinerary.txt', 'text/plain;charset=utf-8')
}

// ─── Download Helper ────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
