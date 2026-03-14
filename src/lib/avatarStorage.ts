import type { FamilyMemberId } from '@/types'

const STORAGE_KEY = 'hey-usa-avatars'

/** Get all stored avatar photos as { memberId: base64DataUrl } */
function getAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** Get avatar photo URL for a specific member, or null if not set */
export function getAvatarPhoto(memberId: FamilyMemberId): string | null {
  return getAll()[memberId] || null
}

/** Save a compressed avatar photo for a member */
export function saveAvatarPhoto(memberId: FamilyMemberId, dataUrl: string): void {
  const all = getAll()
  all[memberId] = dataUrl
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Storage full — ignore
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
