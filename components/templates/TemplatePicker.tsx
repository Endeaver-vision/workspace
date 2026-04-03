'use client'

import { useEffect, useState } from 'react'
import { useTemplateStore, Template } from '@/lib/store/template-store'
import { TemplateCard } from './TemplateCard'
import { X, Search, FileText, Database, Rows3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplatePickerProps {
  workspaceId: string
  filterType?: 'page' | 'database' | 'database_row'
  onSelect: (template: Template) => void
  onClose: () => void
  title?: string
}

export function TemplatePicker({
  workspaceId,
  filterType,
  onSelect,
  onClose,
  title = 'Choose a template',
}: TemplatePickerProps) {
  const {
    templates,
    isLoading,
    loadTemplates,
    setTypeFilter,
    setSearchQuery,
    getFilteredTemplates,
  } = useTemplateStore()

  const [localSearch, setLocalSearch] = useState('')
  const [localType, setLocalType] = useState<'all' | 'page' | 'database' | 'database_row'>(
    filterType || 'all'
  )

  useEffect(() => {
    loadTemplates(workspaceId)
  }, [workspaceId, loadTemplates])

  useEffect(() => {
    setSearchQuery(localSearch)
  }, [localSearch, setSearchQuery])

  useEffect(() => {
    setTypeFilter(localType)
  }, [localType, setTypeFilter])

  const filteredTemplates = getFilteredTemplates()

  const typeButtons = [
    { value: 'all', label: 'All', icon: null },
    { value: 'page', label: 'Pages', icon: FileText },
    { value: 'database', label: 'Databases', icon: Database },
    { value: 'database_row', label: 'Rows', icon: Rows3 },
  ]

  const handleSelect = (template: Template) => {
    onSelect(template)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Type Tabs */}
          {!filterType && (
            <div className="flex gap-2">
              {typeButtons.map((btn) => {
                const Icon = btn.icon
                return (
                  <button
                    key={btn.value}
                    onClick={() => setLocalType(btn.value as any)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
                      localType === btn.value
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{btn.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600" />
              <h3 className="mt-4 font-medium">No templates found</h3>
              <p className="text-sm text-neutral-500 mt-1">
                {localSearch
                  ? 'Try a different search term'
                  : 'Create a template first to use it here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelect}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <span className="text-sm text-neutral-500">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
