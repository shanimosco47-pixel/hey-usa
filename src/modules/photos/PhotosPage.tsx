import { Camera } from 'lucide-react'

export default function PhotosPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e8735e]/10">
        <Camera className="h-10 w-10 text-[#e8735e]" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-brown">תמונות</h1>
      <p className="mt-1 text-sm text-brown-light">Photos</p>
      <div className="mt-6 rounded-xl bg-[#e8735e]/5 px-6 py-3">
        <p className="text-sm font-medium text-[#e8735e]">...בקרוב</p>
      </div>
    </div>
  )
}
