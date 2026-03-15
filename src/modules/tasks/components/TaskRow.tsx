import { Check, AlertTriangle, Clock, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS, STATUS_MAP } from '@/constants'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import type { Task, TaskStatus, TaskPriority, FamilyMemberId } from '@/types'
import { isSampleData } from '@/lib/sampleData'

interface TaskRowProps {
  task: Task
  onToggleDone: (id: string) => void
  onCycleStatus: (id: string) => void
  onClick: (task: Task) => void
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done']

const PRIORITY_CONFIG: Record<TaskPriority, { icon: typeof ChevronUp; label: string; className: string }> = {
  urgent: { icon: AlertTriangle, label: 'דחוף', className: 'text-red-500' },
  high: { icon: ChevronUp, label: 'גבוה', className: 'text-orange-500' },
  medium: { icon: Minus, label: 'בינוני', className: 'text-yellow-600' },
  low: { icon: ChevronDown, label: 'נמוך', className: 'text-gray-400' },
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(date)
}

export function TaskRow({ task, onToggleDone, onCycleStatus, onClick }: TaskRowProps) {
  const isDone = task.status === 'done'
  const overdue = !isDone && isOverdue(task.due_date)
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const PriorityIcon = priorityConfig.icon
  const statusConfig = STATUS_MAP[task.status]

  const handleCycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCycleStatus(task.id)
  }

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleDone(task.id)
  }

  const nextStatus = (): string => {
    const currentIndex = STATUS_ORDER.indexOf(task.status)
    const nextIndex = (currentIndex + 1) % STATUS_ORDER.length
    return STATUS_MAP[STATUS_ORDER[nextIndex]]?.label ?? ''
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-black/[0.04] cursor-pointer transition-all hover:bg-white/40',
        isDone && 'opacity-60',
      )}
      onClick={() => onClick(task)}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleDone}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
          isDone
            ? 'border-status-done bg-status-done text-white'
            : 'border-apple-tertiary hover:border-status-done',
        )}
      >
        {isDone && <Check className="h-3 w-3" />}
      </button>

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-sm font-medium text-apple-primary truncate',
          isDone && 'line-through text-apple-secondary',
        )}
      >
        {isSampleData(task.id) && <span className="text-[10px] ml-1 opacity-60" title="דוגמה מאת מוטי">🤖</span>}
        {task.title}
      </span>

      {/* Status pill */}
      <button
        onClick={handleCycleStatus}
        title={`לחץ לשנות ל: ${nextStatus()}`}
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[11px] sm:text-xs sm:px-2.5 font-medium transition-all hover:opacity-80',
          statusConfig?.bg ?? 'bg-gray-200',
          statusConfig?.color ?? 'text-gray-600',
        )}
      >
        {statusConfig?.label ?? task.status}
      </button>

      {/* Priority - hidden on mobile */}
      <div className={cn('shrink-0 hidden sm:block', priorityConfig.className)} title={priorityConfig.label}>
        <PriorityIcon className="h-4 w-4" />
      </div>

      {/* Assignees - show fewer on mobile */}
      <div className="flex shrink-0 -space-x-1.5 space-x-reverse">
        {task.assigned_to.slice(0, 2).map((memberId: FamilyMemberId) => {
          const member = FAMILY_MEMBERS[memberId]
          if (!member) return null
          return (
            <FamilyAvatar
              key={memberId}
              memberId={memberId}
              size="xs"
            />
          )
        })}
        {task.assigned_to.length > 2 && (
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-black/[0.04] text-[9px] sm:text-[10px] font-bold text-apple-secondary">
            +{task.assigned_to.length - 2}
          </div>
        )}
      </div>

      {/* Due date - hidden on mobile */}
      <div className="w-16 shrink-0 text-left hidden sm:block">
        {task.due_date ? (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              overdue ? 'font-semibold text-red-500' : 'text-apple-secondary',
            )}
          >
            {overdue && <Clock className="h-3 w-3" />}
            {formatDate(task.due_date)}
          </span>
        ) : (
          <span className="text-xs text-apple-tertiary">-</span>
        )}
      </div>
    </div>
  )
}
