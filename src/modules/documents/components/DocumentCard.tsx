import { FileText, Image, File, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS } from '@/constants'
import { DOCUMENT_CATEGORIES } from '@/lib/constants'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import type { Document, FamilyMemberId } from '@/types'

interface DocumentCardProps {
  document: Document
  onClick: (doc: Document) => void
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isExpiringWithin6Months(dateStr?: string): boolean {
  if (!dateStr) return false
  const expiry = new Date(dateStr)
  const now = new Date()
  const sixMonthsFromNow = new Date()
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
  return expiry > now && expiry <= sixMonthsFromNow
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function FileIcon({ fileType }: { fileType?: string }) {
  if (fileType?.includes('pdf')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-red-50">
        <FileText className="h-10 w-10 text-red-400" />
      </div>
    )
  }
  if (fileType?.includes('image')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-sky-50">
        <Image className="h-10 w-10 text-sky/70" />
      </div>
    )
  }
  return (
    <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-sand">
      <File className="h-10 w-10 text-brown-light" />
    </div>
  )
}

const categoryColors: Record<string, string> = {
  passport: 'bg-sky/15 text-sky',
  visa: 'bg-[#6c5ce7]/15 text-[#6c5ce7]',
  insurance: 'bg-sage/15 text-sage',
  flights: 'bg-sky/15 text-sky',
  accommodation: 'bg-gold/15 text-gold-dark',
  car_rental: 'bg-terracotta/15 text-terracotta',
  attractions: 'bg-sage/15 text-sage',
  medical: 'bg-red-100 text-red-600',
  other: 'bg-brown/10 text-brown-light',
}

export function DocumentCard({ document: doc, onClick }: DocumentCardProps) {
  const categoryLabel = DOCUMENT_CATEGORIES[doc.category]?.label ?? doc.category
  const expired = isExpired(doc.expiry_date)
  const expiringSoon = !expired && isExpiringWithin6Months(doc.expiry_date)
  const memberName = doc.family_member_id
    ? FAMILY_MEMBERS[doc.family_member_id]?.name
    : null

  return (
    <button
      type="button"
      onClick={() => onClick(doc)}
      className={cn(
        'group flex w-full flex-col overflow-hidden rounded-xl border text-right',
        'bg-white/60 shadow-sm transition-all hover:shadow-md hover:bg-white/80',
        'focus:outline-none focus:ring-2 focus:ring-sky/40',
        expired ? 'border-red-300' : 'border-sand-dark',
      )}
    >
      {/* Thumbnail / Icon area */}
      <div className="relative h-28 w-full shrink-0">
        <FileIcon fileType={doc.file_type} />
        {(expired || expiringSoon) && (
          <div
            className={cn(
              'absolute top-2 start-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              expired
                ? 'bg-red-500 text-white'
                : 'bg-amber-400 text-amber-900',
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            {expired ? 'פג תוקף' : 'תוקף מתקרב'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-brown leading-tight">
          {doc.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
              categoryColors[doc.category] ?? categoryColors.other,
            )}
          >
            {categoryLabel}
          </span>
          {doc.file_size && (
            <span className="text-[11px] text-brown-light">
              {formatFileSize(doc.file_size)}
            </span>
          )}
        </div>

        {/* Family member + expiry row */}
        <div className="mt-auto flex items-center justify-between pt-1">
          {doc.family_member_id ? (
            <div className="flex items-center gap-1.5">
              <FamilyAvatar memberId={doc.family_member_id as FamilyMemberId} size="sm" />
              <span className="text-xs text-brown-light">{memberName}</span>
            </div>
          ) : (
            <span className="text-xs text-brown-light/50">משפחתי</span>
          )}

          {doc.expiry_date && (
            <span
              className={cn(
                'text-[11px]',
                expired
                  ? 'font-semibold text-red-500'
                  : expiringSoon
                    ? 'font-medium text-amber-600'
                    : 'text-brown-light',
              )}
            >
              {new Date(doc.expiry_date).toLocaleDateString('he-IL')}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
