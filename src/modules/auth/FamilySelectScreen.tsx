import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'
import type { FamilyMemberId } from '@/types'

const memberIds = Object.keys(FAMILY_MEMBERS) as FamilyMemberId[]

export function FamilySelectScreen() {
  const { selectMember } = useAuth()
  const navigate = useNavigate()

  function handleSelect(id: FamilyMemberId) {
    selectMember(id)
    navigate('/')
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-sand font-hebrew px-4"
      dir="rtl"
    >
      {/* Desert gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sand via-sand to-sand-dark/30 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brown mb-2">
            מי את/ה?
          </h1>
          <p className="text-brown-light">בחר/י את עצמך</p>
        </div>

        {/* Family member grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
          {memberIds.map((id) => {
            const member = FAMILY_MEMBERS[id]
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-2xl p-5',
                  'bg-white/80 shadow-sm',
                  'hover:shadow-md hover:scale-[1.03]',
                  'active:scale-[0.98]',
                  'transition-all duration-200',
                  'border-2',
                )}
                style={{ borderColor: member.color }}
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
                  style={{ backgroundColor: `${member.color}20` }}
                >
                  <span role="img" aria-label={member.name}>
                    {member.emoji}
                  </span>
                </div>
                <span className="text-lg font-semibold text-brown">
                  {member.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
