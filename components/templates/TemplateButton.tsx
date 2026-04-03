'use client'

import { useState } from 'react'
import { useTemplateStore, Template } from '@/lib/store/template-store'
import { Plus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateButtonProps {
  templateId?: string
  template?: Template
  label?: string
  onUse: (content: any) => void
  variant?: 'default' | 'inline' | 'compact'
  className?: string
}

export function TemplateButton({
  templateId,
  template: propTemplate,
  label,
  onUse,
  variant = 'default',
  className,
}: TemplateButtonProps) {
  const { templates, useTemplate } = useTemplateStore()
  const [isLoading, setIsLoading] = useState(false)

  const template = propTemplate || templates.find((t) => t.id === templateId)

  const handleClick = async () => {
    if (!template) return

    setIsLoading(true)
    try {
      const result = await useTemplate(template.id)
      if (result) {
        onUse(result)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const buttonLabel = label || template?.name || 'New from template'

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading || !template}
        className={cn(
          'inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline text-sm',
          isLoading && 'opacity-50 cursor-wait',
          !template && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {template?.icon && <span>{template.icon}</span>}
        <span>{buttonLabel}</span>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading || !template}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 text-sm rounded-md',
          'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700',
          'transition-colors',
          isLoading && 'opacity-50 cursor-wait',
          !template && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {template?.icon ? (
          <span>{template.icon}</span>
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        <span>{buttonLabel}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || !template}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-blue-600 text-white hover:bg-blue-700',
        'transition-colors',
        isLoading && 'opacity-50 cursor-wait',
        !template && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {template?.icon ? (
        <span className="text-lg">{template.icon}</span>
      ) : (
        <Plus className="h-4 w-4" />
      )}
      <span>{buttonLabel}</span>
    </button>
  )
}

// Multi-template button with dropdown
interface TemplateButtonGroupProps {
  templates: Template[]
  onUse: (content: any) => void
  label?: string
  className?: string
}

export function TemplateButtonGroup({
  templates,
  onUse,
  label = 'New from template',
  className,
}: TemplateButtonGroupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { useTemplate } = useTemplateStore()

  const handleSelect = async (template: Template) => {
    setIsOpen(false)
    const result = await useTemplate(template.id)
    if (result) {
      onUse(result)
    }
  }

  if (templates.length === 0) {
    return null
  }

  if (templates.length === 1) {
    return (
      <TemplateButton
        template={templates[0]}
        onUse={onUse}
        className={className}
      />
    )
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-20">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
              >
                {template.icon ? (
                  <span className="text-lg w-6 text-center">{template.icon}</span>
                ) : (
                  <Plus className="h-4 w-4 text-neutral-400" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{template.name}</div>
                  {template.description && (
                    <div className="text-xs text-neutral-500 truncate">
                      {template.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
