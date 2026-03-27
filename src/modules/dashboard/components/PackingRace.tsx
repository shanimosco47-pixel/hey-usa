import { useAppData } from '@/contexts/AppDataContext'
import { FAMILY_MEMBERS_LIST } from '@/constants'
import { FamilyAvatar } from '@/components/shared/FamilyAvatar'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import type { FamilyMemberId } from '@/lib/types'

export function PackingRace() {
  const { packingItems } = useAppData()

  // Calculate progress per family member (excluding 'moti')
  const memberProgress = FAMILY_MEMBERS_LIST
    .filter((m) => m.id !== 'moti')
    .map((member) => {
      const items = packingItems.filter((p) => p.assigned_to === member.id)
      const packed = items.filter((p) => p.is_packed).length
      const total = items.length
      const percent = total > 0 ? Math.round((packed / total) * 100) : 0
      return { member, packed, total, percent }
    })
    .sort((a, b) => b.percent - a.percent) // Leader first

  if (memberProgress.every((m) => m.total === 0)) return null

  return (
    <div className="glass rounded-apple-lg p-4">
      <h3 className="text-headline text-apple-primary mb-3">מירוץ האריזה 🧳</h3>
      <div className="flex flex-col gap-3">
        {memberProgress.map(({ member, packed, total, percent }, i) => (
          <div key={member.id} className="flex items-center gap-3">
            <FamilyAvatar memberId={member.id as FamilyMemberId} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-subhead text-apple-primary">{member.name}</span>
                <span className="text-caption text-apple-secondary">
                  {packed}/{total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    i === 0 ? 'bg-ios-green' : 'bg-ios-blue',
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.1 }}
                />
              </div>
            </div>
            {percent === 100 && <span className="text-body">✅</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
