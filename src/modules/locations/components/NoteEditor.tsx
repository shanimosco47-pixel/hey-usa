import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { LocationNote, NoteColor, FamilyMemberId } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/cn'

const NOTE_COLORS: { value: NoteColor; bg: string }[] = [
  { value: 'yellow', bg: '#fff9c4' },
  { value: 'pink', bg: '#fce4ec' },
  { value: 'blue', bg: '#e3f2fd' },
  { value: 'green', bg: '#e8f5e9' },
  { value: 'orange', bg: '#fff3e0' },
  { value: 'purple', bg: '#f3e5f5' },
]

interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: { text: string; color: NoteColor; pinned: boolean; author: FamilyMemberId }) => void
  editingNote?: LocationNote | null
}

export function NoteEditor({ isOpen, onClose, onSave, editingNote }: NoteEditorProps) {
  const { currentMember } = useAuth()
  const [text, setText] = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (editingNote) {
      setText(editingNote.text)
      setColor(editingNote.color)
      setPinned(editingNote.pinned)
    } else {
      setText('')
      setColor('yellow')
      setPinned(false)
    }
  }, [editingNote, isOpen])

  function handleSave() {
    if (!text.trim()) return
    onSave({
      text: text.trim(),
      color,
      pinned,
      author: currentMember || 'aba',
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
              'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[90vw] max-w-md',
              'rounded-apple-xl shadow-glass-float',
              'overflow-hidden',
            )}
            style={{ backgroundColor: NOTE_COLORS.find((c) => c.value === color)?.bg || '#fff9c4' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h3 className="text-headline text-gray-800">
                {editingNote ? 'ערוך פתק' : 'פתק חדש'}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-black/[0.06] transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Text area */}
            <div className="px-5 py-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="מה רוצים לזכור? ..."
                className={cn(
                  'w-full h-32 resize-none rounded-apple p-3',
                  'bg-white/40 border border-black/[0.08]',
                  'text-body text-gray-800 placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-ios-blue/30',
                )}
                autoFocus
                dir="rtl"
              />
            </div>

            {/* Color picker */}
            <div className="px-5 pb-3">
              <p className="text-caption text-gray-500 mb-2">צבע הפתק</p>
              <div className="flex gap-2.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      color === c.value
                        ? 'border-gray-700 scale-110 shadow-md'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: c.bg }}
                  />
                ))}
              </div>
            </div>

            {/* Pin toggle + Save */}
            <div className="flex items-center justify-between px-5 pb-5 pt-2">
              <button
                onClick={() => setPinned(!pinned)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-subhead transition-all',
                  pinned
                    ? 'bg-red-100 text-red-600'
                    : 'bg-black/[0.05] text-gray-500 hover:bg-black/[0.08]',
                )}
              >
                📌 {pinned ? 'מוצמד' : 'הצמד'}
              </button>
              <button
                onClick={handleSave}
                disabled={!text.trim()}
                className={cn(
                  'px-6 py-2 rounded-full text-subhead font-semibold transition-all',
                  text.trim()
                    ? 'bg-ios-blue text-white hover:bg-blue-600 shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                )}
              >
                {editingNote ? 'שמור' : 'הוסף'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
