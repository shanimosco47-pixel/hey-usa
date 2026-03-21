import { describe, it, expect } from 'vitest'

// The database module's assertSupabase() throws when supabase is null.
// We test that all exported fetch functions throw with the expected error
// when Supabase is not configured (no env vars in test).

describe('database', () => {
  // Dynamic import so the module-level supabase import doesn't break other tests
  const getDb = () => import('@/lib/database')

  it('fetchBudgetSettings throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchBudgetSettings()).rejects.toThrow('Supabase not configured')
  })

  it('fetchExpenses throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchExpenses()).rejects.toThrow('Supabase not configured')
  })

  it('fetchTasks throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchTasks()).rejects.toThrow('Supabase not configured')
  })

  it('fetchPackingItems throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchPackingItems()).rejects.toThrow('Supabase not configured')
  })

  it('fetchItinerary throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchItinerary()).rejects.toThrow('Supabase not configured')
  })

  it('fetchBlogPosts throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchBlogPosts()).rejects.toThrow('Supabase not configured')
  })

  it('fetchPhotos throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchPhotos()).rejects.toThrow('Supabase not configured')
  })

  it('fetchDocuments throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchDocuments()).rejects.toThrow('Supabase not configured')
  })

  it('fetchPlaylistItems throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchPlaylistItems()).rejects.toThrow('Supabase not configured')
  })

  it('fetchLocationNotes throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchLocationNotes()).rejects.toThrow('Supabase not configured')
  })

  it('fetchChatMessages throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchChatMessages()).rejects.toThrow('Supabase not configured')
  })

  it('fetchMemberAvatars throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.fetchMemberAvatars()).rejects.toThrow('Supabase not configured')
  })

  it('isSeeded throws when supabase is not configured', async () => {
    const db = await getDb()
    await expect(db.isSeeded()).rejects.toThrow('Supabase not configured')
  })
})
