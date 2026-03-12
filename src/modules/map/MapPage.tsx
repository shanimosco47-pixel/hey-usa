import { Map } from 'lucide-react'

export default function MapPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#4a90d9]/10">
        <Map className="h-10 w-10 text-[#4a90d9]" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-brown">מפה</h1>
      <p className="mt-1 text-sm text-brown-light">Map</p>
      <div className="mt-6 rounded-xl bg-[#4a90d9]/5 px-6 py-3">
        <p className="text-sm font-medium text-[#4a90d9]">...בקרוב</p>
      </div>
    </div>
  )
}
