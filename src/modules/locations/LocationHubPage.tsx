import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import {
  ArrowRight,
  MapPin,
  StickyNote as StickyNoteIcon,
  Calendar,
  FileText,
  Plus,
  Clock,
  ExternalLink,
  Bed,
} from 'lucide-react'
import { useAppData } from '@/contexts/AppDataContext'
import {
  getLocationById,
  getDaysForLocation,
  getLocationDateRange,
  getLocationForArea,
} from '@/data/locations'
import { useCampsiteBookings } from '@/modules/campsites/hooks/useCampsiteBookings'
import { StickyNote } from './components/StickyNote'
import { NoteEditor } from './components/NoteEditor'
import type { LocationNote, NoteColor, FamilyMemberId } from '@/lib/types'
import { cn } from '@/lib/cn'

type Tab = 'notes' | 'plan' | 'lodging' | 'documents'

const TABS: { id: Tab; label: string; icon: typeof StickyNoteIcon }[] = [
  { id: 'notes', label: 'הערות', icon: StickyNoteIcon },
  { id: 'plan', label: 'תכנון', icon: Calendar },
  { id: 'lodging', label: 'לינה', icon: Bed },
  { id: 'documents', label: 'מסמכים', icon: FileText },
]

const CATEGORY_ICONS: Record<string, string> = {
  hike: '🥾',
  drive: '🚗',
  scenic: '🏞️',
  food: '🍽️',
  camp: '⛺',
  city: '🏙️',
  activity: '🎯',
  rest: '😴',
}

