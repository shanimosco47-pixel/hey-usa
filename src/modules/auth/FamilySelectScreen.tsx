import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="text-center"
        >
          <h1 className="text-title text-apple-primary mb-2">
            מי את/ה?
          </h1>
          <p className="text-subhead text-apple-secondary">בחר/י את עצמך</p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full"
        >
          {memberIds.map((id) => {
            const member = FAMILY_MEMBERS[id]
            return (
              <motion.button
                key={id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.9 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 300, damping: 20 },
                  },
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSelect(id)}
                className="text-center"
              >
                <GlassCard
                  padding="lg"
                  className={cn(
                    'flex flex-col items-center gap-3',
                    'transition-shadow duration-200',
                    'hover:shadow-glass-hover',
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
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
