import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Music,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Gamepad2,
  HelpCircle,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { getFamilyMember } from '@/lib/constants'
import { isSampleData } from '@/lib/sampleData'
import {
  ROAD_TRIP_GAMES,
  USA_TRIVIA,
} from './data/sampleEntertainment'
import type { FamilyMemberId } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'

type Tab = 'playlist' | 'games' | 'trivia'

export default function EntertainmentPage() {
  const { currentMember } = useAuth()
  const { playlistItems, addPlaylistItem, updatePlaylistItem, deletePlaylistItem } = useAppData()
  const memberId = (currentMember || 'aba') as FamilyMemberId
  const [activeTab, setActiveTab] = useState<Tab>('playlist')
  const [showAddSong, setShowAddSong] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [triviaIndex, setTriviaIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const sortedPlaylist = useMemo(() => {
    return [...playlistItems].sort((a, b) => {
      const scoreA = a.votes.reduce((s, v) => s + (v.vote === 'up' ? 1 : -1), 0)
      const scoreB = b.votes.reduce((s, v) => s + (v.vote === 'up' ? 1 : -1), 0)
      return scoreB - scoreA
    })
  }, [playlistItems])

  function addSong() {
    if (!newTitle.trim()) return
    addPlaylistItem({
      title: newTitle,
      artist: newArtist || undefined,
      added_by: memberId,
      votes: [{ member_id: memberId, vote: 'up' }],
    })
    setNewTitle('')
    setNewArtist('')
    setShowAddSong(false)
  }

  function vote(songId: string, voteType: 'up' | 'down') {
    const song = playlistItems.find((s) => s.id === songId)
    if (!song) return
    const filtered = song.votes.filter((v) => v.member_id !== memberId)
    const existing = song.votes.find((v) => v.member_id === memberId)
    const newVotes = existing?.vote === voteType ? filtered : [...filtered, { member_id: memberId, vote: voteType }]
    updatePlaylistItem(songId, { votes: newVotes })
  }

  function deleteSong(id: string) {
    deletePlaylistItem(id)
  }

  function nextTrivia() {
    setShowAnswer(false)
    setTriviaIndex((prev) => (prev + 1) % USA_TRIVIA.length)
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'playlist', label: 'פלייליסט', icon: Music },
    { id: 'games', label: 'משחקים', icon: Gamepad2 },
    { id: 'trivia', label: 'חידון', icon: HelpCircle },
  ]

  return (
    <div className="space-y-4 p-4">
      <motion.h1
        className="text-2xl font-bold text-apple-primary"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Music className="ml-2 inline h-6 w-6" />
        בידור
      </motion.h1>

      {/* Tabs */}
      <div className="flex glass rounded-apple-lg p-1">
        {tabs.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-colors',
              activeTab === id ? 'bg-white text-apple-primary shadow-sm' : 'text-apple-secondary',
            )}
          >
            <TabIcon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Playlist Tab */}
      {activeTab === 'playlist' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-apple-secondary">{playlistItems.length} שירים</p>
            <button onClick={() => setShowAddSong(!showAddSong)} className="flex items-center gap-1.5 rounded-xl bg-ios-indigo px-3 py-1.5 text-xs font-medium text-white">
              <Plus className="h-3.5 w-3.5" />הוסף שיר
            </button>
          </div>

          {showAddSong && (
            <div className="glass rounded-apple-lg p-4 shadow-sm space-y-2">
              <input type="text" placeholder="שם השיר" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary" />
              <input type="text" placeholder="אמן (אופציונלי)" value={newArtist} onChange={(e) => setNewArtist(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-surface-primary px-3 py-2 text-sm text-apple-primary placeholder:text-apple-tertiary" />
              <div className="flex gap-2">
                <button onClick={addSong} className="flex-1 rounded-xl bg-ios-indigo px-4 py-2 text-sm font-medium text-white">הוסף</button>
                <button onClick={() => setShowAddSong(false)} className="rounded-xl bg-black/[0.04] px-4 py-2 text-sm font-medium text-apple-secondary">ביטול</button>
              </div>
            </div>
          )}

          {sortedPlaylist.map((song, idx) => {
            const adder = getFamilyMember(song.added_by)
            const score = song.votes.reduce((s, v) => s + (v.vote === 'up' ? 1 : -1), 0)
            const myVote = song.votes.find((v) => v.member_id === memberId)?.vote
            return (
              <div key={song.id} className="flex items-center gap-3 glass rounded-apple-lg p-3 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ios-indigo/10 text-sm font-bold text-ios-indigo">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-apple-primary truncate">{isSampleData(song.id) && <span className="text-[10px] ml-1 opacity-60" title="דוגמה מאת מוטי">🤖</span>}{song.title}</p>
                  <p className="text-xs text-apple-secondary">{song.artist && <span>{song.artist} · </span>}{adder.avatar_emoji} {adder.name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => vote(song.id, 'up')} className={cn('rounded-lg p-1.5', myVote === 'up' ? 'bg-ios-green/20 text-ios-green' : 'text-apple-tertiary')}>
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <span className={cn('min-w-[1.5rem] text-center text-sm font-bold', score > 0 ? 'text-ios-green' : score < 0 ? 'text-ios-red' : 'text-apple-secondary')}>{score}</span>
                  <button onClick={() => vote(song.id, 'down')} className={cn('rounded-lg p-1.5', myVote === 'down' ? 'bg-ios-red/20 text-ios-red' : 'text-apple-tertiary')}>
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteSong(song.id)} className="mr-1 rounded-lg p-1 text-apple-tertiary/30 hover:text-ios-red">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="space-y-3">
          <p className="text-sm text-apple-secondary">משחקים לדרך - כיף לכל המשפחה!</p>
          {ROAD_TRIP_GAMES.map((game) => (
            <div key={game.id} className="glass rounded-apple-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{game.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-apple-primary">{game.name}</h3>
                  <p className="mt-1 text-sm text-apple-secondary leading-relaxed">{game.description}</p>
                  <p className="mt-2 text-xs text-apple-tertiary">גיל מינימלי: {game.minAge}+</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trivia Tab */}
      {activeTab === 'trivia' && (
        <div className="space-y-4">
          <p className="text-sm text-apple-secondary">חידון ארה"ב - בדקו את הידע שלכם!</p>
          <div className="glass rounded-apple-lg p-6 shadow-sm text-center">
            <span className="inline-block rounded-full bg-ios-teal/10 px-3 py-1 text-xs font-medium text-ios-teal">{USA_TRIVIA[triviaIndex].category}</span>
            <p className="mt-4 text-lg font-bold text-apple-primary leading-relaxed">{USA_TRIVIA[triviaIndex].question}</p>
            <p className="mt-1 text-xs text-apple-secondary">שאלה {triviaIndex + 1} מתוך {USA_TRIVIA.length}</p>
            {showAnswer ? (
              <div className="mt-4 rounded-xl bg-ios-green/10 p-4">
                <p className="text-base font-bold text-ios-green">{USA_TRIVIA[triviaIndex].answer}</p>
              </div>
            ) : (
              <button onClick={() => setShowAnswer(true)} className="mt-4 flex items-center gap-1.5 mx-auto rounded-xl bg-ios-teal/10 px-4 py-2 text-sm font-medium text-ios-teal">
                <Eye className="h-4 w-4" />גלה תשובה
              </button>
            )}
            <button onClick={nextTrivia} className="mt-4 w-full rounded-xl bg-ios-teal px-4 py-3 text-sm font-medium text-white">שאלה הבאה</button>
          </div>
          <div className="flex justify-center gap-1.5">
            {USA_TRIVIA.map((_, i) => (
              <div key={i} className={cn('h-2 w-2 rounded-full', i === triviaIndex ? 'bg-ios-teal' : 'bg-black/[0.04]')} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
