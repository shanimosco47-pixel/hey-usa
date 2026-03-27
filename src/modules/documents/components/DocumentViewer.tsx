import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  Download,
  FileText,
  Image,
  File,
  ExternalLink,
  Calendar,
  Tag,
  User,
  StickyNote,
  HardDrive,
  AlertTriangle,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS, DOCUMENT_CATEGORIES } from '@/constants'
import { getLocationById } from '@/data/locations'
import { isSampleData } from '@/lib/sampleData'
import type { Document } from '@/types'

interface DocumentViewerProps {
  document: Document | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'לא ידוע'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function isExpiringWithin6Months(dateStr?: string): boolean {
  if (!dateStr) return false
  const expiry = new Date(dateStr)
  const now = new Date()
  const sixMonths = new Date()
  sixMonths.setMonth(sixMonths.getMonth() + 6)
  return expiry > now && expiry <= sixMonths
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-sm text-white shadow-lg">
        <span>📄</span>
        <span>{message}</span>
        <button type="button" onClick={onClose} className="mr-2 text-white/60 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/** Whether the file_url points to an actual downloadable file (external URL or data URI) */
function hasRealFile(doc: Document): boolean {
  if (!doc.file_url) return false
  return doc.file_url.startsWith('http') || doc.file_url.startsWith('data:')
}

/** Fetches HTML from Supabase (served as text/plain) and renders via blob URL so the browser treats it as HTML */
function HtmlPreview({ url, title, notes, onOpen }: { url: string; title: string; notes?: string; onOpen: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [hasUsefulContent, setHasUsefulContent] = useState(true)

  useEffect(() => {
    let revoked = false
    fetch(url)
      .then((r) => r.text())
      .then((html) => {
        if (revoked) return

        // Check if the HTML has meaningful text content (not just images/logos)
        const textContent = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        // If the text content is very short (< 50 chars after stripping tags),
        // it's likely just a logo page with no real reservation data
        if (textContent.length < 50) {
          setHasUsefulContent(false)
        }

        const blob = new Blob([html], { type: 'text/html' })
        setBlobUrl(URL.createObjectURL(blob))
      })
      .catch(() => setError(true))
    return () => {
      revoked = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  if (error) {
    // If HTML failed to load but we have notes, show them instead of an error
    if (notes) {
      return (
        <div className="w-full rounded-xl bg-amber-50/80 p-5 overflow-y-auto max-h-[50vh]" dir="rtl">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-5 w-5 text-amber-600 shrink-0" />
            <h4 className="text-sm font-bold text-apple-primary">פרטי המסמך</h4>
          </div>
          <p className="text-sm text-apple-primary whitespace-pre-wrap leading-relaxed">{notes}</p>
          <p className="mt-4 text-xs text-red-400 font-medium">⚠️ לא ניתן לטעון את הקובץ המצורף</p>
        </div>
      )
    }
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-red-50">
        <p className="text-sm text-red-400">שגיאה בטעינת המסמך</p>
      </div>
    )
  }

  if (!blobUrl) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-surface-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ios-blue border-t-transparent" />
      </div>
    )
  }

  // HTML has no useful text (just logos/images) — show notes as primary content
  if (!hasUsefulContent && notes) {
    return (
      <div className="w-full space-y-3">
        <div className="w-full rounded-xl bg-amber-50/80 p-5 overflow-y-auto max-h-[50vh]" dir="rtl">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-5 w-5 text-amber-600 shrink-0" />
            <h4 className="text-sm font-bold text-apple-primary">פרטי המסמך</h4>
          </div>
          <p className="text-sm text-apple-primary whitespace-pre-wrap leading-relaxed">{notes}</p>
          <p className="mt-4 text-xs text-amber-600 font-medium">
            📎 הקובץ המצורף מכיל בעיקר תמונות — הפרטים החשובים מוצגים למעלה
          </p>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-2 rounded-lg bg-black/[0.04] px-4 py-2 text-sm font-medium text-apple-secondary transition-colors hover:bg-black/[0.08]"
          >
            <ExternalLink className="h-4 w-4" />
            פתח קובץ מצורף בחלון חדש
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <div className="w-full rounded-xl bg-white overflow-hidden" style={{ minHeight: '40vh' }}>
        <iframe
          src={blobUrl}
          title={title}
          className="w-full border-0"
          style={{ height: '55vh' }}
          sandbox="allow-same-origin"
        />
        <div className="flex justify-center py-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-2 rounded-lg bg-ios-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ios-blue/80"
          >
            <ExternalLink className="h-4 w-4" />
            פתח בחלון חדש
          </button>
        </div>
      </div>
      {/* Show notes below the HTML preview when they exist */}
      {notes && (
        <div className="w-full rounded-xl bg-amber-50/80 p-5 overflow-y-auto max-h-[30vh]" dir="rtl">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-5 w-5 text-amber-600 shrink-0" />
            <h4 className="text-sm font-bold text-apple-primary">פרטי המסמך</h4>
          </div>
          <p className="text-sm text-apple-primary whitespace-pre-wrap leading-relaxed">{notes}</p>
        </div>
      )}
    </div>
  )
}

/** Notes block used as primary content when the attached file isn't useful */
function NotesBlock({ doc, subtitle }: { doc: Document; subtitle?: string }) {
  return (
    <div className="w-full rounded-xl bg-amber-50/80 p-5 overflow-y-auto max-h-[50vh]" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="h-5 w-5 text-amber-600 shrink-0" />
        <h4 className="text-sm font-bold text-apple-primary">פרטי המסמך</h4>
      </div>
      <p className="text-sm text-apple-primary whitespace-pre-wrap leading-relaxed">
        {doc.notes}
      </p>
      {subtitle && (
        <p className="mt-4 text-xs text-amber-600 font-medium">{subtitle}</p>
      )}
    </div>
  )
}

/**
 * Detect whether a file is likely just a logo / branding image rather than
 * useful document content.  Heuristic: images under 100 KB are almost always
 * logos, icons, or brand headers — real confirmation screenshots or scanned
 * documents are typically much larger.
 */
function isLikelyLogo(doc: Document): boolean {
  if (!doc.file_type?.includes('image')) return false
  const MAX_LOGO_BYTES = 100 * 1024 // 100 KB
  return (doc.file_size ?? 0) < MAX_LOGO_BYTES
}

function FilePreview({ doc, onOpen }: { doc: Document; onOpen: () => void }) {
  const realFile = hasRealFile(doc)

  // No real file — show notes/booking details as the main content
  if (!realFile && doc.notes) {
    return (
      <NotesBlock
        doc={doc}
        subtitle="📎 הקובץ טרם הועלה — ניתן להעלות דרך כפתור ״העלה מסמך״"
      />
    )
  }

  // Image file exists, but it's probably just a logo/header — prioritise notes
  if (doc.file_type?.includes('image') && realFile && isLikelyLogo(doc) && doc.notes) {
    return (
      <div className="w-full space-y-3">
        <NotesBlock
          doc={doc}
          subtitle="📎 הקובץ המצורף הוא לוגו/כותרת בלבד — הפרטים החשובים מוצגים למעלה"
        />
        {/* Show the image as a small reference thumbnail */}
        <div className="w-full rounded-xl bg-sky-50/50 p-3 flex items-center gap-3">
          <img
            src={doc.file_url!}
            alt={doc.title}
            className="h-10 w-auto object-contain rounded opacity-60"
            loading="lazy"
          />
          <span className="text-xs text-apple-secondary">קובץ מצורף ({formatFileSize(doc.file_size)})</span>
        </div>
      </div>
    )
  }

  if (doc.file_type?.includes('image') && realFile) {
    return (
      <div className="w-full space-y-3">
        <div className="w-full rounded-xl bg-sky-50 overflow-hidden">
          <img
            src={doc.file_url!}
            alt={doc.title}
            className="w-full h-auto object-contain max-h-[60vh]"
            loading="lazy"
          />
        </div>
        {/* If we have notes, show them below the image too */}
        {doc.notes && (
          <NotesBlock doc={doc} />
        )}
      </div>
    )
  }

  if (doc.file_type?.includes('image')) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-sky-50">
        <div className="flex flex-col items-center gap-3">
          <Image className="h-16 w-16 text-ios-blue/50" />
          <p className="text-sm text-apple-secondary">תצוגה מקדימה לא זמינה</p>
        </div>
      </div>
    )
  }

  if (doc.file_type?.includes('html') && realFile) {
    return <HtmlPreview url={doc.file_url!} title={doc.title} notes={doc.notes} onOpen={onOpen} />
  }

  if (doc.file_type?.includes('pdf')) {
    return (
      <div className="w-full space-y-3">
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-red-50">
          <div className="flex flex-col items-center gap-3">
            <FileText className="h-16 w-16 text-red-300" />
            <button
              type="button"
              onClick={onOpen}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              <ExternalLink className="h-4 w-4" />
              פתח PDF
            </button>
          </div>
        </div>
        {doc.notes && <NotesBlock doc={doc} />}
      </div>
    )
  }

  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-surface-primary">
      <File className="h-16 w-16 text-apple-tertiary" />
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-apple-secondary" />
      <div className="min-w-0">
        <p className="text-xs text-apple-secondary">{label}</p>
        <p className={cn('text-sm text-apple-primary break-words', valueClassName)}>{value}</p>
      </div>
    </div>
  )
}

export function DocumentViewer({ document: doc, open, onOpenChange }: DocumentViewerProps) {
  const [toast, setToast] = useState<string | null>(null)

  if (!doc) return null

  const categoryLabel = DOCUMENT_CATEGORIES[doc.category]?.label ?? doc.category
  const member = doc.family_member_id ? FAMILY_MEMBERS[doc.family_member_id] : null
  const expired = isExpired(doc.expiry_date)
  const expiringSoon = !expired && isExpiringWithin6Months(doc.expiry_date)
  const location = doc.locationId ? getLocationById(doc.locationId) : null
  const sample = isSampleData(doc.id)

  const handleOpenFile = async () => {
    if (sample) {
      setToast('זוהי דוגמה מאת מוטי — יש להעלות מסמך אמיתי')
      setTimeout(() => setToast(null), 3500)
      return
    }
    if (!doc.file_url) {
      setToast('הקובץ טרם הועלה')
      setTimeout(() => setToast(null), 3500)
      return
    }
    // Local placeholder paths (e.g. /documents/file.pdf) don't have actual files —
    // only external URLs (https://) or data: URIs are real uploaded files
    if (doc.file_url.startsWith('/')) {
      setToast('הקובץ טרם הועלה — הפרטים מופיעים בהערות')
      setTimeout(() => setToast(null), 3500)
      return
    }
    // Supabase serves HTML as text/plain for security — fetch and re-wrap as
    // a proper HTML blob so the browser renders it instead of showing raw code
    if (doc.file_type?.includes('html') && doc.file_url.startsWith('http')) {
      try {
        const res = await fetch(doc.file_url)
        const html = await res.text()
        const blob = new Blob([html], { type: 'text/html' })
        window.open(URL.createObjectURL(blob), '_blank', 'noopener')
        return
      } catch {
        // Fall through to direct open
      }
    }
    window.open(doc.file_url, '_blank', 'noopener')
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-apple-lg bg-surface-primary shadow-2xl sm:inset-auto sm:start-[50%] sm:top-[50%] sm:h-[85vh] sm:w-full sm:max-w-3xl sm:-translate-x-[50%] sm:-translate-y-[50%] rtl:sm:translate-x-[50%]"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3">
            <Dialog.Title className="line-clamp-1 text-base font-bold text-apple-primary">
              {doc.title}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {hasRealFile(doc) && (
                <button
                  type="button"
                  onClick={handleOpenFile}
                  className="flex items-center gap-1.5 rounded-lg bg-ios-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ios-blue/80"
                >
                  <Download className="h-4 w-4" />
                  הורד
                </button>
              )}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-apple-secondary transition-colors hover:bg-black/[0.04]"
                  aria-label="סגור"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col overflow-y-auto sm:flex-row">
            {/* Preview */}
            <div className="flex items-center justify-center bg-white/30 p-6 sm:flex-1">
              <FilePreview doc={doc} onOpen={handleOpenFile} />
            </div>

            {/* Details sidebar */}
            <div className="w-full shrink-0 border-t border-black/[0.06] bg-white/40 p-5 sm:w-72 sm:border-t-0 sm:border-r">
              <h4 className="mb-4 text-sm font-semibold text-apple-primary">פרטי מסמך</h4>
              <div className="space-y-4">
                <DetailRow icon={Tag} label="קטגוריה" value={categoryLabel} />

                {location && (
                  <DetailRow
                    icon={MapPin}
                    label="מיקום"
                    value={`${location.emoji} ${location.nameHe}`}
                  />
                )}

                {member && (
                  <DetailRow
                    icon={User}
                    label="בן משפחה"
                    value={`${member.emoji} ${member.name}`}
                  />
                )}

                {hasRealFile(doc) && (doc.file_size ?? 0) > 0 && (
                  <DetailRow
                    icon={HardDrive}
                    label="גודל קובץ"
                    value={formatFileSize(doc.file_size)}
                  />
                )}

                {hasRealFile(doc) && (
                  <DetailRow
                    icon={Calendar}
                    label="תאריך העלאה"
                    value={new Date(doc.created_at).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  />
                )}

                {doc.expiry_date && (
                  <div className="flex items-start gap-3">
                    {expired || expiringSoon ? (
                      <AlertTriangle
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          expired ? 'text-red-500' : 'text-amber-500',
                        )}
                      />
                    ) : (
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-apple-secondary" />
                    )}
                    <div>
                      <p className="text-xs text-apple-secondary">תוקף</p>
                      <p
                        className={cn(
                          'text-sm',
                          expired
                            ? 'font-semibold text-red-500'
                            : expiringSoon
                              ? 'font-medium text-amber-600'
                              : 'text-apple-primary',
                        )}
                      >
                        {new Date(doc.expiry_date).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {expired && ' (פג תוקף)'}
                        {expiringSoon && ' (בקרוב)'}
                      </p>
                    </div>
                  </div>
                )}

                {doc.notes && hasRealFile(doc) && !isLikelyLogo(doc) && (
                  <DetailRow icon={StickyNote} label="הערות" value={doc.notes} />
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Dialog.Root>
  )
}
