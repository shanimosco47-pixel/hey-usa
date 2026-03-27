import { CountdownFact } from './CountdownFact'
import { PackingRace } from './PackingRace'
import { TripAchievements } from './TripAchievements'
import type { ReactNode } from 'react'

interface ParentDashboardProps {
  attentionSection: ReactNode
  nextStopSection: ReactNode
  weatherSection: ReactNode
}

export function ParentDashboard({
  attentionSection,
  nextStopSection,
  weatherSection,
}: ParentDashboardProps) {
  return (
    <div className="flex flex-col gap-4">
      {attentionSection}
      {nextStopSection}
      {weatherSection}
      <CountdownFact />
      <PackingRace />
      <TripAchievements />
    </div>
  )
}
