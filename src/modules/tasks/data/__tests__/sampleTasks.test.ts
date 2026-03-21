import { sampleTasks } from '@/modules/tasks/data/sampleTasks'
import type { TaskStatus, TaskPriority, TaskGroup } from '@/lib/types'

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'waiting']
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const VALID_GROUPS: TaskGroup[] = ['pre_trip', 'during_trip', 'post_trip']

describe('sampleTasks', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(sampleTasks)).toBe(true)
    expect(sampleTasks.length).toBeGreaterThan(0)
  })

  it.each(sampleTasks.map((t) => [t.id, t]))('task %s has all required fields', (_id, task) => {
    expect(typeof task.id).toBe('string')
    expect(task.id.length).toBeGreaterThan(0)
    expect(typeof task.title).toBe('string')
    expect(task.title.length).toBeGreaterThan(0)
    expect(typeof task.status).toBe('string')
    expect(typeof task.priority).toBe('string')
    expect(typeof task.group).toBe('string')
    expect(typeof task.created_at).toBe('string')
    expect(typeof task.updated_at).toBe('string')
    expect(typeof task.order).toBe('number')
    expect(Array.isArray(task.assigned_to)).toBe(true)
  })

  it('all task statuses are valid', () => {
    for (const task of sampleTasks) {
      expect(VALID_STATUSES).toContain(task.status)
    }
  })

  it('all task priorities are valid', () => {
    for (const task of sampleTasks) {
      expect(VALID_PRIORITIES).toContain(task.priority)
    }
  })

  it('all task groups are valid', () => {
    for (const task of sampleTasks) {
      expect(VALID_GROUPS).toContain(task.group)
    }
  })

  it('all tasks have unique ids', () => {
    const ids = sampleTasks.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('completed tasks have a completed_at timestamp', () => {
    const doneTasks = sampleTasks.filter((t) => t.status === 'done')
    expect(doneTasks.length).toBeGreaterThan(0)
    for (const task of doneTasks) {
      expect(task.completed_at).toBeDefined()
      expect(typeof task.completed_at).toBe('string')
    }
  })

  it('contains tasks from all three groups', () => {
    const groups = new Set(sampleTasks.map((t) => t.group))
    expect(groups.has('pre_trip')).toBe(true)
    expect(groups.has('during_trip')).toBe(true)
    expect(groups.has('post_trip')).toBe(true)
  })
})
