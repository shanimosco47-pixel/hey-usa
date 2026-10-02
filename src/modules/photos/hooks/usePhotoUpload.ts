import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import { useToast } from '@/components/shared/ToastContext'
import { supabase } from '@/lib/supabase'
import { localDb } from '@/lib/db'
import type { FamilyMemberId } from '@/lib/types'
import {
  UnsupportedPhotoError,
  blobToDataUrl,
  listPendingUploads,
  isInlinePhotoUrl,
  markPendingFailed,
  moveInlinePhotoToStorage,
  preparePhoto,
  queuePendingUpload,
  removePendingUpload,
  runPool,
  uploadToStorage,
} from '../lib/photoUpload'

/** Network uploads in flight at once. Compression itself still runs one at a time. */
const CONCURRENCY = 3

type Outcome = 'uploaded' | 'queued' | 'unsupported' | 'failed'

// Pending ids being uploaded right now, shared across hook instances so a
// retry triggered by the `online` event never uploads the same photo twice.
const inFlight = new Set<string>()
// Inline photos already attempted this session (success or not), so a failing
// one is not retried on every render; the next app start tries again.
const inlineAttempted = new Set<string>()

function heb(n: number, one: string, many: string) {
  return n === 1 ? one : `${n} ${many}`
}

/** Keep the screen awake while uploading: a locked phone suspends the page. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let released = false
    navigator.wakeLock
      .request('screen')
      .then((l) => {
        if (released) l.release().catch(() => {})
        else lock = l
      })
      .catch(() => {}) // Not allowed (battery saver, iframe): uploads still work
    return () => {
      released = true
      lock?.release().catch(() => {})
    }
  }, [active])
}

function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [active])
}

export function usePhotoUpload() {
  const { currentMember } = useAuth()
  const { addPhoto, updatePhoto, photos, itineraryDays } = useAppData()
  const { addToast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [isRetrying, setIsRetrying] = useState(false)
  const busyRef = useRef(false)
  // Uploads run one batch after another: a share arriving mid-upload waits its turn
  const chainRef = useRef<Promise<void>>(Promise.resolve())

  const pendingCount =
    useLiveQuery(() => localDb.pendingPhotoUploads.count().catch(() => 0), [], 0) ?? 0

  useWakeLock(isUploading)
  useLeaveWarning(isUploading)

  const uploadOne = useCallback(
    async (file: File): Promise<{ outcome: Outcome; matchedDay: boolean }> => {
      const member = (currentMember || 'aba') as FamilyMemberId
      let prepared
      try {
        prepared = await preparePhoto(file, { member, days: itineraryDays })
      } catch (err) {
        console.error('Photo preparation failed:', file.name, err)
        return {
          outcome: err instanceof UnsupportedPhotoError ? 'unsupported' : 'failed',
          matchedDay: false,
        }
      }
      const { blob, photo } = prepared
      const matchedDay = Boolean(photo.day_id)

      // Offline-only mode (no Supabase configured): local data URL as before
      if (!supabase) {
        addPhoto({ ...photo, url: await blobToDataUrl(blob) })
        return { outcome: 'uploaded', matchedDay }
      }

      // Park the file first, so a failed or interrupted upload is retried
      // later instead of being lost or saved as a heavy base64 row
      let pendingId: string | undefined
      try {
        pendingId = await queuePendingUpload(blob, file.name, photo)
        inFlight.add(pendingId)
      } catch (err) {
        console.warn('Could not park photo locally, uploading directly:', err)
      }

      try {
        const url = await uploadToStorage(blob, file.name)
        addPhoto({ ...photo, url })
        if (pendingId) await removePendingUpload(pendingId).catch(() => {})
        return { outcome: 'uploaded', matchedDay }
      } catch (err) {
        console.warn('Photo upload failed:', file.name, err)
        if (pendingId) {
          await markPendingFailed(pendingId, err).catch(() => {})
          return { outcome: 'queued', matchedDay }
        }
        return { outcome: 'failed', matchedDay }
      } finally {
        if (pendingId) inFlight.delete(pendingId)
      }
    },
    [currentMember, itineraryDays, addPhoto],
  )

  const runBatch = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith('image/') || /\.hei[cf]$/i.test(f.name))
      if (images.length === 0) return
      busyRef.current = true
      setIsUploading(true)
      setProgress({ done: 0, total: images.length })
      try {
        const results = await runPool(images, CONCURRENCY, async (file) => {
          try {
            return await uploadOne(file)
          } finally {
            setProgress((p) => ({ ...p, done: p.done + 1 }))
          }
        })
        const count = (o: Outcome) => results.filter((r) => r.outcome === o).length
        const uploaded = count('uploaded')
        const queued = count('queued')
        const unsupported = count('unsupported')
        const failed = count('failed')
        const matched = results.filter((r) => r.outcome !== 'failed' && r.matchedDay).length

        if (uploaded > 0) {
          const dayNote = matched > 0 ? ` · ${matched} שויכו ליום בטיול לפי תאריך הצילום` : ''
          addToast(`${heb(uploaded, 'תמונה נוספה', 'תמונות נוספו')} 📸${dayNote}`)
        }
        if (queued > 0) {
          addToast(
            `${heb(queued, 'תמונה אחת נשמרה', 'תמונות נשמרו')} בטלפון ויעלו אוטומטית כשיהיה חיבור`,
            'info',
          )
        }
        if (unsupported > 0) {
          addToast(
            `${heb(unsupported, 'תמונת HEIC אחת לא נתמכת', 'תמונות HEIC לא נתמכות')} בדפדפן הזה. כבו את שמירת HEIF בהגדרות המצלמה`,
            'error',
          )
        }
        if (failed > 0) {
          addToast(`${heb(failed, 'תמונה אחת נכשלה', 'תמונות נכשלו')} בהעלאה`, 'error')
        }
      } finally {
        busyRef.current = false
        setIsUploading(false)
        setProgress({ done: 0, total: 0 })
      }
    },
    [uploadOne, addToast],
  )

  const uploadFiles = useCallback(
    (files: File[]): Promise<void> => {
      const run = chainRef.current.then(() => runBatch(files))
      chainRef.current = run.catch(() => {})
      return run
    },
    [runBatch],
  )

  /** Upload photos left in the local queue by an earlier failure. */
  const retryPending = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!supabase || busyRef.current) return
      const pending = (await listPendingUploads().catch(() => [])).filter(
        (p) => !inFlight.has(p.id),
      )
      if (pending.length === 0) return
      busyRef.current = true
      setIsRetrying(true)
      let ok = 0
      try {
        await runPool(pending, CONCURRENCY, async (rec) => {
          inFlight.add(rec.id)
          try {
            const url = await uploadToStorage(rec.blob, rec.file_name)
            addPhoto({ ...rec.photo, url })
            await removePendingUpload(rec.id).catch(() => {})
            ok += 1
          } catch (err) {
            await markPendingFailed(rec.id, err).catch(() => {})
          } finally {
            inFlight.delete(rec.id)
          }
        })
      } finally {
        busyRef.current = false
        setIsRetrying(false)
      }
      const left = pending.length - ok
      if (ok > 0) addToast(`${heb(ok, 'תמונה שחיכתה הועלתה', 'תמונות שחיכו הועלו')} 📸`)
      if (left > 0 && !opts.silent) {
        addToast(`${heb(left, 'תמונה אחת עדיין ממתינה', 'תמונות עדיין ממתינות')} לחיבור`, 'error')
      }
    },
    [addPhoto, addToast],
  )

  // Retry quietly when the page opens and whenever the connection returns
  useEffect(() => {
    if (!supabase) return
    void retryPending({ silent: true })
    const onOnline = () => void retryPending({ silent: true })
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [retryPending])

  // Move photos still stored as base64 inside their row to Storage, one at a
  // time and silently: lighter sync for every device, same picture.
  useEffect(() => {
    if (!supabase || !navigator.onLine) return
    const todo = photos.filter((p) => isInlinePhotoUrl(p.url) && !inlineAttempted.has(p.id))
    if (todo.length === 0) return
    todo.forEach((p) => inlineAttempted.add(p.id))
    void (async () => {
      for (const p of todo) {
        try {
          const url = await moveInlinePhotoToStorage(p)
          updatePhoto(p.id, { url })
        } catch (err) {
          console.warn('[photos] Could not move inline photo to storage:', p.id, err)
        }
      }
    })()
  }, [photos, updatePhoto])

  return { uploadFiles, isUploading, progress, pendingCount, retryPending, isRetrying }
}
