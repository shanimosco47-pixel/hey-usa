import { Link } from 'react-router-dom'
import { Home, MapPinOff } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass rounded-apple-lg p-10 shadow-sm max-w-sm w-full">
        <MapPinOff className="mx-auto h-14 w-14 text-apple-tertiary/40" />
        <h1 className="mt-6 text-2xl font-bold text-apple-primary">הדף לא נמצא</h1>
        <p className="mt-2 text-sm text-apple-secondary leading-relaxed">
          הדף שחיפשת לא קיים או שהועבר
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-apple bg-ios-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ios-blue/90"
        >
          <Home className="h-4 w-4" />
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
