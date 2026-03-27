// src/components/shared/PageSkeleton.tsx
import { Skeleton } from '@/components/shared/Skeleton'
import { cn } from '@/lib/cn'

interface PageSkeletonProps {
  variant: 'list' | 'grid' | 'detail' | 'tabs'
  className?: string
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass rounded-apple-lg p-4 flex items-center gap-3">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-apple-lg p-4 flex flex-col gap-3">
          <Skeleton variant="rect" height={100} />
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton variant="text" width="40%" height={28} />
      <Skeleton variant="rect" height={200} />
      <Skeleton variant="text" lines={3} />
    </div>
  )
}

function TabsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rect" width={80} height={36} className="rounded-apple" />
        ))}
      </div>
      <ListSkeleton />
    </div>
  )
}

const variants = {
  list: ListSkeleton,
  grid: GridSkeleton,
  detail: DetailSkeleton,
  tabs: TabsSkeleton,
} as const

export function PageSkeleton({ variant, className }: PageSkeletonProps) {
  const Component = variants[variant]
  return (
    <div className={cn('p-4', className)}>
      <Component />
    </div>
  )
}
