import { CountdownFact } from './CountdownFact'
import { PackingRace } from './PackingRace'
import { TripAchievements } from './TripAchievements'
import { Link } from 'react-router-dom'
import { MessageCircle, Gamepad2 } from 'lucide-react'

export function KidsDashboard() {
  return (
    <div className="flex flex-col gap-4">
      <CountdownFact />
      <PackingRace />
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/chat"
          className="glass rounded-apple-lg p-4 flex flex-col items-center gap-2 card-hover"
        >
          <MessageCircle className="h-8 w-8 text-ios-blue" />
          <span className="text-subhead text-apple-primary">שאלו את מוטי!</span>
        </Link>
        <Link
          to="/entertainment"
          className="glass rounded-apple-lg p-4 flex flex-col items-center gap-2 card-hover"
        >
          <Gamepad2 className="h-8 w-8 text-ios-purple" />
          <span className="text-subhead text-apple-primary">משחקים וטריוויה</span>
        </Link>
      </div>
      <TripAchievements />
    </div>
  )
}
