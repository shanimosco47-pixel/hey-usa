/**
 * Sync engine tests.
 *
 * `toSupabaseShape` is a private function, so we test it indirectly.
 * Since flushSyncQueue requires Dexie and Supabase, we mock those
 * dependencies and verify the shape transformations through the flush path.
 */
import type { Task, LocationNote } from '@/lib/types'

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSyncQueueData: Array<{
  id: string
  table: string
  recordId: string
  action: 'upsert' | 'delete'
  timestamp: string
  synced: number
}> = []

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      upsert: (payload: unknown) => {
        mockUpsert(table, payload)
        return Promise.resolve({ error: null })
      },
      delete: () => ({
        eq: (_col: string, _val: string) => {
          mockDeleteEq(table, _val)
          return Promise.resolve({ error: null })
        },
      }),
    }),
  },
}))

// Mock records stored in Dexie tables
const mockRecords: Record<string, Record<string, unknown>> = {}

vi.mock('@/lib/db', () => ({
  localDb: {
    syncQueue: {
      add: vi.fn(async (item: (typeof mockSyncQueueData)[0]) => {
        mockSyncQueueData.push(item)
        return item.id
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      where: (field: string) => ({
        equals: (val: number) => ({
          toArray: async () => mockSyncQueueData.filter((i) => i.synced === val),
          filter: () => ({
            delete: vi.fn().mockResolvedValue(0),
          }),
        }),
      }),
      update: vi.fn(async (id: string, data: { synced: number }) => {
        const item = mockSyncQueueData.find((i) => i.id === id)
        if (item) item.synced = data.synced
      }),
    },
    table: (name: string) => ({
      get: async (id: string) => mockRecords[name]?.[id],
    }),
  },
}))

// Import after mocks are set up
const { queueSync, flushSyncQueue } = await import('@/lib/sync')

beforeEach(() => {
  mockSyncQueueData.length = 0
  Object.keys(mockRecords).forEach((k) => delete mockRecords[k])
  mockUpsert.mockClear()
  mockDeleteEq.mockClear()
})

describe('sync engine', () => {
  describe('queueSync', () => {
    it('adds an item to the sync queue', async () => {
      await queueSync('tasks', 'task-1', 'upsert')

      expect(mockSyncQueueData).toHaveLength(1)
      expect(mockSyncQueueData[0].table).toBe('tasks')
      expect(mockSyncQueueData[0].recordId).toBe('task-1')
      expect(mockSyncQueueData[0].action).toBe('upsert')
      expect(mockSyncQueueData[0].synced).toBe(0)
    })
  })

  describe('flushSyncQueue — toSupabaseShape transforms', () => {
    it('transforms Task: group → task_group, order → sort_order', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Book flights',
        status: 'todo',
        priority: 'high',
        group: 'pre_trip',
        assigned_to: ['aba'],
        order: 5,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }

      mockRecords['tasks'] = { 'task-1': task }

      await queueSync('tasks', 'task-1', 'upsert')
      await flushSyncQueue()

      expect(mockUpsert).toHaveBeenCalledTimes(1)
      const [table, payload] = mockUpsert.mock.calls[0]
      expect(table).toBe('tasks')
      expect(payload).toMatchObject({
        id: 'task-1',
        task_group: 'pre_trip',
        sort_order: 5,
      })
      // Verify original field names are not present
      expect(payload).not.toHaveProperty('group')
      expect(payload).not.toHaveProperty('order')
    })

    it('transforms LocationNote: locationId → location_id', async () => {
      const note: LocationNote = {
        id: 'note-1',
        locationId: 'denver',
        text: 'Great views',
        author: 'ima',
        color: 'yellow',
        pinned: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }

      mockRecords['locationNotes'] = { 'note-1': note }

      await queueSync('locationNotes', 'note-1', 'upsert')
      await flushSyncQueue()

      expect(mockUpsert).toHaveBeenCalledTimes(1)
      const [table, payload] = mockUpsert.mock.calls[0]
      expect(table).toBe('location_notes')
      expect(payload).toMatchObject({
        id: 'note-1',
        location_id: 'denver',
      })
      expect(payload).not.toHaveProperty('locationId')
    })

    it('passes through unknown tables as-is', async () => {
      const record = {
        id: 'exp-1',
        title: 'Lunch',
        amount: 25,
        currency: 'USD',
        category: 'food',
        paid_by: 'aba',
        date: '2026-09-10',
        created_at: '2026-09-10T00:00:00Z',
      }

      mockRecords['expenses'] = { 'exp-1': record }

      await queueSync('expenses', 'exp-1', 'upsert')
      await flushSyncQueue()

      expect(mockUpsert).toHaveBeenCalledTimes(1)
      const [table, payload] = mockUpsert.mock.calls[0]
      expect(table).toBe('expenses')
      // expenses has no special transform, so fields pass through
      expect(payload).toMatchObject({
        id: 'exp-1',
        title: 'Lunch',
        amount: 25,
      })
    })

    it('handles delete actions', async () => {
      await queueSync('tasks', 'task-99', 'delete')
      await flushSyncQueue()

      expect(mockDeleteEq).toHaveBeenCalledWith('tasks', 'task-99')
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  describe('flushSyncQueue — return value', () => {
    it('returns the count of successfully synced items', async () => {
      mockRecords['expenses'] = {
        e1: { id: 'e1', title: 'A' },
        e2: { id: 'e2', title: 'B' },
      }

      await queueSync('expenses', 'e1', 'upsert')
      await queueSync('expenses', 'e2', 'upsert')

      const count = await flushSyncQueue()
      expect(count).toBe(2)
    })

    it('skips items for unmapped tables', async () => {
      await queueSync('nonExistentTable', 'x', 'upsert')
      const count = await flushSyncQueue()
      expect(count).toBe(0)
    })
  })
})
