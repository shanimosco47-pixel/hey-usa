import { ChevronDown } from 'lucide-react'

export function DriveSegment() {

  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex flex-col items-center gap-0">
        {/* Dashed line top */}
        <div className="h-3 w-px border-r border-dashed border-brown-light/30" />

        {/* Icon circle */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky/10">
            <ChevronDown className="h-3.5 w-3.5 text-sky" />
          </div>
        </div>

        {/* Dashed line bottom */}
        <div className="h-3 w-px border-r border-dashed border-brown-light/30" />
      </div>
    </div>
  )
}
