'use client'

import { createReactBlockSpec } from '@blocknote/react'
import { defaultProps } from '@blocknote/core'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ToggleBlock = createReactBlockSpec(
  {
    type: 'toggle',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      backgroundColor: defaultProps.backgroundColor,
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const [isOpen, setIsOpen] = useState(false)

      return (
        <div className="my-1">
          <div className="flex items-start gap-1">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'flex-shrink-0 mt-1 p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform',
                isOpen && 'rotate-90'
              )}
            >
              <ChevronRight className="h-4 w-4 text-neutral-500" />
            </button>
            <div
              className="flex-1 min-w-0"
              ref={props.contentRef}
            />
          </div>
          {isOpen && (
            <div className="ml-6 pl-2 border-l-2 border-neutral-200 dark:border-neutral-700 mt-1">
              {/* Child content would go here - for now just placeholder */}
              <div className="text-sm text-neutral-500 py-1">
                Toggle content (nested blocks coming in Phase 2)
              </div>
            </div>
          )}
        </div>
      )
    },
  }
)

export const toggleBlockConfig = {
  type: 'toggle' as const,
}