export default function LocationHubPage() {
  const { locationId } = useParams<{ locationId: string }>()
  const navigate = useNavigate()
  const {
    itineraryDays,
    locationNotes,
    documents,
    addLocationNote,
    updateLocationNote,
    deleteLocationNote,
  } = useAppData()

  const [activeTab, setActiveTab] = useState<Tab>('notes')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<LocationNote | null>(null)

  const { bookings } = useCampsiteBookings()
  const location = getLocationById(locationId || '')

  const matchingDays = useMemo(
    () => getDaysForLocation(locationId || '', itineraryDays),
    [locationId, itineraryDays],
  )

  const dateRange = useMemo(
    () => getLocationDateRange(locationId || '', itineraryDays),
    [locationId, itineraryDays],
  )

  const notes = useMemo(() => {
    const all = locationNotes.filter((n) => n.locationId === locationId)
    return [...all.filter((n) => n.pinned), ...all.filter((n) => !n.pinned)]
  }, [locationNotes, locationId])

  const locationDocs = useMemo(
    () => documents.filter((d) => d.locationId === locationId),
    [documents, locationId],
  )

  const locationBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const bLoc = getLocationForArea(b.area)
        return bLoc?.id === locationId && b.priority === 'primary'
      }),
    [bookings, locationId],
  )

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <span className="text-5xl mb-4">🗺️</span>
        <h2 className="text-title text-apple-primary mb-2">יעד לא נמצא</h2>
        <Link to="/locations" className="text-ios-blue font-medium hover:underline">
          חזרה ליעדים
        </Link>
      </div>
    )
  }

  function handleSaveNote(data: {
    text: string
    color: NoteColor
    pinned: boolean
    author: FamilyMemberId
  }) {
    if (editingNote) {
      updateLocationNote(editingNote.id, data)
    } else {
      addLocationNote({ ...data, locationId: location!.id })
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

  const totalStops = matchingDays.reduce((acc, d) => acc + d.stops.length, 0)

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative h-[280px] md:h-[340px] overflow-hidden">
        {/* Background image */}
        <img
          src={location.photo}
          alt={location.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className={cn('absolute inset-0 bg-gradient-to-b opacity-70', location.gradient)} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Floating emoji */}
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-8 left-8 text-6xl opacity-30 select-none"
        >
          {location.emoji}
        </motion.span>

        {/* Back button */}
        <Link
          to="/locations"
          className={cn(
            'absolute top-4 right-4 z-10',
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            'bg-white/20 backdrop-blur-md text-white text-subhead font-medium',
            'hover:bg-white/30 transition-colors',
          )}
        >
          <ArrowRight className="h-4 w-4" />
          יעדים
        </Link>

        {/* Map link */}
        <button
          onClick={() => navigate(`/map`)}
          className={cn(
            'absolute top-4 left-4 z-10',
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            'bg-white/20 backdrop-blur-md text-white text-subhead font-medium',
            'hover:bg-white/30 transition-colors',
          )}
        >
          <MapPin className="h-4 w-4" />
          מפה
        </button>

        {/* Hero content */}
        <div className="absolute bottom-0 inset-x-0 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-title sm:text-hero text-white drop-shadow-lg mb-1">
              {location.emoji} {location.nameHe}
            </h2>
            <p className="text-body text-white/80 font-medium mb-3">{location.name}</p>
            <div className="flex flex-wrap gap-2">
              {dateRange && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-subhead text-white font-medium">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(dateRange.start), 'EEE dd/MM')}
                  {dateRange.start !== dateRange.end &&
                    ` – ${format(parseISO(dateRange.end), 'EEE dd/MM')}`}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-subhead text-white font-medium">
                📍 {totalStops} עצירות
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-subhead text-white font-medium">
                📝 {notes.length} הערות
              </span>
              {locationBookings.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-subhead text-white font-medium">
                  🏕️ {locationBookings.length} לינה
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Moti's Summary ──────────────────────────────────── */}
      {(location.summary || location.funFact) && (
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
          {location.summary && (
            <div className="glass rounded-apple-lg px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">🤖</span>
                <div>
                  <p className="text-subhead text-apple-primary leading-relaxed">
                    {location.summary}
                  </p>
                  <p className="text-caption text-apple-tertiary mt-1 font-medium">— מוטי</p>
                </div>
              </div>
            </div>
          )}
          {location.funFact && (
            <div className="rounded-apple-lg bg-ios-orange/10 border border-ios-orange/20 px-4 py-3">
              <p className="text-subhead text-ios-orange leading-relaxed">{location.funFact}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Navigation ─────────────────────────────────── */}
      <div className="sticky top-14 z-20 bg-surface-primary/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="flex gap-1 px-4 py-2 max-w-4xl mx-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-apple text-subhead font-medium transition-all',
                  isActive
                    ? 'bg-ios-blue text-white shadow-glass-hover'
                    : 'text-apple-secondary hover:bg-black/[0.04]',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Add note button as a "blank sticky" */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.03, rotate: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setEditingNote(null)
                    setEditorOpen(true)
                  }}
                  className={cn(
                    'sticky-note sticky-yellow',
                    'min-h-[140px] p-5',
                    'flex flex-col items-center justify-center gap-2',
                    'cursor-pointer border-2 border-dashed border-amber-300/60',
                  )}
                  style={{ rotate: '-1deg' }}
                >
                  <Plus className="h-8 w-8 text-ios-orange" />
                  <span className="text-subhead text-ios-orange font-medium">פתק חדש</span>
                </motion.button>

                {notes.map((note) => (
                  <StickyNote
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={deleteLocationNote}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>

              {notes.length === 0 && (
                <p className="text-center text-apple-secondary text-body mt-6">
                  אין עדיין הערות ליעד הזה. הוסיפו פתק ראשון! ✏️
                </p>
              )}
            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {matchingDays.length === 0 ? (
                <p className="text-center text-apple-secondary text-body py-8">
                  אין עצירות מתוכננות ביעד הזה
                </p>
              ) : (
                matchingDays.map((day) => (
                  <div key={day.id} className="space-y-3">
                    {/* Day header */}
                    <Link
                      to={`/itinerary/${day.id.replace('day-', '')}`}
                      className="flex items-center gap-3 group"
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-full',
                          'bg-gradient-to-r',
                          location.gradient,
                          'text-white text-subhead font-semibold shadow-sm',
                        )}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {day.title}
                      </div>
                      <span className="text-caption text-apple-tertiary">
                        {format(parseISO(day.date), 'EEE dd/MM/yyyy')}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-apple-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    {/* Day notes */}
                    {day.notes && (
                      <div
                        className="glass rounded-apple-lg px-4 py-3 text-body text-apple-secondary"
                        dir="auto"
                      >
                        💡 {day.notes}
                      </div>
                    )}

                    {/* Stops */}
                    <div className="space-y-2 pe-4 border-e-2 border-black/[0.06] me-2">
                      {day.stops.map((stop) => (
                        <motion.div
                          key={stop.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="glass rounded-apple-lg px-4 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg shrink-0 mt-0.5">
                              {CATEGORY_ICONS[stop.category || ''] || '📍'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-body font-semibold text-apple-primary">
                                {stop.title}
                              </h4>
                              {stop.description && (
                                <p
                                  className="text-subhead text-apple-secondary mt-0.5 line-clamp-2"
                                  dir="auto"
                                >
                                  {stop.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {stop.start_time && (
                                  <span className="text-caption text-apple-tertiary font-medium">
                                    🕐 {stop.start_time}
                                    {stop.end_time && ` – ${stop.end_time}`}
                                  </span>
                                )}
                                {stop.cost_estimate !== undefined && stop.cost_estimate > 0 && (
                                  <span className="text-caption text-ios-green font-medium">
                                    ~${stop.cost_estimate}
                                  </span>
                                )}
                                {stop.booking_confirmation && (
                                  <span className="text-caption px-1.5 py-0.5 rounded bg-ios-blue/10 text-ios-blue font-semibold">
                                    ✓ {stop.booking_confirmation}
                                  </span>
                                )}
                              </div>
                              {stop.notes && (
                                <p
                                  className="text-subhead text-ios-orange bg-ios-orange/10 rounded-apple-sm px-2 py-1 mt-2"
                                  dir="auto"
                                >
                                  📌 {stop.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'lodging' && (
            <motion.div
              key="lodging"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {locationBookings.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">🏕️</span>
                  <p className="text-body text-apple-secondary">אין הזמנות לינה ביעד הזה</p>
                  <Link
                    to="/campsites"
                    className="inline-flex items-center gap-1 mt-3 text-ios-blue text-subhead font-medium hover:underline"
                  >
                    <Bed className="h-4 w-4" />
                    עבור להזמנות לינה
                  </Link>
                </div>
              ) : (
                locationBookings.map((booking) => {
                  const nights = Math.round(
                    (new Date(booking.check_out + 'T00:00:00').getTime() -
                      new Date(booking.check_in + 'T00:00:00').getTime()) /
                      86400000,
                  )
                  const statusColors: Record<string, string> = {
                    confirmed: 'bg-ios-green/10 text-ios-green border-ios-green',
                    pending: 'bg-ios-orange/10 text-ios-orange border-ios-orange',
                    waitlist: 'bg-ios-blue/10 text-ios-blue border-ios-blue',
                    not_open: 'bg-black/[0.04] text-apple-secondary border-black/[0.10]',
                    cancelled: 'bg-ios-red/10 text-ios-red border-ios-red',
                  }
                  const statusLabels: Record<string, string> = {
                    confirmed: 'מאושר',
                    pending: 'בטיפול',
                    waitlist: 'המתנה',
                    not_open: 'לא הוזמן',
                    cancelled: 'בוטל',
                  }
                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'glass rounded-apple-lg px-4 py-3.5 border-r-4',
                        statusColors[booking.status]?.split(' ')[2] || '',
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-body font-semibold text-apple-primary">
                          {booking.location}
                        </h4>
                        <span
                          className={cn(
                            'text-caption px-2 py-0.5 rounded-full font-semibold',
                            statusColors[booking.status] || '',
                          )}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                      <p className="text-caption text-apple-secondary">{booking.area}</p>
                      <div
                        className="flex items-center gap-3 mt-2 text-subhead text-apple-secondary"
                        dir="ltr"
                      >
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(booking.check_in + 'T00:00:00').getDate()} —{' '}
                          {new Date(booking.check_out + 'T00:00:00').getDate()} ספט
                        </span>
                        <span>
                          {nights} {nights === 1 ? 'לילה' : 'לילות'}
                        </span>
                        {booking.cost != null && <span>${booking.cost}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {booking.booking_url && (
                          <a
                            href={booking.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-caption text-ios-blue hover:underline font-medium flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            אתר
                          </a>
                        )}
                        {booking.document_id && (
                          <Link
                            to={`/documents?doc=${booking.document_id}`}
                            className="text-caption text-ios-purple hover:underline font-medium flex items-center gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            מסמך
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
              <Link
                to="/campsites"
                className="block text-center text-subhead text-ios-blue font-medium hover:underline mt-2"
              >
                כל הזמנות הלינה →
              </Link>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {locationDocs.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">📂</span>
                  <p className="text-body text-apple-secondary">אין מסמכים מקושרים ליעד הזה</p>
                  <Link
                    to="/documents"
                    className="inline-flex items-center gap-1 mt-3 text-ios-blue text-subhead font-medium hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    עבור למסמכים
                  </Link>
                </div>
              ) : (
                locationDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-apple-lg px-4 py-3.5 card-hover"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-apple flex items-center justify-center shrink-0',
                          doc.category === 'attractions' && 'bg-ios-purple/15 text-ios-purple',
                          doc.category === 'accommodation' && 'bg-blue-100 text-blue-600',
                          doc.category === 'car_rental' && 'bg-green-100 text-green-600',
                          !['attractions', 'accommodation', 'car_rental'].includes(doc.category) &&
                            'bg-black/[0.04] text-apple-secondary',
                        )}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-body font-semibold text-apple-primary">{doc.title}</h4>
                        {doc.notes && (
                          <p
                            className="text-subhead text-apple-secondary mt-0.5 line-clamp-2"
                            dir="auto"
                          >
                            {doc.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-caption px-1.5 py-0.5 rounded-full bg-black/[0.04] text-apple-tertiary font-medium">
                            {doc.category}
                          </span>
                          {doc.file_size && (
                            <span className="text-caption text-apple-tertiary">
                              {(doc.file_size / 1_000_000).toFixed(1)} MB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Note Editor Dialog */}
      <NoteEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false)
          setEditingNote(null)
        }}
        onSave={handleSaveNote}
        editingNote={editingNote}
      />
    </div>
  )
}
