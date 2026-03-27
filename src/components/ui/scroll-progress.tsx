"use client"

import { motion, useScroll, type MotionProps } from "framer-motion"

import { cn } from "@/lib/cn"

interface ScrollProgressProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  keyof MotionProps
> {
  ref?: React.Ref<HTMLDivElement>
}

export function ScrollProgress({
  className,
  ref,
  ...props
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      ref={ref}
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-px origin-left",
        className
      )}
      style={{
        scaleX: scrollYProgress,
        background: "linear-gradient(to right, #A97CF8, #F38CB8, #FDCC92)",
      }}
      {...props}
    />
  )
}
