"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends Omit<ProgressPrimitive.Root.Props, 'value'> {
  value?: number | null
  className?: string
}

function Progress({ className, value, ...props }: ProgressProps) {
  const actualValue = value ?? 0
  return (
    <ProgressPrimitive.Root
      value={actualValue}
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="h-full w-full">
        <ProgressPrimitive.Indicator
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${actualValue}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
