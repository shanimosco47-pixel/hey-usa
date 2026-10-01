import { useRef } from 'react'
import { Camera, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoCaptureProps {
  onFiles: (files: File[]) => void
  isUploading: boolean
  progress: { done: number; total: number }
}

export function PhotoCapture({ onFiles, isUploading, progress }: PhotoCaptureProps) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    // Reset so picking the same photos again still fires onChange
    e.target.value = ''
    if (files.length > 0) onFiles(files)
  }

  const label = isUploading
    ? progress.total > 1
      ? `מעלה ${Math.min(progress.done + 1, progress.total)} מתוך ${progress.total}...`
      : 'מעלה...'
    : 'הוסף תמונות מהגלריה'

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          onClick={() => galleryRef.current?.click()}
          disabled={isUploading}
          className="flex-1 min-h-[48px] bg-ios-blue text-white hover:bg-ios-blue/90"
        >
          {isUploading ? (
            <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Images className="ml-2 h-5 w-5" />
          )}
          {label}
        </Button>
        <Button
          variant="outline"
          onClick={() => cameraRef.current?.click()}
          disabled={isUploading}
          className="min-h-[48px]"
          aria-label="צלם תמונה"
        >
          <Camera className="h-5 w-5" />
        </Button>
      </div>
      {isUploading && progress.total > 1 && (
        <div
          className="h-1 overflow-hidden rounded-full bg-black/[0.06]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
        >
          <div
            className="h-full bg-ios-blue transition-all"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}
      {!isUploading && (
        <p className="text-xs text-apple-secondary">
          אפשר לבחור הרבה תמונות בבת אחת. כל תמונה משויכת אוטומטית ליום בטיול לפי תאריך הצילום
        </p>
      )}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
        aria-label="בחירת תמונות מהגלריה"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        aria-label="צילום תמונה"
      />
    </div>
  )
}
