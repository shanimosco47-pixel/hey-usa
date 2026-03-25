import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/cn'
import {
  Tent,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  HelpCircle,
  GripVertical,
} from 'lucide-react'
import type { CampsiteBooking, BookingStatus, AccommodationType, BookingPriority } from '@/types'
import { useCampsiteBookings } from './hooks/useCampsiteBookings'

// ── Status config ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  confirmed: {
    label: 'מאושר',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
  },
  pending: {
    label: 'בטיפול',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: Clock,
  },
  waitlist: {
    label: 'המתנה',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Clock,
  },
  not_open: {
    label: 'לא הוזמן',
    color: 'text-gray-500',
    bg: 'bg-gray-50 border-gray-200',
    icon: HelpCircle,
  },
  cancelled: {
    label: 'בוטל',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
}

const TYPE_LABELS: Record<AccommodationType, string> = {
  campground: 'קמפינג',
  rv_park: 'RV Park',
  hotel: 'מלון',
  overnight_parking: 'חניון לילה',
  unknown: '—',
}

const PRIORITY_LABELS: Record<BookingPriority, string> = {
  primary: 'ראשי',
  backup: 'גיבוי',
}

// ── Editable Cell ─────────────────────────────────────────────────
function EditableCell({
  value,
  onChange,
  type = 'text',
  options,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'select' | 'number' | 'date'
  options?: { value: string; label: string }[]
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  const startEdit = () => {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = () => {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  const cancel = () => {
    setEditing(false)
    setDraft(value)
  }

  if (editing) {
    if (type === 'select' && options) {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setEditing(false)
            if (e.target.value !== value) onChange(e.target.value)
          }}
          onBlur={() => setEditing(false)}
          className="w-full bg-white border border-ios-blue rounded px-1 py-0.5 text-xs focus:outline-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        className="w-full bg-white border border-ios-blue rounded px-1 py-0.5 text-xs focus:outline-none"
        step={type === 'number' ? '0.01' : undefined}
      />
    )
  }

  // Format date values for display (YYYY-MM-DD → DD/MM)
  const displayValue =
    type === 'date' && value
      ? (() => {
          const d = new Date(value)
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
        })()
      : value

  return (
    <span
      onClick={startEdit}
      className={`cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 block min-h-[1.5em] ${className}`}
      title="לחץ לעריכה"
    >
      {displayValue || <span className="text-gray-300">—</span>}
    </span>
  )
}

// ── Status Badge ──────────────────────────────────────────────────
function StatusBadge({
  status,
  onChange,
}: {
  status: BookingStatus
  onChange: (s: BookingStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}
      >
        <Icon size={12} />
        {cfg.label}
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 bg-white shadow-lg rounded-lg border p-1 min-w-[120px]">
          {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((s) => {
            const c = STATUS_CONFIG[s]
            const I = c.icon
            return (
              <button
                key={s}
                onClick={() => {
                  onChange(s)
                  setOpen(false)
                }}
                className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-gray-50 ${s === status ? 'font-bold' : ''} ${c.color}`}
              >
                <I size={12} />
                {c.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Resizable Column Header ──────────────────────────────────────
function ResizableHeader({
  children,
  width,
  onResize,
  className = '',
}: {
  children: React.ReactNode
  width: number
  onResize: (w: number) => void
  className?: string
}) {
  const startX = useRef(0)
  const startW = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startX.current = e.clientX
    startW.current = width

    const handleMove = (ev: MouseEvent) => {
      // RTL: dragging left = wider
      const diff = startX.current - ev.clientX
      onResize(Math.max(60, startW.current + diff))
    }
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <th
      className={`relative px-2 py-2 text-right text-xs font-semibold text-apple-secondary whitespace-nowrap ${className}`}
      style={{ width, minWidth: width }}
    >
      {children}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-ios-blue/20 flex items-center justify-center"
        title="גרור לשינוי רוחב"
      >
        <GripVertical size={10} className="text-gray-300" />
      </div>
    </th>
  )
}

// ── Add Row Dialog ────────────────────────────────────────────────
function AddRowDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (b: Omit<CampsiteBooking, 'id' | 'changelog' | 'created_at' | 'updated_at'>) => void
}) {
  const [form, setForm] = useState({
    check_in: '',
    check_out: '',
    location: '',
    area: '',
    type: 'unknown' as AccommodationType,
    priority: 'primary' as BookingPriority,
    status: 'not_open' as BookingStatus,
    confirmation: '',
    cost: '',
    cancellation_deadline: '',
    refund_amount: '',
    notes: '',
  })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-apple-xl shadow-glass-float p-6 w-full max-w-md space-y-3"
        dir="rtl"
      >
        <h3 className="text-lg font-bold">הוסף שורה חדשה</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-apple-secondary">צ'ק-אין</span>
            <input
              type="date"
              value={form.check_in}
              onChange={(e) => setForm((p) => ({ ...p, check_in: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-apple-secondary">צ'ק-אאוט</span>
            <input
              type="date"
              value={form.check_out}
              onChange={(e) => setForm((p) => ({ ...p, check_out: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-apple-secondary">שם אתר</span>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="שם הקמפינג / מלון"
          />
        </label>
        <label className="block">
          <span className="text-xs text-apple-secondary">אזור</span>
          <input
            type="text"
            value={form.area}
            onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="עיר / פארק"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-apple-secondary">סוג</span>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({ ...p, type: e.target.value as AccommodationType }))
              }
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-apple-secondary">עדיפות</span>
            <select
              value={form.priority}
              onChange={(e) =>
                setForm((p) => ({ ...p, priority: e.target.value as BookingPriority }))
              }
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="primary">ראשי</option>
              <option value="backup">גיבוי</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-apple-secondary">מועד ביטול אחרון</span>
            <input
              type="date"
              value={form.cancellation_deadline}
              onChange={(e) => setForm((p) => ({ ...p, cancellation_deadline: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-apple-secondary">סכום החזר</span>
            <input
              type="number"
              value={form.refund_amount}
              onChange={(e) => setForm((p) => ({ ...p, refund_amount: e.target.value }))}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="$"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-apple-secondary">הערות</span>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              if (!form.check_in || !form.check_out || !form.location) return
              onAdd({
                ...form,
                cost: form.cost ? Number(form.cost) : undefined,
                cancellation_deadline: form.cancellation_deadline || undefined,
                refund_amount: form.refund_amount ? Number(form.refund_amount) : undefined,
                registration_opens: undefined,
                booking_url: undefined,
                confirmation: form.confirmation || undefined,
              })
              onClose()
            }}
            className="flex-1 bg-ios-blue text-white py-2 rounded-apple text-sm font-medium"
          >
            הוסף
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 py-2 rounded-apple text-sm">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function CampsitesPage() {
  const { bookings, loading, updateBooking, addBooking, confirmedCount, totalNights } =
    useCampsiteBookings()
  const [showAdd, setShowAdd] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

  // Column widths (resizable)
  const [colWidths, setColWidths] = useState({
    location: 180,
    area: 130,
    type: 80,
    priority: 70,
    dates: 100,
    regOpens: 100,
    status: 100,
    confirmation: 120,
    cost: 70,
    cancellationDeadline: 110,
    refundAmount: 90,
    notes: 200,
  })

  const setWidth = useCallback((col: string, w: number) => {
    setColWidths((prev) => ({ ...prev, [col]: w }))
  }, [])

  const handleStatusChange = (id: string, newStatus: BookingStatus) => {
    if (newStatus === 'cancelled') {
      setConfirmCancel(id)
      return
    }
    updateBooking(id, { status: newStatus })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-ios-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-apple bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <Tent size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-apple-primary">לינות</h1>
            <p className="text-xs text-apple-secondary">
              {confirmedCount}/{totalNights} לילות מאושרים
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-ios-blue text-white rounded-apple text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          הוסף שורה
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-green-500 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${totalNights > 0 ? (confirmedCount / totalNights) * 100 : 0}%` }}
        />
      </div>

      {/* Scrollable Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-apple-xl shadow-glass border border-gray-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full"
            style={{ minWidth: Object.values(colWidths).reduce((a, b) => a + b, 0) }}
          >
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <ResizableHeader
                  width={colWidths.location}
                  onResize={(w) => setWidth('location', w)}
                >
                  שם אתר
                </ResizableHeader>
                <ResizableHeader width={colWidths.area} onResize={(w) => setWidth('area', w)}>
                  אזור
                </ResizableHeader>
                <ResizableHeader width={colWidths.type} onResize={(w) => setWidth('type', w)}>
                  סוג
                </ResizableHeader>
                <ResizableHeader
                  width={colWidths.priority}
                  onResize={(w) => setWidth('priority', w)}
                >
                  עדיפות
                </ResizableHeader>
                <ResizableHeader width={colWidths.dates} onResize={(w) => setWidth('dates', w)}>
                  תאריכים
                </ResizableHeader>
                <ResizableHeader
                  width={colWidths.regOpens}
                  onResize={(w) => setWidth('regOpens', w)}
                >
                  פתיחת הרשמה
                </ResizableHeader>
                <ResizableHeader width={colWidths.status} onResize={(w) => setWidth('status', w)}>
                  סטטוס
                </ResizableHeader>
                <ResizableHeader
                  width={colWidths.confirmation}
                  onResize={(w) => setWidth('confirmation', w)}
                >
                  אישור #
                </ResizableHeader>
                <ResizableHeader width={colWidths.cost} onResize={(w) => setWidth('cost', w)}>
                  עלות
                </ResizableHeader>
                <ResizableHeader
                  width={colWidths.cancellationDeadline}
                  onResize={(w) => setWidth('cancellationDeadline', w)}
                >
                  מועד ביטול
                </ResizableHeader>
                <ResizableHeader
                  width={colWidths.refundAmount}
                  onResize={(w) => setWidth('refundAmount', w)}
                >
                  החזר
                </ResizableHeader>
                <ResizableHeader width={colWidths.notes} onResize={(w) => setWidth('notes', w)}>
                  הערות
                </ResizableHeader>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const isBackup = b.priority === 'backup'
                const isCancelled = b.status === 'cancelled'
                const rowClass = isCancelled
                  ? 'bg-red-50/30 opacity-60'
                  : isBackup
                    ? 'bg-amber-50/30 border-r-2 border-r-amber-300'
                    : 'hover:bg-gray-50/50'

                return (
                  <tr key={b.id} className={`border-b border-gray-100 text-sm ${rowClass}`}>
                    {/* Location */}
                    <td className="px-2 py-1.5 font-medium" style={{ width: colWidths.location }}>
                      <div className="flex items-center gap-1">
                        <EditableCell
                          value={b.location}
                          onChange={(v) => updateBooking(b.id, { location: v })}
                          className={isCancelled ? 'line-through' : ''}
                        />
                        {b.source === 'email_scan' && (
                          <span className="text-xs text-blue-400 shrink-0" title="יובא מאימייל">
                            📧
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Area */}
                    <td
                      className="px-2 py-1.5 text-apple-secondary text-xs"
                      style={{ width: colWidths.area }}
                    >
                      <EditableCell
                        value={b.area}
                        onChange={(v) => updateBooking(b.id, { area: v })}
                      />
                    </td>
                    {/* Type */}
                    <td className="px-2 py-1.5" style={{ width: colWidths.type }}>
                      <EditableCell
                        value={b.type}
                        type="select"
                        options={Object.entries(TYPE_LABELS).map(([v, l]) => ({
                          value: v,
                          label: l,
                        }))}
                        onChange={(v) => updateBooking(b.id, { type: v as AccommodationType })}
                        className="text-xs"
                      />
                    </td>
                    {/* Priority */}
                    <td className="px-2 py-1.5" style={{ width: colWidths.priority }}>
                      <EditableCell
                        value={b.priority}
                        type="select"
                        options={Object.entries(PRIORITY_LABELS).map(([v, l]) => ({
                          value: v,
                          label: l,
                        }))}
                        onChange={(v) => updateBooking(b.id, { priority: v as BookingPriority })}
                        className={`text-xs ${isBackup ? 'text-amber-600 font-medium' : ''}`}
                      />
                    </td>
                    {/* Dates — check_in */}
                    <td
                      className="px-2 py-1.5 text-xs font-mono"
                      style={{ width: colWidths.dates }}
                    >
                      <div className="flex items-center gap-0.5" dir="ltr">
                        <EditableCell
                          value={b.check_in}
                          type="date"
                          onChange={(v) => updateBooking(b.id, { check_in: v })}
                        />
                        <span className="text-gray-300 shrink-0">→</span>
                        <EditableCell
                          value={b.check_out}
                          type="date"
                          onChange={(v) => updateBooking(b.id, { check_out: v })}
                        />
                      </div>
                    </td>
                    {/* Registration opens */}
                    <td className="px-2 py-1.5" style={{ width: colWidths.regOpens }}>
                      <EditableCell
                        value={b.registration_opens ?? ''}
                        type="date"
                        onChange={(v) =>
                          updateBooking(b.id, { registration_opens: v || undefined })
                        }
                        className="text-xs"
                      />
                    </td>
                    {/* Status */}
                    <td className="px-2 py-1.5" style={{ width: colWidths.status }}>
                      <StatusBadge
                        status={b.status}
                        onChange={(s) => handleStatusChange(b.id, s)}
                      />
                    </td>
                    {/* Confirmation */}
                    <td className="px-2 py-1.5" style={{ width: colWidths.confirmation }}>
                      <EditableCell
                        value={b.confirmation ?? ''}
                        onChange={(v) => updateBooking(b.id, { confirmation: v || undefined })}
                        className="text-xs font-mono"
                      />
                    </td>
                    {/* Cost */}
                    <td className="px-2 py-1.5" style={{ width: colWidths.cost }}>
                      <EditableCell
                        value={b.cost != null ? String(b.cost) : ''}
                        type="number"
                        onChange={(v) => updateBooking(b.id, { cost: v ? Number(v) : undefined })}
                        className="text-xs font-mono"
                      />
                    </td>
                    {/* Cancellation Deadline */}
                    <td
                      className={cn('px-2 py-1.5', b.status === 'confirmed' && !b.cancellation_deadline && 'bg-red-50')}
                      style={{ width: colWidths.cancellationDeadline }}
                    >
                      <EditableCell
                        value={b.cancellation_deadline ?? ''}
                        type="date"
                        onChange={(v) =>
                          updateBooking(b.id, { cancellation_deadline: v || undefined })
                        }
                        className="text-xs"
                      />
                    </td>
                    {/* Refund Amount */}
                    <td
                      className={cn('px-2 py-1.5', b.status === 'confirmed' && b.refund_amount == null && !b.cancellation_deadline && 'bg-red-50')}
                      style={{ width: colWidths.refundAmount }}
                    >
                      <EditableCell
                        value={b.refund_amount != null ? String(b.refund_amount) : ''}
                        type="number"
                        onChange={(v) =>
                          updateBooking(b.id, { refund_amount: v ? Number(v) : undefined })
                        }
                        className="text-xs font-mono"
                      />
                    </td>
                    {/* Notes */}
                    <td className="px-2 py-1.5" style={{ width: colWidths.notes }}>
                      <EditableCell
                        value={b.notes ?? ''}
                        onChange={(v) => updateBooking(b.id, { notes: v })}
                        className="text-xs text-apple-secondary"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-apple-secondary px-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> מאושר
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> בטיפול
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> המתנה
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> לא הוזמן
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-amber-400" /> שורת גיבוי
        </span>
      </div>

      {/* Add dialog */}
      <AddRowDialog open={showAdd} onClose={() => setShowAdd(false)} onAdd={(b) => addBooking(b)} />

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-apple-xl shadow-glass-float p-6 w-full max-w-sm text-center space-y-4"
            dir="rtl"
          >
            <AlertCircle size={40} className="text-red-500 mx-auto" />
            <h3 className="text-lg font-bold">לסמן כבוטל?</h3>
            <p className="text-sm text-apple-secondary">
              השורה תישאר בטבלה אבל תסומן כבוטלת. אפשר לשנות בחזרה.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateBooking(confirmCancel, { status: 'cancelled' })
                  setConfirmCancel(null)
                }}
                className="flex-1 bg-red-500 text-white py-2 rounded-apple text-sm font-medium"
              >
                כן, בטל
              </button>
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 bg-gray-100 py-2 rounded-apple text-sm"
              >
                חזור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
