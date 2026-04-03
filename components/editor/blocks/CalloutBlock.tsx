'use client'

import { createReactBlockSpec } from '@blocknote/react'
import { defaultProps } from '@blocknote/core'
import { cn } from '@/lib/utils'

const CALLOUT_VARIANTS = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    icon: '💡',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    icon: '⚠️',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    icon: '❌',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    icon: '✅',
  },
  note: {
    bg: 'bg-neutral-50 dark:bg-neutral-900',
    border: 'border-neutral-200 dark:border-neutral-800',
    icon: '📝',
  },
}

export const CalloutBlock = createReactBlockSpec(
  {
    type: 'callout',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      backgroundColor: defaultProps.backgroundColor,
      icon: {
        default: '💡',
      },
      variant: {
        default: 'info' as const,
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const variant = (props.block.props.variant as keyof typeof CALLOUT_VARIANTS) || 'info'
      const variantStyles = CALLOUT_VARIANTS[variant] || CALLOUT_VARIANTS.info
      const icon = props.block.props.icon || variantStyles.icon

      return (
        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border my-2',
            variantStyles.bg,
            variantStyles.border
          )}
        >
          <span className="text-xl select-none flex-shrink-0 mt-0.5">{icon}</span>
          <div
            className="flex-1 min-w-0"
            ref={props.contentRef}
          />
        </div>
      )
    },
  }
)

export const calloutBlockConfig = {
  type: 'callout' as const,
}
