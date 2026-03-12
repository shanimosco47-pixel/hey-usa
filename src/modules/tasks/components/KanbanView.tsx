import { useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import type { Task, TaskStatus } from '@/types'
import { KanbanCard } from './KanbanCard'

interface KanbanViewProps {
  tasksByStatus: Record<TaskStatus, Task[]>
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick: (task: Task) => void
}

const COLUMN_CONFIG: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'לביצוע', color: '#e17055' },
  { status: 'in_progress', label: 'בתהליך', color: '#fdcb6e' },
  { status: 'waiting', label: 'ממתין', color: '#636e72' },
  { status: 'done', label: 'בוצע', color: '#00b894' },
]

function KanbanColumn({
  status,
  label,
  color,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus
  label: string
  color: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className={cn(
        'flex h-full min-w-[260px] flex-col rounded-xl border border-sand-dark bg-sand/40 transition-colors',
        isOver && 'bg-sky/5 ring-2 ring-sky/30',
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-bold text-brown">{label}</span>
        <span
          className="mr-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
        style={{ minHeight: 100 }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-sand-dark/60 py-8">
              <span className="text-xs text-brown-light/50">גרור משימות לכאן</span>
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function KanbanView({ tasksByStatus, onUpdateStatus, onTaskClick }: KanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined
    if (task) {
      setActiveTask(task)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over) return

      const taskId = active.id as string
      const overId = over.id as string

      // Check if dropped on a column
      const targetStatus = COLUMN_CONFIG.find((c) => c.status === overId)?.status
      if (targetStatus) {
        const task = Object.values(tasksByStatus).flat().find((t) => t.id === taskId)
        if (task && task.status !== targetStatus) {
          onUpdateStatus(taskId, targetStatus)
        }
        return
      }

      // Dropped on another card - find which column the target card is in
      for (const [status, tasks] of Object.entries(tasksByStatus)) {
        const targetCard = tasks.find((t) => t.id === overId)
        if (targetCard) {
          const task = Object.values(tasksByStatus).flat().find((t) => t.id === taskId)
          if (task && task.status !== status) {
            onUpdateStatus(taskId, status as TaskStatus)
          }
          break
        }
      }
    },
    [tasksByStatus, onUpdateStatus],
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const taskId = active.id as string
      const overId = over.id as string

      // If dragging over a column directly
      const targetStatus = COLUMN_CONFIG.find((c) => c.status === overId)?.status
      if (targetStatus) return

      // If dragging over a card in a different column
      for (const [status, tasks] of Object.entries(tasksByStatus)) {
        if (tasks.find((t) => t.id === overId)) {
          const sourceTask = Object.values(tasksByStatus).flat().find((t) => t.id === taskId)
          if (sourceTask && sourceTask.status !== status) {
            onUpdateStatus(taskId, status as TaskStatus)
          }
          break
        }
      }
    },
    [tasksByStatus, onUpdateStatus],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {COLUMN_CONFIG.map(({ status, label, color }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            color={color}
            tasks={tasksByStatus[status]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[260px] rounded-xl border border-sky/30 bg-white p-3 shadow-lg">
            <p className="text-sm font-semibold text-brown">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
