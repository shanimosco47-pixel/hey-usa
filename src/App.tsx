import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/layout/AppShell'

// Auth screens (small, loaded eagerly for fast first paint)
import PinScreen from '@/screens/PinScreen'
import FamilySelectScreen from '@/screens/FamilySelectScreen'

// Lazy-loaded module pages
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'))
const TasksPage = lazy(() => import('@/modules/tasks/TasksPage'))
const ItineraryPage = lazy(() => import('@/modules/itinerary/ItineraryPage'))
const DocumentsPage = lazy(() => import('@/modules/documents/DocumentsPage'))
const MapPage = lazy(() => import('@/modules/map/MapPage'))
const PhotosPage = lazy(() => import('@/modules/photos/PhotosPage'))
const BlogPage = lazy(() => import('@/modules/blog/BlogPage'))
const BudgetPage = lazy(() => import('@/modules/budget/BudgetPage'))
const EntertainmentPage = lazy(
  () => import('@/modules/entertainment/EntertainmentPage'),
)
const PackingPage = lazy(() => import('@/modules/packing/PackingPage'))

function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/[0.06] border-t-ios-blue" />
    </div>
  )
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

export default function App() {
  return (
    <BrowserRouter basename="/hey-usa">
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<PinScreen />} />
            <Route path="/auth/select" element={<FamilySelectScreen />} />

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
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="photos" element={<PhotosPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="blog/new" element={<BlogPage />} />
              <Route path="blog/:id" element={<BlogPage />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="entertainment" element={<EntertainmentPage />} />
              <Route path="packing" element={<PackingPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
