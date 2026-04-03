'use client'

import { Template, useTemplateStore } from '@/lib/store/template-store'
import { FileText, Database, Rows3, MoreHorizontal, Copy, Trash2, Eye, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface TemplateCardProps {
  template: Template
  onSelect?: (template: Template) => void
  onEdit?: (template: Template) => void
  onPreview?: (template: Template) => void
  showActions?: boolean
  isCompact?: boolean
}

export function TemplateCard({
  template,
  onSelect,
  onEdit,
  onPreview,
  showActions = true,
  isCompact = false,
}: TemplateCardProps) {
  const { duplicateTemplate, deleteTemplate } = useTemplateStore()
  const [showMenu, setShowMenu] = useState(false)

  const typeIcons = {
    page: FileText,
    database: Database,
    database_row: Rows3,
  }

  const typeLabels = {
    page: 'Page',
    database: 'Database',
    database_row: 'Row',
  }

  const TypeIcon = typeIcons[template.type]

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    await duplicateTemplate(template.id)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    if (confirm(`Delete "${template.name}"?`)) {
      await deleteTemplate(template.id)
    }
  }

  if (isCompact) {
    return (
      <button
        onClick={() => onSelect?.(template)}
        className="flex items-center gap-3 w-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left transition-colors"
      >
        <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
          {template.icon ? (
            <span className="text-lg">{template.icon}</span>
          ) : (
            <TypeIcon className="h-4 w-4 text-neutral-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{template.name}</div>
          {template.description && (
            <div className="text-xs text-neutral-500 truncate">{template.description}</div>
          )}
        </div>
        <span className="text-xs text-neutral-400 flex-shrink-0">
          {typeLabels[template.type]}
        </span>
      </button>
    )
  }

  return (
    <div
      onClick={() => onSelect?.(template)}
      className={cn(
        'group relative bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700',
        'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all cursor-pointer'
      )}
    >
      {/* Cover/Preview */}
      <div className="h-32 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-700 dark:to-neutral-800 rounded-t-lg flex items-center justify-center">
        {template.cover_url ? (
          <img
            src={template.cover_url}
            alt={template.name}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : template.icon ? (
          <span className="text-4xl">{template.icon}</span>
        ) : (
          <TypeIcon className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{template.name}</h3>
            {template.description && (
              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              template.type === 'page' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
              template.type === 'database' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
              template.type === 'database_row' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            )}
          >
            {typeLabels[template.type]}
          </span>
          {template.use_count > 0 && (
            <span className="text-xs text-neutral-400">
              Used {template.use_count}x
            </span>
          )}
          {template.is_public && (
            <span className="text-xs text-neutral-400">Public</span>
          )}
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-neutral-400">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 bg-white dark:bg-neutral-800 rounded-md shadow-sm border border-neutral-200 dark:border-neutral-600 opacity-0 group-hover:opacity-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-20">
                  {onPreview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        onPreview(template)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        onEdit(template)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
