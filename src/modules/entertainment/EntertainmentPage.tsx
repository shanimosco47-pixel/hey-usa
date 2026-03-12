import { Music } from 'lucide-react'

export default function EntertainmentPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#6c5ce7]/10">
        <Music className="h-10 w-10 text-[#6c5ce7]" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-brown">בידור</h1>
      <p className="mt-1 text-sm text-brown-light">Entertainment</p>
      <div className="mt-6 rounded-xl bg-[#6c5ce7]/5 px-6 py-3">
        <p className="text-sm font-medium text-[#6c5ce7]">...בקרוב</p>
      </div>
    </div>
  )
}
