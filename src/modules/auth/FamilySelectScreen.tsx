import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { useAuth } from '@/contexts/AuthContext'
import { FAMILY_MEMBERS } from '@/constants'
import { GlassCard } from '@/components/shared/GlassCard'
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
      className="relative flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4 overflow-hidden"
      dir="rtl"
    >
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full bg-ios-green/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-ios-orange/[0.06] blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-title text-apple-primary mb-2">
            מי את/ה?
          </h1>
          <p className="text-subhead text-apple-secondary">בחר/י את עצמך</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
          {memberIds.map((id) => {
            const member = FAMILY_MEMBERS[id]
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="text-center"
              >
                <GlassCard
                  padding="lg"
                  className={cn(
                    'flex flex-col items-center gap-3 card-hover',
                    'hover:scale-[1.03] active:scale-[0.98]',
                    'transition-all duration-200',
                  )}
                >
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full text-4xl ring-2 ring-offset-2"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${member.color} 12%, white)`,
                      '--tw-ring-color': member.color,
                    } as React.CSSProperties}
                  >
                    <span role="img" aria-label={member.name}>
                      {member.emoji}
                    </span>
                  </div>
                  <span className="text-headline text-apple-primary">
                    {member.name}
                  </span>
                </GlassCard>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
