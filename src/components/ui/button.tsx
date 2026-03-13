import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-apple text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-ios-blue text-white shadow-sm hover:bg-ios-blue/90 hover:shadow-md',
        destructive: 'bg-ios-red text-white shadow-sm hover:bg-ios-red/90',
        outline: 'border border-black/[0.08] bg-white/60 backdrop-blur-sm hover:bg-white/80 text-apple-primary',
        secondary: 'bg-black/[0.05] text-apple-primary hover:bg-black/[0.08]',
        ghost: 'hover:bg-black/[0.04] text-apple-secondary hover:text-apple-primary',
        link: 'text-ios-blue underline-offset-4 hover:underline',
        success: 'bg-ios-green text-white shadow-sm hover:bg-ios-green/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-apple-sm px-3 text-xs',
        lg: 'h-12 rounded-apple-lg px-6 text-base',
        icon: 'h-9 w-9 rounded-apple',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
