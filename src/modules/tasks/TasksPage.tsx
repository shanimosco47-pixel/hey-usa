import { useState, useMemo, useCallback } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Plus,
  Search,
  Table2,
  Columns3,
  GanttChart,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS, STATUS_MAP } from '@/constants'
import type { Task, TaskStatus, TaskPriority, FamilyMemberId } from '@/types'
import { useTasks } from './hooks/useTasks'
import type { TaskFilters } from './hooks/useTasks'
import { TableView } from './components/TableView'
import { KanbanView } from './components/KanbanView'
import { TimelineView } from './components/TimelineView'
import { TaskDialog, type TaskFormData } from './components/TaskDialog'

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'waiting', 'done']

const STATUS_FILTER_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'לביצוע' },
  { value: 'in_progress', label: 'בתהליך' },
  { value: 'waiting', label: 'ממתין' },
  { value: 'done', label: 'בוצע' },
]

const PRIORITY_FILTER_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'דחוף' },
  { value: 'high', label: 'גבוה' },
  { value: 'medium', label: 'בינוני' },
  { value: 'low', label: 'נמוך' },
]

const FAMILY_LIST = Object.values(FAMILY_MEMBERS)

export default function TasksPage() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    filterTasks,
    taskCount,
    doneCount,
  } = useTasks()

  const [activeView, setActiveView] = useState<string>('table')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([])
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([])
  const [assigneeFilter, setAssigneeFilter] = useState<FamilyMemberId[]>([])

  const hasFilters = search || statusFilter.length || priorityFilter.length || assigneeFilter.length

  const filters: TaskFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter.length ? statusFilter : undefined,
      priority: priorityFilter.length ? priorityFilter : undefined,
      assignee: assigneeFilter.length ? assigneeFilter : undefined,
    }),
    [search, statusFilter, priorityFilter, assigneeFilter],
  )

  const filteredTasks = useMemo(() => {
    if (!hasFilters) return tasks
    return filterTasks(filters)
  }, [tasks, hasFilters, filterTasks, filters])

  const filteredByGroup = useMemo(() => {
    const grouped = { pre_trip: [] as Task[], during_trip: [] as Task[], post_trip: [] as Task[] }
    for (const task of filteredTasks) {
      grouped[task.group].push(task)
    }
    for (const g of Object.keys(grouped) as (keyof typeof grouped)[]) {
      grouped[g].sort((a, b) => a.order - b.order)
    }
    return grouped
  }, [filteredTasks])

  const filteredByStatus = useMemo(() => {
    const grouped = { todo: [] as Task[], in_progress: [] as Task[], done: [] as Task[], waiting: [] as Task[] }
    for (const task of filteredTasks) {
      grouped[task.status].push(task)
    }
    for (const s of Object.keys(grouped) as TaskStatus[]) {
      grouped[s].sort((a, b) => a.order - b.order)
    }
    return grouped
  }, [filteredTasks])

  // Handlers
  const handleToggleDone = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
      updateTask(id, { status: newStatus })
    },
    [tasks, updateTask],
  )

  const handleCycleStatus = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      const currentIndex = STATUS_ORDER.indexOf(task.status)
      const nextIndex = (currentIndex + 1) % STATUS_ORDER.length
      updateTask(id, { status: STATUS_ORDER[nextIndex] })
    },
    [tasks, updateTask],
  )

  const handleUpdateStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      updateTask(taskId, { status: newStatus })
    },
    [updateTask],
  )

  const handleTaskClick = useCallback((task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }, [])

  const handleAddClick = useCallback(() => {
    setEditingTask(null)
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(
    (data: TaskFormData) => {
      if (editingTask) {
        updateTask(editingTask.id, {
          title: data.title,
          description: data.description || undefined,
          group: data.group,
          status: data.status,
          priority: data.priority,
          assigned_to: data.assigned_to,
          due_date: data.due_date || undefined,
        })
      } else {
        const maxOrder = tasks
          .filter((t) => t.group === data.group)
          .reduce((max, t) => Math.max(max, t.order), -1)
        addTask({
          title: data.title,
          description: data.description || undefined,
          group: data.group,
          status: data.status,
          priority: data.priority,
          assigned_to: data.assigned_to,
          due_date: data.due_date || undefined,
          order: maxOrder + 1,
        })
      }
    },
    [editingTask, updateTask, addTask, tasks],
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteTask(id)
    },
    [deleteTask],
  )

  const clearFilters = () => {
    setSearch('')
    setStatusFilter([])
    setPriorityFilter([])
    setAssigneeFilter([])
  }

  const toggleStatusFilter = (s: TaskStatus) => {
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const togglePriorityFilter = (p: TaskPriority) => {
    setPriorityFilter((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const toggleAssigneeFilter = (m: FamilyMemberId) => {
    setAssigneeFilter((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-apple-primary">משימות</h1>
          <p className="mt-0.5 text-sm text-apple-secondary">
            {doneCount} מתוך {taskCount} הושלמו
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-1.5 rounded-xl bg-ios-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-ios-blue/90 hover:shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>הוסף משימה</span>
        </button>
      </div>

      {/* View switcher tabs */}
      <Tabs.Root value={activeView} onValueChange={setActiveView}>
        <div className="mb-4 flex items-center justify-between">
          <Tabs.List className="flex gap-1 rounded-xl bg-black/[0.04] p-1">
            <Tabs.Trigger
              value="table"
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                activeView === 'table'
                  ? 'bg-white text-apple-primary shadow-sm'
                  : 'text-apple-secondary hover:text-apple-primary',
              )}
            >
              <Table2 className="h-4 w-4" />
              <span>טבלה</span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="kanban"
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                activeView === 'kanban'
                  ? 'bg-white text-apple-primary shadow-sm'
                  : 'text-apple-secondary hover:text-apple-primary',
              )}
            >
              <Columns3 className="h-4 w-4" />
              <span>קנבן</span>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="timeline"
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                activeView === 'timeline'
                  ? 'bg-white text-apple-primary shadow-sm'
                  : 'text-apple-secondary hover:text-apple-primary',
              )}
            >
              <GanttChart className="h-4 w-4" />
              <span>ציר זמן</span>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Filter summary */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-ios-red hover:underline"
            >
              <X className="h-3 w-3" />
              נקה סינון ({filteredTasks.length} תוצאות)
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: 180 }}>
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apple-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש משימות..."
              className="w-full rounded-xl border border-black/[0.06] glass py-2 pe-3 ps-10 text-sm text-apple-primary placeholder:text-apple-tertiary focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1">
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const active = statusFilter.includes(opt.value)
              const cfg = STATUS_MAP[opt.value]
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleStatusFilter(opt.value)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border',
                    active
                      ? `${cfg?.bg} ${cfg?.color} border-transparent`
                      : 'border-black/[0.06] bg-transparent text-apple-tertiary hover:bg-black/[0.03]',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Priority filter */}
          <div className="flex gap-1">
            {PRIORITY_FILTER_OPTIONS.map((opt) => {
              const active = priorityFilter.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => togglePriorityFilter(opt.value)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border',
                    active
                      ? 'border-ios-blue bg-ios-blue/10 text-ios-blue'
                      : 'border-black/[0.06] bg-transparent text-apple-tertiary hover:bg-black/[0.03]',
                  )}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Assignee filter */}
          <div className="flex gap-1">
            {FAMILY_LIST.map((member) => {
              const active = assigneeFilter.includes(member.id)
              return (
                <button
                  key={member.id}
                  onClick={() => toggleAssigneeFilter(member.id)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all',
                    active
                      ? 'shadow-sm'
                      : 'opacity-40 hover:opacity-70',
                  )}
                  style={{
                    backgroundColor: `${member.color}20`,
                    borderColor: member.color,
                    borderWidth: 1.5,
                    ...(active ? { boxShadow: `0 0 0 2px ${member.color}` } : {}),
                  }}
                  title={member.name}
                >
                  {member.emoji}
                </button>
              )
            })}
          </div>
        </div>

        {/* Views */}
        <Tabs.Content value="table" className="focus:outline-none">
          <TableView
            tasksByGroup={filteredByGroup}
            onToggleDone={handleToggleDone}
            onCycleStatus={handleCycleStatus}
            onTaskClick={handleTaskClick}
          />
        </Tabs.Content>

        <Tabs.Content value="kanban" className="focus:outline-none">
          <KanbanView
            tasksByStatus={filteredByStatus}
            onUpdateStatus={handleUpdateStatus}
            onTaskClick={handleTaskClick}
          />
        </Tabs.Content>

        <Tabs.Content value="timeline" className="focus:outline-none">
          <TimelineView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
