import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, MapPin } from 'lucide-react'
import { useAppData } from '@/contexts/AppDataContext'
import { LOCATIONS } from '@/data/locations'
import { StickyNote } from '@/modules/locations/components/StickyNote'
import { NoteEditor } from './components/NoteEditorWithLocation'
import type { LocationNote, NoteColor, FamilyMemberId } from '@/lib/types'
import { cn } from '@/lib/cn'

type FilterMode = 'all' | 'general' | 'location'

export default function NotesPage() {
  const {
    locationNotes, addLocationNote, updateLocationNote, deleteLocationNote,
  } = useAppData()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<LocationNote | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')

  const notes = useMemo(() => {
    let filtered = locationNotes
    if (filter === 'general') filtered = filtered.filter((n) => !n.locationId)
    if (filter === 'location') filtered = filtered.filter((n) => n.locationId)
    return [...filtered.filter((n) => n.pinned), ...filtered.filter((n) => !n.pinned)]
  }, [locationNotes, filter])

  function handleSaveNote(data: {
    text: string; color: NoteColor; pinned: boolean;
    author: FamilyMemberId; locationId: string | null
  }) {
    if (editingNote) {
      updateLocationNote(editingNote.id, data)
    } else {
      addLocationNote({ ...data, locationId: data.locationId || null })
    }
    setEditingNote(null)
  }

  function handleEditNote(note: LocationNote) {
    setEditingNote(note)
    setEditorOpen(true)
  }

  function handleTogglePin(id: string, pinned: boolean) {
    updateLocationNote(id, { pinned })
  }

  function getLocationLabel(locationId: string | null): string | null {
    if (!locationId) return null
    const loc = LOCATIONS.find((l) => l.id === locationId)
    return loc ? `${loc.emoji} ${loc.nameHe}` : null
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h1 className="text-title text-apple-primary">לוח פתקים</h1>
              <p className="text-caption text-apple-secondary">{locationNotes.length} פתקים</p>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {([
            { id: 'all' as FilterMode, label: 'הכל', count: locationNotes.length },
            { id: 'general' as FilterMode, label: 'כללי', count: locationNotes.filter((n) => !n.locationId).length },
            { id: 'location' as FilterMode, label: 'מקושר ליעד', count: locationNotes.filter((n) => n.locationId).length },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[12px] font-medium transition-all',
                filter === f.id
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'bg-black/[0.04] text-apple-secondary hover:bg-black/[0.08]',
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Add note button */}
          <motion.button
            whileHover={{ scale: 1.03, rotate: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditingNote(null); setEditorOpen(true) }}
            className={cn(
              'sticky-note sticky-yellow',
              'min-h-[140px] p-5',
              'flex flex-col items-center justify-center gap-2',
              'cursor-pointer border-2 border-dashed border-amber-300/60',
            )}
            style={{ rotate: '-1deg' }}
          >
            <Plus className="h-8 w-8 text-amber-400" />
            <span className="text-subhead text-amber-600 font-medium">פתק חדש</span>
          </motion.button>

          {notes.map((note) => (
            <div key={note.id} className="relative">
              <StickyNote
                note={note}
                onEdit={handleEditNote}
                onDelete={deleteLocationNote}
                onTogglePin={handleTogglePin}
              />
              {/* Location badge */}
              {note.locationId && (
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/60 backdrop-blur-sm text-[9px] text-gray-600 font-medium">
                    <MapPin className="h-2.5 w-2.5" />
                    {getLocationLabel(note.locationId)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <p className="text-center text-apple-secondary text-body mt-8">
            אין פתקים {filter !== 'all' ? 'בקטגוריה הזו' : 'עדיין'}. הוסיפו פתק ראשון! ✏️
          </p>
        )}
      </div>

      {/* Note Editor */}
      <NoteEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingNote(null) }}
        onSave={handleSaveNote}
        editingNote={editingNote}
      />
    </div>
  )
}
