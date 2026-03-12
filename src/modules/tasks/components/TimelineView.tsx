import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import type { Task, TaskGroup } from '@/types'

interface TimelineViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const GROUP_COLORS: Record<TaskGroup, string> = {
  pre_trip: '#6c5ce7',
  during_trip: '#00b894',
  post_trip: '#0984e3',
}

const GROUP_LABELS: Record<TaskGroup, string> = {
  pre_trip: 'לפני',
  during_trip: 'במהלך',
  post_trip: 'אחרי',
}

function getMonthsBetween(start: Date, end: Date): { label: string; date: Date }[] {
  const months: { label: string; date: Date }[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  while (current <= end) {
    months.push({
      label: new Intl.DateTimeFormat('he-IL', { month: 'short', year: '2-digit' }).format(current),
      date: new Date(current),
    })
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

export function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  const { months, tasksWithDates, tasksWithoutDates, timelineStart, totalDays } = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(2026, 8, 30) // September 2026

    const months = getMonthsBetween(start, end)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const withDates = tasks
      .filter((t) => t.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

    const withoutDates = tasks.filter((t) => !t.due_date)

    return {
      months,
      tasksWithDates: withDates,
      tasksWithoutDates: withoutDates,
      timelineStart: start,
      totalDays,
    }
  }, [tasks])

  const getBarPosition = (dueDate: string) => {
    const date = new Date(dueDate)
    const daysSinceStart = Math.ceil((date.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    const percentage = Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100))
    return percentage
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'done') return false
    const date = new Date(dueDate)
    return date < new Date()
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 700 }}>
        {/* Legend */}
        <div className="mb-4 flex items-center gap-4">
          {(Object.keys(GROUP_COLORS) as TaskGroup[]).map((group) => (
            <div key={group} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: GROUP_COLORS[group] }} />
              <span className="text-xs text-brown-light">{GROUP_LABELS[group]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-red-400 opacity-60" />
            <span className="text-xs text-brown-light">באיחור</span>
          </div>
        </div>

        {/* Month headers */}
        <div className="mb-1 flex border-b border-sand-dark">
          <div className="w-48 shrink-0" />
          <div className="relative flex flex-1">
            {months.map((month, i) => (
              <div
                key={i}
                className="text-center text-[11px] font-medium text-brown-light"
                style={{ width: `${100 / months.length}%` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>

        {/* Grid lines + tasks */}
        <div className="relative">
          {/* Vertical grid lines */}
          <div className="pointer-events-none absolute inset-0 flex" style={{ right: 192 }}>
            {months.map((_, i) => (
              <div
                key={i}
                className="border-r border-sand-dark/40"
                style={{ width: `${100 / months.length}%` }}
              />
            ))}
          </div>

          {/* Today line */}
          {(() => {
            const todayPos = getBarPosition(new Date().toISOString().split('T')[0])
            return (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-terracotta"
                style={{ right: `calc(192px + ${todayPos}% * (100% - 192px) / 100%)` }}
              >
                <div className="absolute -top-1 -translate-x-1/2 rounded bg-terracotta px-1 py-0.5 text-[9px] font-bold text-white">
                  היום
                </div>
              </div>
            )
          })()}

          {/* Tasks with dates */}
          {tasksWithDates.map((task) => {
            const pos = getBarPosition(task.due_date!)
            const overdue = isOverdue(task.due_date!, task.status)
            const groupColor = GROUP_COLORS[task.group]

            return (
              <div
                key={task.id}
                className="group flex items-center border-b border-sand-dark/20 py-1.5 cursor-pointer hover:bg-white/30 transition-colors"
                onClick={() => onTaskClick(task)}
              >
                {/* Task label */}
                <div className="w-48 shrink-0 truncate px-2 text-xs font-medium text-brown" title={task.title}>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: groupColor }} />
                    <span className={cn('truncate', task.status === 'done' && 'line-through opacity-50')}>
                      {task.title}
                    </span>
                  </div>
                </div>

                {/* Timeline bar */}
                <div className="relative flex-1">
                  <div
                    className={cn(
                      'absolute h-5 rounded-md transition-all group-hover:h-6 group-hover:-translate-y-0.5',
                      overdue && 'animate-pulse',
                    )}
                    style={{
                      right: `${Math.max(0, pos - 3)}%`,
                      width: '3%',
                      minWidth: 12,
                      backgroundColor: overdue ? '#e17055' : groupColor,
                      opacity: task.status === 'done' ? 0.4 : 0.8,
                    }}
                    title={`${task.title} - ${new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(new Date(task.due_date!))}`}
                  />
                </div>
              </div>
            )
          })}

          {/* Tasks without dates */}
          {tasksWithoutDates.length > 0 && (
            <>
              <div className="border-t-2 border-dashed border-sand-dark/40 mt-2 pt-2 px-2">
                <span className="text-[11px] font-medium text-brown-light/60">ללא תאריך יעד</span>
              </div>
              {tasksWithoutDates.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center border-b border-sand-dark/20 py-1.5 cursor-pointer hover:bg-white/30 transition-colors"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="w-48 shrink-0 truncate px-2 text-xs font-medium text-brown" title={task.title}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: GROUP_COLORS[task.group] }}
                      />
                      <span className={cn('truncate', task.status === 'done' && 'line-through opacity-50')}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center px-4">
                    <span className="text-[11px] text-brown-light/40">-</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
