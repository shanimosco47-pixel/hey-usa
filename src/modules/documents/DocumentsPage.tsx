import { useState, useCallback } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { FileText, Plus, Search, LayoutGrid, List, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/cn'
import { DOCUMENT_CATEGORIES } from '@/lib/constants'
import { useDocuments } from './hooks/useDocuments'
import { DocumentCard } from './components/DocumentCard'
import { UploadDialog } from './components/UploadDialog'
import { DocumentViewer } from './components/DocumentViewer'
import type { Document } from '@/types'

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'הכל' },
  ...Object.entries(DOCUMENT_CATEGORIES).map(([key, val]) => ({
    value: key,
    label: val.label,
  })),
]

export default function DocumentsPage() {
  const {
    documents,
    allDocuments,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    addDocument,
  } = useDocuments()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

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
    <div className="min-h-full px-4 pb-24 pt-4 sm:px-6" dir="rtl">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta/10">
            <FileText className="h-5 w-5 text-terracotta" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brown">מסמכים</h1>
            <p className="text-xs text-brown-light">
              {allDocuments.length} מסמכים
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-terracotta px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-terracotta-light"
        >
          <Plus className="h-4 w-4" />
          העלה מסמך
        </button>
      </div>

      {/* Search + view toggle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown-light" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש מסמכים..."
            className="w-full rounded-xl border border-sand-dark bg-white/60 py-2.5 pe-3 ps-9 text-sm text-brown placeholder:text-brown-light/50 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
          />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-sand-dark">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 transition-colors',
              viewMode === 'grid'
                ? 'bg-terracotta text-white'
                : 'bg-white/60 text-brown-light hover:bg-sand',
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
                ? 'bg-terracotta text-white'
                : 'bg-white/60 text-brown-light hover:bg-sand',
            )}
            aria-label="תצוגת רשימה"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <Tabs.Root
        value={activeCategory}
        onValueChange={setActiveCategory}
        dir="rtl"
      >
        <Tabs.List className="mb-5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                'data-[state=active]:bg-terracotta data-[state=active]:text-white data-[state=active]:shadow-sm',
                'data-[state=inactive]:bg-white/60 data-[state=inactive]:text-brown-light data-[state=inactive]:hover:bg-sand',
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {/* Documents grid/list */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sand-dark/50">
            <FolderOpen className="h-8 w-8 text-brown-light/50" />
          </div>
          <p className="mt-4 text-sm font-medium text-brown-light">
            {searchQuery ? 'לא נמצאו מסמכים התואמים לחיפוש' : 'אין מסמכים בקטגוריה זו'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
            }}
            className="mt-2 text-sm text-terracotta hover:underline"
          >
            הצג את כל המסמכים
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} onClick={handleCardClick} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <ListRow key={doc.id} document={doc} onClick={handleCardClick} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
      />
      <DocumentViewer
        document={viewerDoc}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
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
        'flex items-center gap-3 rounded-xl border bg-white/60 px-4 py-3 text-right transition-all hover:bg-white/80 hover:shadow-sm',
        isExpired ? 'border-red-300' : 'border-sand-dark',
      )}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand">
        {doc.file_type?.includes('pdf') ? (
          <FileText className="h-5 w-5 text-red-400" />
        ) : doc.file_type?.includes('image') ? (
          <FileText className="h-5 w-5 text-sky/70" />
        ) : (
          <FileText className="h-5 w-5 text-brown-light" />
        )}
      </div>

      {/* Title + category */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brown">{doc.title}</p>
        <div className="flex items-center gap-2 text-xs text-brown-light">
          <span>{categoryLabel}</span>
          {doc.file_size ? (
            <>
              <span className="text-sand-dark">|</span>
              <span>{formatSize(doc.file_size)}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Expiry badge */}
      {(isExpired || isExpiringSoon) && (
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isExpired ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900',
          )}
        >
          {isExpired ? 'פג תוקף' : 'תוקף מתקרב'}
        </span>
      )}
    </button>
  )
}
