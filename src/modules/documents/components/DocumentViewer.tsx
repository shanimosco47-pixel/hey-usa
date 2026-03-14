import * as Dialog from '@radix-ui/react-dialog'
import { X, Download, FileText, Image, File, ExternalLink, Calendar, Tag, User, StickyNote, HardDrive, AlertTriangle, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import { DOCUMENT_CATEGORIES } from '@/lib/constants'
import { getLocationById } from '@/data/locations'
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

function FilePreview({ doc }: { doc: Document }) {
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

  if (doc.file_type?.includes('pdf')) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-red-50">
        <div className="flex flex-col items-center gap-3">
          <FileText className="h-16 w-16 text-red-300" />
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            <ExternalLink className="h-4 w-4" />
            פתח PDF
          </button>
        </div>
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
        <p className={cn('text-sm text-apple-primary', valueClassName)}>{value}</p>
      </div>
    </div>
  )
}

export function DocumentViewer({ document: doc, open, onOpenChange }: DocumentViewerProps) {
  if (!doc) return null

  const categoryLabel = DOCUMENT_CATEGORIES[doc.category]?.label ?? doc.category
  const member = doc.family_member_id ? FAMILY_MEMBERS[doc.family_member_id] : null
  const expired = isExpired(doc.expiry_date)
  const expiringSoon = !expired && isExpiringWithin6Months(doc.expiry_date)
  const location = doc.locationId ? getLocationById(doc.locationId) : null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-apple-lg bg-surface-primary shadow-2xl sm:inset-auto sm:start-[50%] sm:top-[50%] sm:h-[85vh] sm:w-full sm:max-w-3xl sm:translate-x-[50%] sm:-translate-y-[50%] rtl:sm:-translate-x-[50%]"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3">
            <Dialog.Title className="line-clamp-1 text-base font-bold text-apple-primary">
              {doc.title}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-ios-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ios-blue/80"
              >
                <Download className="h-4 w-4" />
                הורד
              </button>
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
              <FilePreview doc={doc} />
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

                <DetailRow
                  icon={HardDrive}
                  label="גודל קובץ"
                  value={formatFileSize(doc.file_size)}
                />

                <DetailRow
                  icon={Calendar}
                  label="תאריך העלאה"
                  value={new Date(doc.created_at).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                />

                {doc.expiry_date && (
                  <div className="flex items-start gap-3">
                    {(expired || expiringSoon) ? (
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

                {doc.notes && (
                  <DetailRow icon={StickyNote} label="הערות" value={doc.notes} />
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
