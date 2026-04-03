'use client'

import { createReactBlockSpec } from '@blocknote/react'
import { cn } from '@/lib/utils'

export const DividerBlock = createReactBlockSpec(
  {
    type: 'divider',
    propSchema: {
      variant: {
        default: 'solid' as const,
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const variant = props.block.props.variant || 'solid'

      const variantStyles = {
        solid: 'border-t border-neutral-200 dark:border-neutral-700',
        dashed: 'border-t border-dashed border-neutral-200 dark:border-neutral-700',
        dotted: 'border-t border-dotted border-neutral-200 dark:border-neutral-700',
        thick: 'border-t-2 border-neutral-300 dark:border-neutral-600',
        gradient: 'h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-600 to-transparent',
      }

      return (
        <div
          className={cn(
            'my-4 w-full',
            variantStyles[variant as keyof typeof variantStyles] || variantStyles.solid
          )}
          contentEditable={false}
        />
      )
    },
  }
)

export const dividerBlockConfig = {
  type: 'divider' as const,
}
