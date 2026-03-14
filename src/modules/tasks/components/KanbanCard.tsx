import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, ChevronUp, Minus, ChevronDown, Clock, GripVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import type { Task, TaskPriority, FamilyMemberId } from '@/types'

interface KanbanCardProps {
  task: Task
  onClick: (task: Task) => void
}

const PRIORITY_CONFIG: Record<TaskPriority, { icon: typeof ChevronUp; label: string; className: string; bgClass: string }> = {
  urgent: { icon: AlertTriangle, label: 'דחוף', className: 'text-red-500', bgClass: 'bg-red-50' },
  high: { icon: ChevronUp, label: 'גבוה', className: 'text-orange-500', bgClass: 'bg-orange-50' },
  medium: { icon: Minus, label: 'בינוני', className: 'text-yellow-600', bgClass: 'bg-yellow-50' },
  low: { icon: ChevronDown, label: 'נמוך', className: 'text-gray-400', bgClass: 'bg-gray-50' },
}

function isOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done') return false
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(date)
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const PriorityIcon = priorityConfig.icon
  const overdue = isOverdue(task.due_date, task.status)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border border-black/[0.06] glass p-3 shadow-sm transition-all hover:shadow-md cursor-pointer',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-ios-blue/30',
      )}
      onClick={() => onClick(task)}
    >
      {/* Drag handle + Priority badge */}
      <div className="mb-2 flex items-center justify-between">
        <div
          className={cn('flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium', priorityConfig.bgClass, priorityConfig.className)}
        >
          <PriorityIcon className="h-3 w-3" />
          {priorityConfig.label}
        </div>
        <button
          className="cursor-grab touch-none text-apple-secondary/40 opacity-0 transition-opacity group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Title */}
      <p
        className={cn(
          'text-sm font-semibold text-apple-primary leading-snug',
          task.status === 'done' && 'line-through opacity-60',
        )}
      >
        {task.title}
      </p>

      {/* Footer: assignees + due date */}
      <div className="mt-3 flex items-center justify-between">
        {/* Assignees */}
        <div className="flex -space-x-1.5 space-x-reverse">
          {task.assigned_to.slice(0, 3).map((memberId: FamilyMemberId) => {
            const member = FAMILY_MEMBERS[memberId]
            if (!member) return null
            return (
              <FamilyAvatar
                key={memberId}
                memberId={memberId}
                size="sm"
              />
            )
          })}
          {task.assigned_to.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.04] text-[10px] font-bold text-apple-secondary">
              +{task.assigned_to.length - 3}
            </div>
          )}
        </div>

        {/* Due date */}
        {task.due_date && (
          <span
            className={cn(
              'flex items-center gap-1 text-[11px]',
              overdue ? 'font-semibold text-red-500' : 'text-apple-secondary',
            )}
          >
            {overdue && <Clock className="h-3 w-3" />}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}
