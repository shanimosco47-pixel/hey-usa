import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import type { Task, TaskStatus, TaskPriority, TaskGroup, FamilyMemberId } from '@/types'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  onSave: (data: TaskFormData) => void
  onDelete?: (id: string) => void
}

export interface TaskFormData {
  title: string
  description: string
  group: TaskGroup
  status: TaskStatus
  priority: TaskPriority
  assigned_to: FamilyMemberId[]
  due_date: string
}

const GROUP_OPTIONS: { value: TaskGroup; label: string }[] = [
  { value: 'pre_trip', label: 'לפני הטיול' },
  { value: 'during_trip', label: 'במהלך הטיול' },
  { value: 'post_trip', label: 'אחרי הטיול' },
]

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'לביצוע' },
  { value: 'in_progress', label: 'בתהליך' },
  { value: 'waiting', label: 'ממתין' },
  { value: 'done', label: 'בוצע' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'דחוף' },
  { value: 'high', label: 'גבוה' },
  { value: 'medium', label: 'בינוני' },
  { value: 'low', label: 'נמוך' },
]

const FAMILY_LIST = Object.values(FAMILY_MEMBERS)

const defaultForm: TaskFormData = {
  title: '',
  description: '',
  group: 'pre_trip',
  status: 'todo',
  priority: 'medium',
  assigned_to: [],
  due_date: '',
}

export function TaskDialog({ open, onOpenChange, task, onSave, onDelete }: TaskDialogProps) {
  const [form, setForm] = useState<TaskFormData>(defaultForm)
  const isEditing = !!task

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        group: task.group,
        status: task.status,
        priority: task.priority,
        assigned_to: [...task.assigned_to],
        due_date: task.due_date ?? '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [task, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
    onOpenChange(false)
  }

  const handleAssigneeToggle = (memberId: FamilyMemberId) => {
    setForm((prev) => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(memberId)
        ? prev.assigned_to.filter((id) => id !== memberId)
        : [...prev.assigned_to, memberId],
    }))
  }

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-4 top-[50%] z-50 max-h-[85vh] max-w-lg translate-y-[-50%] mx-auto overflow-y-auto rounded-apple-lg border border-black/[0.06] bg-surface-primary p-6 shadow-xl focus:outline-none">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-bold text-apple-primary">
              {isEditing ? 'עריכת משימה' : 'משימה חדשה'}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-apple-secondary transition-colors hover:bg-black/[0.04]">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-apple-primary">
                כותרת <span className="text-ios-red">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="שם המשימה..."
                className="w-full rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary placeholder:text-apple-secondary/50 focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-apple-primary">תיאור</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="פרטים נוספים..."
                rows={3}
                className="w-full rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary placeholder:text-apple-secondary/50 focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30 resize-none"
              />
            </div>

            {/* Group + Status row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-apple-primary">קבוצה</label>
                <select
                  value={form.group}
                  onChange={(e) => setForm((f) => ({ ...f, group: e.target.value as TaskGroup }))}
                  className="w-full rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
                >
                  {GROUP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-apple-primary">סטטוס</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                  className="w-full rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority + Due date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-apple-primary">עדיפות</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                  className="w-full rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-apple-primary">תאריך יעד</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full rounded-xl border border-black/[0.06] glass px-3 py-2 text-sm text-apple-primary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="mb-2 block text-sm font-medium text-apple-primary">אחראים</label>
              <div className="flex flex-wrap gap-2">
                {FAMILY_LIST.map((member) => {
                  const isSelected = form.assigned_to.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAssigneeToggle(member.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all',
                        isSelected
                          ? 'glass shadow-sm'
                          : 'border-black/[0.04] bg-transparent opacity-50 hover:opacity-75',
                      )}
                      style={{
                        borderColor: isSelected ? member.color : undefined,
                        color: isSelected ? member.color : undefined,
                      }}
                    >
                      <span>{member.emoji}</span>
                      <span>{member.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!form.title.trim()}
                className="flex-1 rounded-xl bg-ios-blue px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-ios-blue/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEditing ? 'שמור שינויים' : 'הוסף משימה'}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border border-black/[0.06] px-4 py-2.5 text-sm font-medium text-apple-secondary transition-all hover:bg-black/[0.03]"
              >
                ביטול
              </button>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl p-2.5 text-red-400 transition-all hover:bg-red-50 hover:text-red-500"
                  title="מחק משימה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
