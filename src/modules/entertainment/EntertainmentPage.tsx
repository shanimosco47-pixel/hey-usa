import { useState, useMemo } from 'react'
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
import {
  SAMPLE_PLAYLIST,
  ROAD_TRIP_GAMES,
  USA_TRIVIA,
} from './data/sampleEntertainment'
import type { PlaylistItem, FamilyMemberId } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

type Tab = 'playlist' | 'games' | 'trivia'

export default function EntertainmentPage() {
  const { currentMember } = useAuth()
  const memberId = (currentMember || 'aba') as FamilyMemberId
  const [activeTab, setActiveTab] = useState<Tab>('playlist')
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(SAMPLE_PLAYLIST)
  const [showAddSong, setShowAddSong] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newArtist, setNewArtist] = useState('')
  const [triviaIndex, setTriviaIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const sortedPlaylist = useMemo(() => {
    return [...playlist].sort((a, b) => {
      const scoreA = a.votes.reduce((s, v) => s + (v.vote === 'up' ? 1 : -1), 0)
      const scoreB = b.votes.reduce((s, v) => s + (v.vote === 'up' ? 1 : -1), 0)
      return scoreB - scoreA
    })
  }, [playlist])

  function addSong() {
    if (!newTitle.trim()) return
    const song: PlaylistItem = {
      id: `song-${Date.now()}`,
      title: newTitle,
      artist: newArtist || undefined,
      added_by: memberId,
      votes: [{ member_id: memberId, vote: 'up' }],
      created_at: new Date().toISOString(),
    }
    setPlaylist((prev) => [...prev, song])
    setNewTitle('')
    setNewArtist('')
    setShowAddSong(false)
  }

  function vote(songId: string, voteType: 'up' | 'down') {
    setPlaylist((prev) =>
      prev.map((song) => {
        if (song.id !== songId) return song
        const filtered = song.votes.filter((v) => v.member_id !== memberId)
        const existing = song.votes.find((v) => v.member_id === memberId)
        if (existing?.vote === voteType) return { ...song, votes: filtered }
        return { ...song, votes: [...filtered, { member_id: memberId, vote: voteType }] }
      }),
    )
  }

  function deleteSong(id: string) {
    setPlaylist((prev) => prev.filter((s) => s.id !== id))
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
      <h1 className="text-2xl font-bold text-brown">
        <Music className="ml-2 inline h-6 w-6" />
        בידור
      </h1>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white/60 p-1">
        {tabs.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-colors',
              activeTab === id ? 'bg-white text-brown shadow-sm' : 'text-brown-light',
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
            <p className="text-sm text-brown-light">{playlist.length} שירים</p>
            <button onClick={() => setShowAddSong(!showAddSong)} className="flex items-center gap-1.5 rounded-xl bg-group-pre px-3 py-1.5 text-xs font-medium text-white">
              <Plus className="h-3.5 w-3.5" />הוסף שיר
            </button>
          </div>

          {showAddSong && (
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm space-y-2">
              <input type="text" placeholder="שם השיר" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50" />
              <input type="text" placeholder="אמן (אופציונלי)" value={newArtist} onChange={(e) => setNewArtist(e.target.value)}
                className="w-full rounded-xl border border-sand-dark bg-sand/50 px-3 py-2 text-sm text-brown placeholder:text-brown-light/50" />
              <div className="flex gap-2">
                <button onClick={addSong} className="flex-1 rounded-xl bg-group-pre px-4 py-2 text-sm font-medium text-white">הוסף</button>
                <button onClick={() => setShowAddSong(false)} className="rounded-xl bg-sand-dark px-4 py-2 text-sm font-medium text-brown-light">ביטול</button>
              </div>
            </div>
          )}

          {sortedPlaylist.map((song, idx) => {
            const adder = getFamilyMember(song.added_by)
            const score = song.votes.reduce((s, v) => s + (v.vote === 'up' ? 1 : -1), 0)
            const myVote = song.votes.find((v) => v.member_id === memberId)?.vote
            return (
              <div key={song.id} className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-group-pre/10 text-sm font-bold text-group-pre">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brown truncate">{song.title}</p>
                  <p className="text-xs text-brown-light">{song.artist && <span>{song.artist} · </span>}{adder.avatar_emoji} {adder.name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => vote(song.id, 'up')} className={cn('rounded-lg p-1.5', myVote === 'up' ? 'bg-sage/20 text-sage' : 'text-brown-light/40')}>
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <span className={cn('min-w-[1.5rem] text-center text-sm font-bold', score > 0 ? 'text-sage' : score < 0 ? 'text-terracotta' : 'text-brown-light')}>{score}</span>
                  <button onClick={() => vote(song.id, 'down')} className={cn('rounded-lg p-1.5', myVote === 'down' ? 'bg-terracotta/20 text-terracotta' : 'text-brown-light/40')}>
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteSong(song.id)} className="mr-1 rounded-lg p-1 text-brown-light/30 hover:text-terracotta">
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
          <p className="text-sm text-brown-light">משחקים לדרך - כיף לכל המשפחה!</p>
          {ROAD_TRIP_GAMES.map((game) => (
            <div key={game.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{game.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-brown">{game.name}</h3>
                  <p className="mt-1 text-sm text-brown-light leading-relaxed">{game.description}</p>
                  <p className="mt-2 text-xs text-brown-light/70">גיל מינימלי: {game.minAge}+</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trivia Tab */}
      {activeTab === 'trivia' && (
        <div className="space-y-4">
          <p className="text-sm text-brown-light">חידון ארה"ב - בדקו את הידע שלכם!</p>
          <div className="rounded-2xl bg-white/80 p-6 shadow-sm text-center">
            <span className="inline-block rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">{USA_TRIVIA[triviaIndex].category}</span>
            <p className="mt-4 text-lg font-bold text-brown leading-relaxed">{USA_TRIVIA[triviaIndex].question}</p>
            <p className="mt-1 text-xs text-brown-light">שאלה {triviaIndex + 1} מתוך {USA_TRIVIA.length}</p>
            {showAnswer ? (
              <div className="mt-4 rounded-xl bg-sage/10 p-4">
                <p className="text-base font-bold text-sage">{USA_TRIVIA[triviaIndex].answer}</p>
              </div>
            ) : (
              <button onClick={() => setShowAnswer(true)} className="mt-4 flex items-center gap-1.5 mx-auto rounded-xl bg-sky/10 px-4 py-2 text-sm font-medium text-sky">
                <Eye className="h-4 w-4" />גלה תשובה
              </button>
            )}
            <button onClick={nextTrivia} className="mt-4 w-full rounded-xl bg-sky px-4 py-3 text-sm font-medium text-white">שאלה הבאה</button>
          </div>
          <div className="flex justify-center gap-1.5">
            {USA_TRIVIA.map((_, i) => (
              <div key={i} className={cn('h-2 w-2 rounded-full', i === triviaIndex ? 'bg-sky' : 'bg-sand-dark')} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
