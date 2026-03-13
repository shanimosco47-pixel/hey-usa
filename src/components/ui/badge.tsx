import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-ios-blue/10 text-ios-blue',
        secondary: 'bg-black/[0.05] text-apple-secondary',
        success: 'bg-ios-green/10 text-ios-green',
        warning: 'bg-ios-orange/10 text-ios-orange',
        destructive: 'bg-ios-red/10 text-ios-red',
        purple: 'bg-ios-purple/10 text-ios-purple',
        outline: 'border border-black/[0.08] text-apple-secondary bg-white/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
