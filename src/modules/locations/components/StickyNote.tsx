import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pin, Trash2, Pencil } from 'lucide-react'
import type { LocationNote } from '@/lib/types'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { cn } from '@/lib/cn'

function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  return (hash % 7) - 3 // -3 to +3 degrees
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דקות`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  const days = Math.floor(hours / 24)
  if (days < 7) return `לפני ${days} ימים`
  return new Date(dateStr).toLocaleDateString('he-IL')
}

interface StickyNoteProps {
  note: LocationNote
  onEdit: (note: LocationNote) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
}

export function StickyNote({ note, onEdit, onDelete, onTogglePin }: StickyNoteProps) {
  const [showActions, setShowActions] = useState(false)
  const rotation = getRotation(note.id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, rotate: rotation - 5 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.6, rotate: rotation + 10 }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'sticky-note pushpin cursor-pointer',
        `sticky-${note.color}`,
        'p-5 pt-6 min-h-[140px] w-full',
        'flex flex-col justify-between',
      )}
      onClick={() => setShowActions(!showActions)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Note text */}
      <p className="text-[14px] leading-relaxed text-gray-800 font-medium whitespace-pre-wrap break-words">
        {note.text}
      </p>

      {/* Bottom row: avatar + time */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/[0.06]">
        <FamilyAvatar memberId={note.author} size="xs" />
        <span className="text-[10px] text-gray-500">{timeAgo(note.updated_at)}</span>
      </div>

      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute top-1 right-1">
          <Pin className="h-3.5 w-3.5 text-red-400 fill-red-400" />
        </div>
      )}

      {/* Action buttons overlay */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-2 flex gap-1"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(note) }}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
            title="ערוך"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-600" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(note.id, !note.pinned) }}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
            title={note.pinned ? 'בטל הצמדה' : 'הצמד'}
          >
            <Pin className={cn('h-3.5 w-3.5', note.pinned ? 'text-red-500 fill-red-500' : 'text-gray-600')} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
            className="p-1.5 rounded-full bg-white/80 hover:bg-red-50 shadow-sm transition-colors"
            title="מחק"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
