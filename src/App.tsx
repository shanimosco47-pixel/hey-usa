import { lazy, Suspense, useState, useCallback, Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppDataProvider, useAppData } from '@/contexts/AppDataContext'
import { ToastProvider } from '@/components/shared/ToastContext'
import { MapMotiProvider } from '@/contexts/MapMotiContext'
import { ToastContainer } from '@/components/shared/Toast'
import AppShell from '@/components/layout/AppShell'
import SplashScreen from '@/components/shared/SplashScreen'
import NotFoundPage from '@/components/shared/NotFoundPage'
import { PageErrorBoundary } from '@/components/shared/PageErrorBoundary'
import { PageSkeleton } from '@/components/shared/PageSkeleton'

// Lazy-load SearchDialog — only needed on Cmd+K interaction
const SearchDialog = lazy(() =>
  import('@/components/shared/SearchDialog').then((m) => ({ default: m.SearchDialog })),
)

// Auth screens (small, loaded eagerly for fast first paint)
import { PinScreen } from '@/modules/auth/PinScreen'
import { FamilySelectScreen } from '@/modules/auth/FamilySelectScreen'

// Error boundary for lazy-loaded chunks that fail to load
class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch() {
    // Chunk load failure — reload once to get fresh assets
    const key = 'hey-usa-chunk-reload'
    const last = sessionStorage.getItem(key)
    const now = Date.now()
    // Only auto-reload if we haven't reloaded in the last 10 seconds
    if (!last || now - Number(last) > 10_000) {
      sessionStorage.setItem(key, String(now))
      window.location.reload()
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-bold text-apple-primary">שגיאה בטעינת העמוד</p>
          <button
            onClick={() => {
              sessionStorage.removeItem('hey-usa-chunk-reload')
              window.location.reload()
            }}
            className="rounded-apple bg-ios-blue px-4 py-2 text-sm font-medium text-white"
          >
            רענן את הדף
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Lazy-loaded module pages
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'))
const TasksPage = lazy(() => import('@/modules/tasks/TasksPage'))
const ItineraryPage = lazy(() => import('@/modules/itinerary/ItineraryPage'))
const DocumentsPage = lazy(() => import('@/modules/documents/DocumentsPage'))
const MapPage = lazy(() => import('@/modules/map/MapPage'))
const PhotosPage = lazy(() => import('@/modules/photos/PhotosPage'))
const BlogPage = lazy(() => import('@/modules/blog/BlogPage'))
const BudgetPage = lazy(() => import('@/modules/budget/BudgetPage'))
const EntertainmentPage = lazy(() => import('@/modules/entertainment/EntertainmentPage'))
const PackingPage = lazy(() => import('@/modules/packing/PackingPage'))
const ChatPage = lazy(() => import('@/modules/chat/ChatPage'))
const MotiLogPage = lazy(() => import('@/modules/chat/MotiLogPage'))
const OAuthCallbackPage = lazy(() => import('@/modules/auth/OAuthCallbackPage'))
const LocationsPage = lazy(() => import('@/modules/locations/LocationsPage'))
const LocationHubPage = lazy(() => import('@/modules/locations/LocationHubPage'))
const NotesPage = lazy(() => import('@/modules/notes/NotesPage'))
const CampsitesPage = lazy(() => import('@/modules/campsites/CampsitesPage'))
const CampsitesPageV2 = lazy(() => import('@/modules/campsites/CampsitesPageV2'))

function LoadingFallback() {
  return <PageSkeleton variant="list" className="min-h-[50vh]" />
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentMember } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (!currentMember) {
    return <Navigate to="/auth/select" replace />
  }

  return <>{children}</>
}

/**
 * Inner app — rendered inside AppDataProvider so it can read isLoading.
 *
 * Routes always render behind the splash (so lazy chunks pre-load).
 * The splash overlay stays on screen until BOTH:
 *   1. The 2.5s animation timer has elapsed
 *   2. Supabase data has finished loading
 *
 * The SplashScreen component receives `dataReady` — when false it
 * keeps looping the animation instead of triggering exit.
 */
function AppInner() {
  const { isLoading } = useAppData()
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashFinished = useCallback(() => setSplashDone(true), [])

  return (
    <>
      {/* Routes render behind splash so lazy chunks start loading */}
      <ChunkErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth routes */}
            <Route
              path="/auth"
              element={
                <PageErrorBoundary>
                  <PinScreen />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/auth/select"
              element={
                <PageErrorBoundary>
                  <FamilySelectScreen />
                </PageErrorBoundary>
              }
            />
            <Route
              path="oauth/callback"
              element={
                <PageErrorBoundary>
                  <OAuthCallbackPage />
                </PageErrorBoundary>
              }
            />

            {/* Protected app routes */}
            <Route
              element={
                <AuthGuard>
                  <AppShell />
                </AuthGuard>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="itinerary" element={<ItineraryPage />} />
              <Route path="itinerary/:day" element={<ItineraryPage />} />
              <Route path="campsites" element={<CampsitesPageV2 />} />
              <Route path="campsites/old" element={<CampsitesPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="photos" element={<PhotosPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/new" element={<BlogPage />} />
              <Route path="blog/:id" element={<BlogPage />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="entertainment" element={<EntertainmentPage />} />
              <Route path="packing" element={<PackingPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="locations/:locationId" element={<LocationHubPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="chat/log" element={<MotiLogPage />} />
            </Route>

            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>

      {/* Global search (Cmd+K) — lazy-loaded */}
      <Suspense fallback={null}>
        <SearchDialog />
      </Suspense>

      {/* Splash overlay — stays until data is ready */}
      {!splashDone && <SplashScreen onFinished={handleSplashFinished} dataReady={!isLoading} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/hey-usa">
      <AuthProvider>
        <ToastProvider>
          <AppDataProvider>
            <MapMotiProvider>
              <AppInner />
            </MapMotiProvider>
          </AppDataProvider>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
