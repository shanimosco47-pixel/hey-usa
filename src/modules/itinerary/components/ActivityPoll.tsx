// src/modules/itinerary/components/ActivityPoll.tsx
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { cn } from '@/lib/cn'
import { Vote, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import type { ActivityPoll as ActivityPollType, FamilyMemberId } from '@/lib/types'

interface ActivityPollProps {
  poll: ActivityPollType
  onVote: (pollId: string, optionIndex: number) => void
  onDelete?: (pollId: string) => void
}

export function ActivityPoll({ poll, onVote, onDelete }: ActivityPollProps) {
  const { currentMember } = useAuth()
  const myVote = poll.votes.find((v) => v.member_id === currentMember)
  const totalVotes = poll.votes.length
  const hasVoted = !!myVote

  return (
    <div className="glass rounded-apple-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-ios-purple" />
          <h4 className="text-headline text-apple-primary">{poll.question}</h4>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(poll.id)}
            className="p-1 rounded-full hover:bg-black/[0.04]"
            aria-label="מחק הצבעה"
          >
            <X className="h-4 w-4 text-apple-secondary" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {poll.options.map((option, index) => {
          const optionVotes = poll.votes.filter((v) => v.option_index === index)
          const percent = totalVotes > 0 ? Math.round((optionVotes.length / totalVotes) * 100) : 0
          const isMyChoice = myVote?.option_index === index
          return (
            <button
              key={index}
              onClick={() => onVote(poll.id, index)}
              className={cn(
                'relative rounded-apple p-3 text-right overflow-hidden transition-colors',
                isMyChoice
                  ? 'border-2 border-ios-purple bg-ios-purple/5'
                  : 'border border-black/[0.06] hover:bg-black/[0.02]',
              )}
            >
              {hasVoted && (
                <motion.div
                  className="absolute inset-y-0 right-0 bg-ios-purple/10 rounded-apple"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-body text-apple-primary">{option}</span>
                <div className="flex items-center gap-1">
                  {hasVoted && (
                    <span className="text-caption text-apple-secondary">{percent}%</span>
                  )}
                  <div className="flex -space-x-1 rtl:space-x-reverse">
                    {optionVotes.slice(0, 3).map((v) => (
                      <FamilyAvatar key={v.member_id} memberId={v.member_id} size="xs" />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-caption text-apple-secondary mt-2">{totalVotes} הצבעות</p>
    </div>
  )
}

interface CreatePollProps {
  dayId: string
  onCreatePoll: (poll: Omit<ActivityPollType, 'id' | 'created_at'>) => void
}

export function CreatePollButton({ dayId, onCreatePoll }: CreatePollProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const { currentMember } = useAuth()

  const handleSubmit = () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2 || !currentMember) return
    onCreatePoll({
      day_id: dayId,
      question: question.trim(),
      options: options.filter((o) => o.trim()),
      votes: [],
      created_by: currentMember as FamilyMemberId,
    })
    setIsOpen(false)
    setQuestion('')
    setOptions(['', ''])
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4 ml-2" />
        הצבעה חדשה
      </Button>
    )
  }

  return (
    <div className="glass rounded-apple-lg p-4">
      <h4 className="text-headline text-apple-primary mb-3">הצבעה חדשה</h4>
      <input
        type="text"
        placeholder="מה השאלה?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full rounded-apple border border-black/[0.06] p-3 text-body mb-3 bg-transparent"
        dir="rtl"
      />
      {options.map((opt, i) => (
        <input
          key={i}
          type="text"
          placeholder={`אפשרות ${i + 1}`}
          value={opt}
          onChange={(e) => {
            const next = [...options]
            next[i] = e.target.value
            setOptions(next)
          }}
          className="w-full rounded-apple border border-black/[0.06] p-3 text-body mb-2 bg-transparent"
          dir="rtl"
        />
      ))}
      <div className="flex gap-2 mt-2">
        {options.length < 4 && (
          <Button variant="ghost" onClick={() => setOptions([...options, ''])}>
            + אפשרות
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="ghost" onClick={() => setIsOpen(false)}>
          ביטול
        </Button>
        <Button onClick={handleSubmit}>צור הצבעה</Button>
      </div>
    </div>
  )
}
