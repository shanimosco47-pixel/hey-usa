import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/ui/motion'
import {
  Camera,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Filter,
  Grid3X3,
  LayoutList,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { FAMILY_MEMBERS_LIST, getFamilyMember } from '@/constants'
import { useAppData } from '@/contexts/AppDataContext'
import type { Photo, FamilyMemberId } from '@/lib/types'
import { isSampleData } from '@/lib/sampleData'
import { EmptyState } from '@/components/shared/EmptyState'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { PhotoCapture } from './components/PhotoCapture'

export default function PhotosPage() {
  const { photos, updatePhoto, deletePhoto } = useAppData()
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [filterMember, setFilterMember] = useState<FamilyMemberId | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const deleteSelected = () => {
    selectedIds.forEach((id) => deletePhoto(id))
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const cancelSelection = () => {
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  const filtered = useMemo(() => {
    let result = photos
    if (filterFavorites) result = result.filter((p) => p.is_favorite)
    if (filterMember !== 'all') result = result.filter((p) => p.taken_by === filterMember)
    return result
  }, [photos, filterFavorites, filterMember])

  function toggleFavorite(id: string) {
    const photo = photos.find((p) => p.id === id)
    if (!photo) return
    updatePhoto(id, { is_favorite: !photo.is_favorite })
    if (selectedPhoto?.id === id) {
      setSelectedPhoto((prev) => (prev ? { ...prev, is_favorite: !prev.is_favorite } : null))
    }
  }

  function navigatePhoto(direction: 'prev' | 'next') {
    if (!selectedPhoto) return
    const idx = filtered.findIndex((p) => p.id === selectedPhoto.id)
    const newIdx =
      direction === 'next'
        ? (idx + 1) % filtered.length
        : (idx - 1 + filtered.length) % filtered.length
    setSelectedPhoto(filtered[newIdx])
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Lightbox
  if (selectedPhoto) {
    const photographer = selectedPhoto.taken_by ? getFamilyMember(selectedPhoto.taken_by) : null
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="rounded-full bg-white/10 p-2 text-white"
            aria-label="סגירה"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                deletePhoto(selectedPhoto.id)
                setSelectedPhoto(null)
              }}
              className="rounded-full p-2 text-white/50 hover:text-ios-red transition-colors"
              aria-label="מחק תמונה"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => toggleFavorite(selectedPhoto.id)}
              className={cn(
                'rounded-full p-2',
                selectedPhoto.is_favorite ? 'text-ios-red' : 'text-white/50',
              )}
              aria-label={selectedPhoto.is_favorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
            >
              <Heart className={cn('h-5 w-5', selectedPhoto.is_favorite && 'fill-current')} />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 relative">
          <button
            onClick={() => navigatePhoto('next')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
            aria-label="תמונה הבאה"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || ''}
            className="max-h-[70vh] max-w-full rounded-lg object-contain"
            loading="lazy"
          />
          <button
            onClick={() => navigatePhoto('prev')}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white"
            aria-label="תמונה קודמת"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 text-center text-white">
          {selectedPhoto.caption && (
            <p className="text-base font-medium">{selectedPhoto.caption}</p>
          )}
          <div className="mt-2 flex items-center justify-center gap-4 text-sm text-white/60">
            {photographer && selectedPhoto.taken_by && (
              <span className="inline-flex items-center gap-1">
                <FamilyAvatar memberId={selectedPhoto.taken_by} size="xs" /> {photographer.name}
              </span>
            )}
            {selectedPhoto.location && (
              <span>
                <MapPin className="ml-0.5 inline h-3.5 w-3.5" />
                {selectedPhoto.location}
              </span>
            )}
            {selectedPhoto.taken_at && (
              <span>
                <Calendar className="ml-0.5 inline h-3.5 w-3.5" />
                {formatDate(selectedPhoto.taken_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 max-w-6xl mx-auto">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h2 className="text-2xl font-bold text-apple-primary">
          <Camera className="ml-2 inline h-6 w-6" />
          תמונות
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="rounded-apple-lg glass p-2 text-apple-secondary"
            aria-label={viewMode === 'grid' ? 'תצוגת רשימה' : 'תצוגת רשת'}
          >
            {viewMode === 'grid' ? (
              <LayoutList className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={cn(
              'rounded-apple-lg p-2',
              filterFavorites ? 'bg-ios-red/10 text-ios-red' : 'glass text-apple-secondary',
            )}
            aria-label={filterFavorites ? 'הצג הכל' : 'סנן מועדפים'}
          >
            <Heart className={cn('h-4 w-4', filterFavorites && 'fill-current')} />
          </button>
          <button
            onClick={() => setSelectMode(!selectMode)}
            className={cn(
              'rounded-apple px-3 py-1.5 text-xs font-medium',
              selectMode ? 'bg-ios-blue text-white' : 'glass text-apple-secondary',
            )}
          >
            בחירה
          </button>
        </div>
      </motion.div>

      {selectMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-apple-lg glass px-4 py-3 shadow-glass"
        >
          <span className="text-sm font-medium text-apple-primary">{selectedIds.size} נבחרו</span>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelSelection}
              className="rounded-apple px-3 py-1.5 text-xs font-medium glass text-apple-secondary"
            >
              ביטול
            </button>
            <button
              onClick={deleteSelected}
              disabled={selectedIds.size === 0}
              className={cn(
                'rounded-apple px-3 py-1.5 text-xs font-medium flex items-center gap-1',
                selectedIds.size > 0
                  ? 'bg-ios-red text-white'
                  : 'glass text-apple-secondary opacity-40',
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              מחק
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex gap-3">
        <div className="rounded-apple-lg glass px-3 py-2 text-center shadow-glass">
          <p className="text-lg font-bold text-apple-primary">{photos.length}</p>
          <p className="text-xs text-apple-secondary">תמונות</p>
        </div>
        <div className="rounded-apple-lg glass px-3 py-2 text-center shadow-glass">
          <p className="text-lg font-bold text-ios-red">
            {photos.filter((p) => p.is_favorite).length}
          </p>
          <p className="text-xs text-apple-secondary">מועדפות</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-apple-secondary" />
        <button
          onClick={() => setFilterMember('all')}
          className={cn(
            'shrink-0 rounded-full px-3 py-2 min-h-[44px] text-xs font-medium flex items-center',
            filterMember === 'all' ? 'bg-apple-primary text-white' : 'glass text-apple-secondary',
          )}
        >
          כולם
        </button>
        {FAMILY_MEMBERS_LIST.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilterMember(m.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-2 min-h-[44px] text-xs font-medium flex items-center',
              filterMember === m.id ? 'bg-apple-primary text-white' : 'glass text-apple-secondary',
            )}
          >
            <FamilyAvatar memberId={m.id} size="xs" className="inline-flex" /> {m.name}
          </button>
        ))}
      </div>

      <div className="px-0 mb-4">
        <PhotoCapture />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Camera} title="אין תמונות" description="הוסיפו תמונות מהטיול" />
      ) : viewMode === 'grid' ? (
        <StaggerContainer className="grid grid-cols-3 gap-1.5">
          {filtered.map((photo) => (
            <StaggerItem key={photo.id}>
              <button
                onClick={() => (selectMode ? toggleSelect(photo.id) : setSelectedPhoto(photo))}
                className={cn(
                  'group relative aspect-square w-full overflow-hidden rounded-apple-lg bg-black/[0.04]',
                  isSampleData(photo.id) && 'ring-1 ring-dashed ring-ios-teal/30',
                  selectMode && selectedIds.has(photo.id) && 'ring-2 ring-ios-blue',
                )}
              >
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.caption || ''}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                {photo.is_favorite && !selectMode && (
                  <Heart className="absolute top-1.5 left-1.5 h-4 w-4 fill-ios-red text-ios-red drop-shadow" />
                )}
                {isSampleData(photo.id) && !selectMode && (
                  <span className="absolute bottom-1 right-1 text-xs bg-black/50 rounded-full px-1.5 py-0.5 text-white">
                    🤖
                  </span>
                )}
                {selectMode && (
                  <div
                    className={cn(
                      'absolute top-1.5 right-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      selectedIds.has(photo.id)
                        ? 'bg-ios-blue border-ios-blue'
                        : 'bg-black/30 border-white/80',
                    )}
                  >
                    {selectedIds.has(photo.id) && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <StaggerContainer className="space-y-2">
          {filtered.map((photo) => {
            const photographer = photo.taken_by ? getFamilyMember(photo.taken_by) : null
            return (
              <StaggerItem key={photo.id}>
                <button
                  onClick={() => (selectMode ? toggleSelect(photo.id) : setSelectedPhoto(photo))}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-apple-lg glass p-2 text-right shadow-glass',
                    selectMode && selectedIds.has(photo.id) && 'ring-2 ring-ios-blue',
                  )}
                >
                  <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.caption || ''}
                    className="h-16 w-16 shrink-0 rounded-apple-lg object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-apple-primary truncate">
                      {photo.caption || 'ללא כיתוב'}
                    </p>
                    <p className="text-xs text-apple-secondary">
                      {photographer && photo.taken_by && (
                        <FamilyAvatar
                          memberId={photo.taken_by}
                          size="xs"
                          className="inline-flex align-middle"
                        />
                      )}
                      {photo.location && <span>{photo.location} · </span>}
                      {photo.taken_at && formatDate(photo.taken_at)}
                    </p>
                  </div>
                  {selectMode ? (
                    <div
                      className={cn(
                        'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center',
                        selectedIds.has(photo.id)
                          ? 'bg-ios-blue border-ios-blue'
                          : 'border-apple-secondary/40',
                      )}
                    >
                      {selectedIds.has(photo.id) && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  ) : (
                    photo.is_favorite && (
                      <Heart className="h-4 w-4 shrink-0 fill-ios-red text-ios-red" />
                    )
                  )}
                </button>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      )}
    </div>
  )
}
