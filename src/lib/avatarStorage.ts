import type { FamilyMemberId } from '@/types'
import * as db from './database'
import { supabase } from './supabase'

const STORAGE_KEY = 'hey-usa-avatars'
const NAMES_KEY = 'hey-usa-member-names'

// ─── Local helpers ──────────────────────────────────────────────────

function getAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getAllNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NAMES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/** Get avatar photo URL for a specific member, or null if not set */
export function getAvatarPhoto(memberId: FamilyMemberId): string | null {
  return getAll()[memberId] || null
}

/** Save a compressed avatar photo for a member (localStorage + Supabase) */
export function saveAvatarPhoto(memberId: FamilyMemberId, dataUrl: string): void {
  const all = getAll()
  all[memberId] = dataUrl
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Storage full — ignore
  }
  // Persist to Supabase
  if (supabase) {
    const customName = getMemberName(memberId)
    db.upsertMemberAvatar({
      member_id: memberId,
      photo_data: dataUrl,
      custom_name: customName,
    }).catch(() => {})
  }
}

/** Remove avatar photo for a member */
export function removeAvatarPhoto(memberId: FamilyMemberId): void {
  const all = getAll()
  delete all[memberId]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
  if (supabase) {
    const customName = getMemberName(memberId)
    db.upsertMemberAvatar({
      member_id: memberId,
      photo_data: null,
      custom_name: customName,
    }).catch(() => {})
  }
}

/** Get custom name for a member, or null if not set */
export function getMemberName(memberId: FamilyMemberId): string | null {
  return getAllNames()[memberId] || null
}

/** Save a custom name for a member (localStorage + Supabase) */
export function saveMemberName(memberId: FamilyMemberId, name: string): void {
  const all = getAllNames()
  all[memberId] = name
  try {
    localStorage.setItem(NAMES_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
  if (supabase) {
    const photo = getAvatarPhoto(memberId)
    db.upsertMemberAvatar({
      member_id: memberId,
      photo_data: photo,
      custom_name: name,
    }).catch(() => {})
  }
}

/**
 * Load avatars from Supabase and hydrate localStorage.
 * Called once on app startup.
 */
export async function hydrateAvatarsFromSupabase(): Promise<void> {
  if (!supabase) return
  try {
    const rows = await db.fetchMemberAvatars()
    if (rows.length === 0) return

    const avatars = getAll()
    const names = getAllNames()
    let avatarsChanged = false
    let namesChanged = false

    for (const row of rows) {
      if (row.photo_data && !avatars[row.member_id]) {
        avatars[row.member_id] = row.photo_data
        avatarsChanged = true
      }
      // Always prefer Supabase data (it's the persistent source)
      if (row.photo_data) {
        avatars[row.member_id] = row.photo_data
        avatarsChanged = true
      }
      if (row.custom_name) {
        names[row.member_id] = row.custom_name
        namesChanged = true
      }
    }

    if (avatarsChanged) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(avatars)) } catch { /* ignore */ }
    }
    if (namesChanged) {
      try { localStorage.setItem(NAMES_KEY, JSON.stringify(names)) } catch { /* ignore */ }
    }
  } catch {
    // Supabase unavailable — localStorage data is still usable
  }
}

/**
 * Compress and crop an image file to a square thumbnail.
 * Returns a base64 data URL (JPEG, ~100KB max).
 */
export function compressImageFile(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxSize
        canvas.height = maxSize

        // Center-crop to square
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
