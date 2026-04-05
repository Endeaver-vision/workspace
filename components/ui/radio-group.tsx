"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends RadioGroupPrimitive.Props {
  className?: string
  value?: string
  onValueChange?: (value: string) => void
}

function RadioGroup({
  className,
  value,
  onValueChange,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      value={value}
      onValueChange={onValueChange}
      {...props}
    />
  )
}

interface RadioGroupItemProps extends Radio.Root.Props {
  className?: string
  value: string
  id?: string
}

function RadioGroupItem({ className, value, id, ...props }: RadioGroupItemProps) {
  return (
    <Radio.Root
      data-slot="radio-group-item"
      value={value}
      id={id}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <Radio.Indicator className="flex items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-primary" />
      </Radio.Indicator>
    </Radio.Root>
  )
}

export { RadioGroup, RadioGroupItem }
