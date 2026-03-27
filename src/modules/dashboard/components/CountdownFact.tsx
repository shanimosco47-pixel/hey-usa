import { Lightbulb } from 'lucide-react'
import { USA_FACTS } from '../data/usaFacts'

export function CountdownFact() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  )
  const fact = USA_FACTS[dayOfYear % USA_FACTS.length]

  return (
    <div className="glass rounded-apple-lg p-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ios-orange/10">
        <Lightbulb className="h-5 w-5 text-ios-orange" />
      </div>
      <div>
        <p className="text-caption text-apple-secondary mb-1">הידעת? 🇺🇸</p>
        <p className="text-body text-apple-primary">{fact}</p>
      </div>
    </div>
  )
}
