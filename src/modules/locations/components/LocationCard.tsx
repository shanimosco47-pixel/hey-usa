import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StickyNote as StickyNoteIcon, FileText } from 'lucide-react'
import type { LocationDef } from '@/data/locations'
import { cn } from '@/lib/cn'

function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  return (hash % 5) - 2 // -2 to +2 degrees
}

interface LocationCardProps {
  location: LocationDef
  dateRange: string | null
  noteCount: number
  docCount: number
  stopCount: number
  index: number
}

export function LocationCard({ location, dateRange, noteCount, docCount, stopCount, index }: LocationCardProps) {
  const rotation = getRotation(location.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{
        delay: index * 0.05,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        rotate: 0,
        scale: 1.05,
        y: -8,
        zIndex: 20,
        transition: { type: 'spring', stiffness: 300, damping: 15 },
      }}
      whileTap={{ scale: 0.97 }}
      className="relative"
    >
      <Link to={`/locations/${location.id}`} className="block">
        {/* Pushpin */}
        <div className="pushpin absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0 h-0" />

        {/* Polaroid card */}
        <div
          className={cn(
            'bg-white rounded-sm p-2 pb-4',
            'shadow-[3px_4px_12px_rgba(0,0,0,0.2),_0_1px_3px_rgba(0,0,0,0.1)]',
            'hover:shadow-[5px_8px_20px_rgba(0,0,0,0.25)]',
            'transition-shadow duration-300',
          )}
        >
          {/* Photo */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-3">
            <img
              src={location.photo}
              alt={location.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className={cn('absolute inset-0 bg-gradient-to-t opacity-40', location.gradient)} />

            {/* Emoji floating */}
            <span className="absolute top-2 right-2 text-2xl drop-shadow-lg">
              {location.emoji}
            </span>

            {/* Badge counts */}
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              {noteCount > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 text-[10px] font-semibold text-gray-700 shadow-sm">
                  <StickyNoteIcon className="h-3 w-3" /> {noteCount}
                </span>
              )}
              {docCount > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 text-[10px] font-semibold text-gray-700 shadow-sm">
                  <FileText className="h-3 w-3" /> {docCount}
                </span>
              )}
            </div>
          </div>

          {/* Name + info */}
          <div className="px-1 text-center">
            <h3 className="text-[15px] font-bold text-gray-800 leading-tight">
              {location.nameHe}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
              {location.name}
            </p>
            {dateRange && (
              <p className="text-[10px] text-gray-400 mt-1">
                {dateRange}
              </p>
            )}
            {stopCount > 0 && (
              <p className="text-[10px] text-ios-blue mt-0.5 font-medium">
                {stopCount} עצירות
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
