import { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { retryWithBackoff } from '@/lib/retry'
import { useToast } from '@/components/shared/ToastContext'
import type { FamilyMemberId } from '@/lib/types'

/** Convert a Blob/File to a persistent data URL (base64) for local storage */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

interface PhotoCaptureProps {
  dayId?: string
  location?: string
}

export function PhotoCapture({ dayId, location }: PhotoCaptureProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentMember } = useAuth()
  const { addPhoto } = useAppData()
  const { addToast } = useToast()

  /** Compress + store a single file, returning its final URL */
  const uploadFile = async (file: File): Promise<string> => {
    let compressed: Blob
    try {
      compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: false, // WebWorker can fail under strict CSP
      })
    } catch (compressionErr) {
      console.warn('Image compression failed, using original file:', compressionErr)
      compressed = file // Use original if compression fails
    }

    if (supabase) {
      try {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`
        const sb = supabase
        const { data } = await retryWithBackoff(async () => {
          const result = await sb.storage.from('photos').upload(`trip/${fileName}`, compressed)
          if (result.error) throw result.error
          return result
        })

        const { data: publicUrl } = sb.storage.from('photos').getPublicUrl(data.path)

        return publicUrl.publicUrl
      } catch (storageErr) {
        console.warn('Supabase storage failed, saving locally:', storageErr)
        // Fall back to local data URL
        return blobToDataUrl(compressed)
      }
    }

    // No Supabase — save as persistent data URL (survives page reload)
    return blobToDataUrl(compressed)
  }

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    setProgress({ done: 0, total: files.length })

    let succeeded = 0
    const failed: string[] = []

    // Sequential: keeps memory low on phones and preserves selection order
    for (const file of files) {
      try {
        const url = await uploadFile(file)

        addPhoto({
          url,
          caption: '',
          taken_by: (currentMember || 'aba') as FamilyMemberId,
          day_id: dayId,
          location: location || '',
          tags: [],
          is_favorite: false,
          taken_at: new Date().toISOString(),
        })

        succeeded += 1
      } catch (err) {
        console.error('Photo capture failed:', file.name, err)
        failed.push(file.name)
      } finally {
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
      }
    }

    if (succeeded > 0) {
      addToast(succeeded === 1 ? 'תמונה נוספה בהצלחה! 📸' : `${succeeded} תמונות נוספו בהצלחה! 📸`)
    }
    if (failed.length > 0) {
      addToast(
        failed.length === 1
          ? `שגיאה בהעלאת התמונה ${failed[0]}`
          : `${failed.length} תמונות נכשלו בהעלאה`,
        'error',
      )
    }

    setIsUploading(false)
    setProgress({ done: 0, total: 0 })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => {
          // Camera button — add capture attribute for mobile camera
          if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('multiple')
            fileInputRef.current.setAttribute('capture', 'environment')
            fileInputRef.current.click()
          }
        }}
        disabled={isUploading}
        className="flex-1"
      >
        {isUploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/[0.06] border-t-ios-blue ml-2" />
        ) : (
          <Camera className="h-4 w-4 ml-2" />
        )}
        {isUploading
          ? progress.total > 1
            ? `מעלה ${Math.min(progress.done + 1, progress.total)}/${progress.total}...`
            : 'מעלה...'
          : 'צלם תמונה'}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          // Upload button — remove capture so the multi-select file picker opens
          if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture')
            fileInputRef.current.setAttribute('multiple', '')
            fileInputRef.current.click()
          }
        }}
        disabled={isUploading}
        aria-label="העלאת תמונות מהגלריה"
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleCapture}
        className="hidden"
      />
    </div>
  )
}
