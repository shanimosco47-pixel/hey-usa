import { useState, useCallback, useMemo } from 'react'
import type { Task, TaskStatus, TaskPriority, TaskGroup, FamilyMemberId } from '@/types'
import { sampleTasks } from '../data/sampleTasks'

export interface TaskFilters {
  search?: string
  status?: TaskStatus[]
  assignee?: FamilyMemberId[]
  priority?: TaskPriority[]
  group?: TaskGroup[]
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)

  const addTask = useCallback((task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    }
    setTasks((prev) => [...prev, newTask])
    return newTask
  }, [])

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, ...changes, updated_at: new Date().toISOString() }
        if (changes.status === 'done' && t.status !== 'done') {
          updated.completed_at = new Date().toISOString()
        }
        if (changes.status && changes.status !== 'done') {
          updated.completed_at = undefined
        }
        return updated
      }),
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const reorderTask = useCallback((id: string, newOrder: number, newGroup?: TaskGroup) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id)
      if (!task) return prev

      const group = newGroup ?? task.group
      const updated = prev.map((t) => {
        if (t.id === id) {
          return { ...t, order: newOrder, group, updated_at: new Date().toISOString() }
        }
        return t
      })

      return updated
    })
  }, [])

  const getTasksByGroup = useCallback(() => {
    const grouped: Record<TaskGroup, Task[]> = {
      pre_trip: [],
      during_trip: [],
      post_trip: [],
    }
    for (const task of tasks) {
      grouped[task.group].push(task)
    }
    // Sort by order within each group
    for (const group of Object.keys(grouped) as TaskGroup[]) {
      grouped[group].sort((a, b) => a.order - b.order)
    }
    return grouped
  }, [tasks])

  const getTasksByStatus = useCallback(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
      waiting: [],
    }
    for (const task of tasks) {
      grouped[task.status].push(task)
    }
    for (const status of Object.keys(grouped) as TaskStatus[]) {
      grouped[status].sort((a, b) => a.order - b.order)
    }
    return grouped
  }, [tasks])

  const filterTasks = useCallback(
    (filters: TaskFilters): Task[] => {
      return tasks.filter((task) => {
        if (filters.search) {
          const q = filters.search.toLowerCase()
          const matchesTitle = task.title.toLowerCase().includes(q)
          const matchesDesc = task.description?.toLowerCase().includes(q)
          const matchesTags = task.tags?.some((tag) => tag.toLowerCase().includes(q))
          if (!matchesTitle && !matchesDesc && !matchesTags) return false
        }

        if (filters.status?.length && !filters.status.includes(task.status)) {
          return false
        }

        if (filters.assignee?.length) {
          const hasMatch = task.assigned_to.some((a) => filters.assignee!.includes(a))
          if (!hasMatch) return false
        }

        if (filters.priority?.length && !filters.priority.includes(task.priority)) {
          return false
        }

        if (filters.group?.length && !filters.group.includes(task.group)) {
          return false
        }

        return true
      })
    },
    [tasks],
  )

  const taskCount = useMemo(() => tasks.length, [tasks])
  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks])

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    reorderTask,
    getTasksByGroup,
    getTasksByStatus,
    filterTasks,
    taskCount,
    doneCount,
  }
}
