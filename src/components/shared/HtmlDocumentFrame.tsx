import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { fetchHtmlAsBlobUrl } from '@/lib/documentFile'

interface HtmlDocumentFrameProps {
  url: string
  title: string
  className?: string
  /** Rendered instead of the frame when the file can't be downloaded */
  fallback?: React.ReactNode
}

/**
 * Renders an HTML file (e.g. a captured reservation email) inside an iframe.
 *
 * Supabase Storage serves uploaded HTML as plain text, so the file is fetched
 * and re-wrapped as a text/html blob — otherwise the browser shows the raw
 * markup instead of the reservation.
 */
export function HtmlDocumentFrame({ url, title, className, fallback }: HtmlDocumentFrameProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let created: string | null = null
    setBlobUrl(null)
    setFailed(false)
    fetchHtmlAsBlobUrl(url)
      .then((objectUrl) => {
        created = objectUrl
        if (cancelled) URL.revokeObjectURL(objectUrl)
        else setBlobUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [url])

  if (failed) {
    return (
      <>
        {fallback ?? (
          <div className="flex h-full w-full items-center justify-center bg-surface-primary">
            <p className="text-sm text-red-400">שגיאה בטעינת המסמך</p>
          </div>
        )}
      </>
    )
  }

  if (!blobUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
      </div>
    )
  }

  return (
    <iframe
      src={blobUrl}
      title={title}
      className={cn('w-full h-full border-0 bg-white', className)}
      sandbox="allow-same-origin"
    />
  )
}
