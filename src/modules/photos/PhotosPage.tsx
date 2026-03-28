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
import { PhotoCapture } from './components/PhotoCapture'

export default function PhotosPage() {
  const { photos, updatePhoto, deletePhoto } = useAppData()
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [filterMember, setFilterMember] = useState<FamilyMemberId | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
              className="rounded-full p-2 text-white/50 hover:text-red-400 transition-colors"
              aria-label="מחק תמונה"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => toggleFavorite(selectedPhoto.id)}
              className={cn(
                'rounded-full p-2',
                selectedPhoto.is_favorite ? 'text-red-400' : 'text-white/50',
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
            {photographer && (
              <span>
                {photographer.avatar_emoji} {photographer.name}
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
    <div className="space-y-4 p-4">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h1 className="text-2xl font-bold text-apple-primary">
          <Camera className="ml-2 inline h-6 w-6" />
          תמונות
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="rounded-xl glass p-2 text-apple-secondary"
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
              'rounded-xl p-2',
              filterFavorites ? 'bg-red-50 text-red-400' : 'glass text-apple-secondary',
            )}
            aria-label={filterFavorites ? 'הצג הכל' : 'סנן מועדפים'}
          >
            <Heart className={cn('h-4 w-4', filterFavorites && 'fill-current')} />
          </button>
        </div>
      </motion.div>

      <div className="flex gap-3">
        <div className="rounded-xl glass px-3 py-2 text-center shadow-sm">
          <p className="text-lg font-bold text-apple-primary">{photos.length}</p>
          <p className="text-xs text-apple-secondary">תמונות</p>
        </div>
        <div className="rounded-xl glass px-3 py-2 text-center shadow-sm">
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
            'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium',
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
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium',
              filterMember === m.id ? 'bg-apple-primary text-white' : 'glass text-apple-secondary',
            )}
          >
            {m.avatar_emoji} {m.name}
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
                onClick={() => setSelectedPhoto(photo)}
                className={cn(
                  'group relative aspect-square w-full overflow-hidden rounded-xl bg-black/[0.04]',
                  isSampleData(photo.id) && 'ring-1 ring-dashed ring-ios-teal/30',
                )}
              >
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.caption || ''}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                {photo.is_favorite && (
                  <Heart className="absolute top-1.5 left-1.5 h-4 w-4 fill-red-400 text-red-400 drop-shadow" />
                )}
                {isSampleData(photo.id) && (
                  <span className="absolute bottom-1 right-1 text-xs bg-black/50 rounded-full px-1.5 py-0.5 text-white">
                    🤖
                  </span>
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
                  onClick={() => setSelectedPhoto(photo)}
                  className="flex w-full items-center gap-3 rounded-apple-lg glass p-2 text-right shadow-sm"
                >
                  <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.caption || ''}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-apple-primary truncate">
                      {photo.caption || 'ללא כיתוב'}
                    </p>
                    <p className="text-xs text-apple-secondary">
                      {photographer && <span>{photographer.avatar_emoji} </span>}
                      {photo.location && <span>{photo.location} · </span>}
                      {photo.taken_at && formatDate(photo.taken_at)}
                    </p>
                  </div>
                  {photo.is_favorite && (
                    <Heart className="h-4 w-4 shrink-0 fill-red-400 text-red-400" />
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
