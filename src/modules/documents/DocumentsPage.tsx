import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/motion'
import * as Tabs from '@radix-ui/react-tabs'
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  List,
  FolderOpen,
  Calendar,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Paperclip,
  AlertTriangle,
  MapPin,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { DOCUMENT_CATEGORIES, TRIP_START_DATE, TRIP_END_DATE } from '@/constants'
import { useAppData } from '@/contexts/AppDataContext'
import { isSampleData } from '@/lib/sampleData'
import { getLocationById } from '@/data/locations'
import { DocumentCard } from './components/DocumentCard'
import { UploadDialog } from './components/UploadDialog'
import { DocumentViewer } from './components/DocumentViewer'
import { EmailScanButton } from './components/EmailScanButton'
import { EmailAccountSettings } from './components/EmailAccountSettings'
import { DocChecklist } from './components/DocChecklist'
import type { Document } from '@/types'

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'הכל' },
  ...Object.entries(DOCUMENT_CATEGORIES).map(([key, val]) => ({
    value: key,
    label: val.label,
  })),
]

export default function DocumentsPage() {
  const { documents: allDocuments, addDocument, addExpense } = useAppData()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'upload' | 'visit'>('upload')

  const documents = useMemo(() => {
    // Filter out flight documents with dates outside the trip window
    const FLIGHT_CATS = ['flights', 'flight_booking']
    const tripWindowEnd = new Date(TRIP_END_DATE)
    tripWindowEnd.setDate(tripWindowEnd.getDate() + 5)
    const tripWindowEndStr = tripWindowEnd.toISOString().slice(0, 10)
    let result = allDocuments.filter((d) => {
      if (!FLIGHT_CATS.includes(d.category)) return true
      const dateStr = d.visit_date || d.expiry_date
      if (!dateStr) return true
      return dateStr >= TRIP_START_DATE && dateStr <= tripWindowEndStr
    })

    if (activeCategory !== 'all') {
      result = result.filter((d) => d.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q)) ||
          d.category.toLowerCase().includes(q),
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'visit') {
        const aDate = a.visit_date || ''
        const bDate = b.visit_date || ''
        // Documents without visit_date go to the end
        if (!aDate && bDate) return 1
        if (aDate && !bDate) return -1
        return aDate.localeCompare(bDate)
      }
      // Default: sort by upload/created date, newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [allDocuments, activeCategory, searchQuery, sortBy])

  const expiringDocs = useMemo(
    () =>
      allDocuments.filter((d) => {
        if (!d.expiry_date) return false
        return new Date(d.expiry_date) < new Date('2026-09-10')
      }),
    [allDocuments],
  )

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [searchParams] = useSearchParams()

  // Auto-open document from query param (e.g. ?doc=scan-123)
  useEffect(() => {
    const docId = searchParams.get('doc')
    if (docId && allDocuments.length > 0) {
      const target = allDocuments.find((d) => d.id === docId)
      if (target) {
        setViewerDoc(target)
        setViewerOpen(true)
      }
    }
  }, [searchParams, allDocuments])

  const handleCardClick = useCallback((doc: Document) => {
    setViewerDoc(doc)
    setViewerOpen(true)
  }, [])

  const handleUpload = useCallback(
    (doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => {
      addDocument(doc)
    },
    [addDocument],
  )

  return (
    <div
      className="min-h-full px-4 pb-24 pt-4 sm:px-6 overflow-x-hidden max-w-6xl mx-auto"
      dir="rtl"
    >
      {/* Header */}
      <motion.div
        className="mb-5 flex items-center justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-apple bg-ios-blue/10">
            <FileText className="h-5 w-5 text-ios-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-apple-primary">מסמכים</h2>
            <p className="text-xs text-apple-secondary">{allDocuments.length} מסמכים</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EmailScanButton />
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            העלה מסמך
          </Button>
        </div>
      </motion.div>

      {/* Search + view toggle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apple-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש מסמכים..."
            className="w-full rounded-apple-lg border border-black/[0.06] glass py-2.5 pe-3 ps-9 text-sm text-apple-primary placeholder:text-apple-secondary/50 focus:border-ios-blue focus:outline-none focus:ring-1 focus:ring-ios-blue/30"
          />
        </div>
        {/* Sort toggle */}
        <button
          type="button"
          onClick={() => setSortBy((s) => (s === 'upload' ? 'visit' : 'upload'))}
          className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] glass px-2.5 py-2 text-xs font-medium text-apple-secondary transition-colors hover:bg-black/[0.04]"
          title={sortBy === 'upload' ? 'ממוין לפי תאריך העלאה' : 'ממוין לפי תאריך ביקור'}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>{sortBy === 'upload' ? 'העלאה' : 'ביקור'}</span>
        </button>
        <div className="flex overflow-hidden rounded-lg border border-black/[0.06]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'grid'
                ? 'bg-ios-blue text-white'
                : 'glass text-apple-secondary hover:bg-black/[0.04]',
            )}
            aria-label="תצוגת רשת"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'list'
                ? 'bg-ios-blue text-white'
                : 'glass text-apple-secondary hover:bg-black/[0.04]',
            )}
            aria-label="תצוגת רשימה"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Email account settings */}
      <EmailAccountSettings />

      {/* Expiry warning banner */}
      {expiringDocs.length > 0 && (
        <div className="glass rounded-apple-lg p-3 border border-ios-orange/20 bg-ios-orange/5 flex items-center gap-2 mx-4 mb-3">
          <AlertTriangle className="h-5 w-5 text-ios-orange shrink-0" />
          <span className="text-body text-apple-primary">
            {expiringDocs.length} מסמכים עם תוקף שפג או יפוג לפני הטיול
          </span>
        </div>
      )}

      {/* Document completeness checklist */}
      <div className="px-4 mb-4">
        <DocChecklist />
      </div>

      {/* Category tabs */}
      <Tabs.Root value={activeCategory} onValueChange={setActiveCategory} dir="rtl">
        <Tabs.List className="mb-5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                'data-[state=active]:bg-ios-blue data-[state=active]:text-white data-[state=active]:shadow-sm',
                'data-[state=inactive]:glass data-[state=inactive]:text-apple-secondary data-[state=inactive]:hover:bg-black/[0.04]',
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {/* Documents grid/list */}
      {documents.length === 0 ? (
        allDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="אין מסמכים"
            description="העלו מסמכי נסיעה - דרכונים, ביטוח, הזמנות"
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-apple-lg bg-black/[0.04]">
              <FolderOpen className="h-8 w-8 text-apple-secondary/50" />
            </div>
            <p className="mt-4 text-sm font-medium text-apple-secondary">
              {searchQuery ? 'לא נמצאו מסמכים התואמים לחיפוש' : 'אין מסמכים בקטגוריה זו'}
            </p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('all')
              }}
            >
              הצג את כל המסמכים
            </Button>
          </div>
        )
      ) : viewMode === 'grid' ? (
        <StaggerContainer className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {documents.map((doc) => (
            <StaggerItem key={doc.id}>
              <DocumentCard document={doc} onClick={handleCardClick} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <StaggerContainer className="flex flex-col gap-2">
          {documents.map((doc) => (
            <StaggerItem key={doc.id}>
              <ListRow document={doc} onClick={handleCardClick} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Dialogs */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
        onAddExpense={addExpense}
      />
      <DocumentViewer document={viewerDoc} open={viewerOpen} onOpenChange={setViewerOpen} />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

function hasRealFile(doc: Document): boolean {
  if (!doc.file_url) return false
  return doc.file_url.startsWith('http') || doc.file_url.startsWith('data:')
}

const STATUS_CONFIG = {
  reserved: { label: 'מאושר', icon: CheckCircle2, className: 'bg-ios-green/15 text-ios-green' },
  waitlist: { label: 'המתנה', icon: Clock, className: 'bg-amber-100 text-amber-700' },
  both: { label: 'חלקי', icon: Clock, className: 'bg-ios-blue/15 text-ios-blue' },
} as const

function StatusBadge({ status }: { status: 'reserved' | 'waitlist' | 'both' }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <span
      className={cn(
        'shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold',
        config.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// ── Compact list-view row ────────────────────────────────────────────

function ListRow({
  document: doc,
  onClick,
}: {
  document: Document
  onClick: (doc: Document) => void
}) {
  const categoryLabel = DOCUMENT_CATEGORIES[doc.category]?.label ?? doc.category
  const location = doc.locationId ? getLocationById(doc.locationId) : null

  const isExpired = doc.expiry_date ? new Date(doc.expiry_date) < new Date() : false
  const isExpiringSoon = (() => {
    if (!doc.expiry_date || isExpired) return false
    const expiry = new Date(doc.expiry_date)
    const sixMonths = new Date()
    sixMonths.setMonth(sixMonths.getMonth() + 6)
    return expiry <= sixMonths
  })()

  function formatSize(bytes?: number) {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <button
      type="button"
      onClick={() => onClick(doc)}
      className={cn(
        'flex items-center gap-3 rounded-apple-lg border glass px-4 py-3 text-right transition-all hover:bg-white/80 hover:shadow-glass-hover',
        isExpired ? 'border-red-300' : 'border-black/[0.06]',
      )}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04]">
        {doc.file_type?.includes('pdf') ? (
          <FileText className="h-5 w-5 text-red-400" />
        ) : doc.file_type?.includes('image') ? (
          <FileText className="h-5 w-5 text-ios-teal/70" />
        ) : (
          <FileText className="h-5 w-5 text-apple-secondary" />
        )}
      </div>

      {/* Title + category */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-apple-primary">{doc.title}</p>
        <div className="flex items-center gap-2 text-xs text-apple-secondary">
          <span>{categoryLabel}</span>
          {location && (
            <>
              <span className="text-apple-tertiary">|</span>
              <Link
                to={`/locations/${location.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-ios-blue hover:underline"
              >
                <MapPin className="h-2.5 w-2.5" />
                {location.emoji} {location.nameHe}
              </Link>
            </>
          )}
          {doc.file_size ? (
            <>
              <span className="text-apple-tertiary">|</span>
              <span>{formatSize(doc.file_size)}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Status badge */}
      {doc.status && <StatusBadge status={doc.status} />}

      {/* File indicator */}
      {hasRealFile(doc) ? (
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-ios-green" />
      ) : (
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-apple-tertiary/40" />
      )}

      {/* Expiry badge */}
      {(isExpired || isExpiringSoon) && (
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold',
            isExpired ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900',
          )}
        >
          {isExpired ? 'פג תוקף' : 'תוקף מתקרב'}
        </span>
      )}

      {/* Upload date column — hidden for sample data */}
      <div className="shrink-0 w-20 text-left">
        {!isSampleData(doc.id) && (
          <div className="flex items-center gap-1 text-caption text-apple-secondary">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(doc.created_at).toLocaleDateString('he-IL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
