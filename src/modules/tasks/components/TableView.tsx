import { useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Task, TaskGroup } from '@/types'
import { TaskRow } from './TaskRow'

interface TableViewProps {
  tasksByGroup: Record<TaskGroup, Task[]>
  onToggleDone: (id: string) => void
  onCycleStatus: (id: string) => void
  onTaskClick: (task: Task) => void
}

const GROUP_CONFIG: Record<TaskGroup, { label: string; color: string }> = {
  pre_trip: { label: 'לפני הטיול', color: '#6c5ce7' },
  during_trip: { label: 'במהלך הטיול', color: '#00b894' },
  post_trip: { label: 'אחרי הטיול', color: '#0984e3' },
}

const GROUP_ORDER: TaskGroup[] = ['pre_trip', 'during_trip', 'post_trip']

export function TableView({ tasksByGroup, onToggleDone, onCycleStatus, onTaskClick }: TableViewProps) {
  const [collapsed, setCollapsed] = useState<Record<TaskGroup, boolean>>({
    pre_trip: false,
    during_trip: false,
    post_trip: false,
  })

  const toggleCollapse = (group: TaskGroup) => {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  const handleCycleStatus = (id: string) => {
    onCycleStatus(id)
  }

  return (
    <div className="space-y-4">
      {GROUP_ORDER.map((group) => {
        const config = GROUP_CONFIG[group]
        const tasks = tasksByGroup[group]
        const isCollapsed = collapsed[group]
        const doneCount = tasks.filter((t) => t.status === 'done').length

        return (
          <div key={group} className="overflow-hidden rounded-xl border border-black/[0.06] glass">
            {/* Group header */}
            <button
              onClick={() => toggleCollapse(group)}
              className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-white/30"
              style={{ borderRight: `4px solid ${config.color}` }}
            >
              <div
                className={cn('transition-transform', isCollapsed ? '-rotate-90' : 'rotate-0')}
              >
                {isCollapsed ? (
                  <ChevronLeft className="h-4 w-4 text-apple-secondary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-apple-secondary" />
                )}
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: config.color }}
              >
                {config.label}
              </span>
              <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: config.color }}>
                {doneCount}/{tasks.length}
              </span>
            </button>

            {/* Column headers */}
            {!isCollapsed && tasks.length > 0 && (
              <div className="flex items-center gap-3 border-b border-black/[0.04] bg-black/[0.03] px-4 py-1.5 text-[11px] font-semibold text-apple-secondary">
                <div className="w-5 shrink-0" />
                <div className="flex-1">משימה</div>
                <div className="w-16 shrink-0 text-center">סטטוס</div>
                <div className="w-4 shrink-0" />
                <div className="w-[72px] shrink-0 text-center">אחראי</div>
                <div className="w-16 shrink-0 text-left">תאריך</div>
              </div>
            )}

            {/* Task rows */}
            {!isCollapsed && (
              <div>
                {tasks.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-apple-secondary/60">
                    אין משימות בקבוצה זו
                  </div>
                ) : (
                  tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggleDone={onToggleDone}
                      onCycleStatus={handleCycleStatus}
                      onClick={onTaskClick}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
