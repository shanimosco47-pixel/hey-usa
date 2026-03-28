import { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentMember } = useAuth()
  const { addPhoto } = useAppData()
  const { addToast } = useToast()

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })

      let url: string

      if (supabase) {
        try {
          const fileName = `${Date.now()}-${compressed.name}`
          const { data, error } = await supabase.storage
            .from('photos')
            .upload(`trip/${fileName}`, compressed)

          if (error) throw error

          const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(data.path)

          url = publicUrl.publicUrl
        } catch (storageErr) {
          console.warn('Supabase storage failed, saving locally:', storageErr)
          // Fall back to local data URL
          url = await blobToDataUrl(compressed)
        }
      } else {
        // No Supabase — save as persistent data URL (survives page reload)
        url = await blobToDataUrl(compressed)
      }

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

      addToast('תמונה נוספה בהצלחה! 📸')
    } catch (err) {
      console.error('Photo capture failed:', err)
      addToast('שגיאה בהעלאת התמונה', 'error')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex-1"
      >
        {isUploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/[0.06] border-t-ios-blue ml-2" />
        ) : (
          <Camera className="h-4 w-4 ml-2" />
        )}
        {isUploading ? 'מעלה...' : 'צלם תמונה'}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture')
            fileInputRef.current.click()
            setTimeout(() => fileInputRef.current?.setAttribute('capture', 'environment'), 100)
          }
        }}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
    </div>
  )
}
