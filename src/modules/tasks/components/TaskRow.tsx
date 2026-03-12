import { Check, AlertTriangle, Clock, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS, STATUS_MAP } from '@/constants'
import type { Task, TaskStatus, TaskPriority, FamilyMemberId } from '@/types'

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
        'group flex items-center gap-3 px-4 py-2.5 border-b border-sand-dark/50 cursor-pointer transition-all hover:bg-white/40',
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
            : 'border-brown-light/40 hover:border-status-done',
        )}
      >
        {isDone && <Check className="h-3 w-3" />}
      </button>

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-sm font-medium text-brown truncate',
          isDone && 'line-through text-brown-light',
        )}
      >
        {task.title}
      </span>

      {/* Status pill */}
      <button
        onClick={handleCycleStatus}
        title={`לחץ לשנות ל: ${nextStatus()}`}
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all hover:opacity-80',
          statusConfig?.bg ?? 'bg-gray-200',
          statusConfig?.color ?? 'text-gray-600',
        )}
      >
        {statusConfig?.label ?? task.status}
      </button>

      {/* Priority */}
      <div className={cn('shrink-0', priorityConfig.className)} title={priorityConfig.label}>
        <PriorityIcon className="h-4 w-4" />
      </div>

      {/* Assignees */}
      <div className="flex shrink-0 -space-x-1.5 space-x-reverse">
        {task.assigned_to.slice(0, 3).map((memberId: FamilyMemberId) => {
          const member = FAMILY_MEMBERS[memberId]
          if (!member) return null
          return (
            <div
              key={memberId}
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
              style={{
                backgroundColor: `${member.color}20`,
                borderColor: member.color,
                borderWidth: 1.5,
              }}
              title={member.name}
            >
              {member.emoji}
            </div>
          )
        })}
        {task.assigned_to.length > 3 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sand-dark text-[10px] font-bold text-brown-light">
            +{task.assigned_to.length - 3}
          </div>
        )}
      </div>

      {/* Due date */}
      <div className="w-16 shrink-0 text-left">
        {task.due_date ? (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              overdue ? 'font-semibold text-red-500' : 'text-brown-light',
            )}
          >
            {overdue && <Clock className="h-3 w-3" />}
            {formatDate(task.due_date)}
          </span>
        ) : (
          <span className="text-xs text-brown-light/50">-</span>
        )}
      </div>
    </div>
  )
}
