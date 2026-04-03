'use client'

import { useEffect, useMemo } from 'react'
import { Template, useTemplateStore } from '@/lib/store/template-store'
import { TemplateCard } from './TemplateCard'
import { Search, Filter, Plus, FileText, Database, Rows3, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateGalleryProps {
  workspaceId: string
  onSelect?: (template: Template) => void
  onEdit?: (template: Template) => void
  onCreateNew?: () => void
  showCreateButton?: boolean
  filterType?: 'all' | 'page' | 'database' | 'database_row'
}

export function TemplateGallery({
  workspaceId,
  onSelect,
  onEdit,
  onCreateNew,
  showCreateButton = true,
  filterType,
}: TemplateGalleryProps) {
  const {
    templates,
    categories,
    isLoading,
    error,
    typeFilter,
    categoryFilter,
    searchQuery,
    loadTemplates,
    loadCategories,
    setTypeFilter,
    setCategoryFilter,
    setSearchQuery,
    getFilteredTemplates,
  } = useTemplateStore()

  useEffect(() => {
    loadTemplates(workspaceId)
    loadCategories(workspaceId)
  }, [workspaceId, loadTemplates, loadCategories])

  // Apply prop-based filter if provided
  useEffect(() => {
    if (filterType) {
      setTypeFilter(filterType)
    }
  }, [filterType, setTypeFilter])

  const filteredTemplates = getFilteredTemplates()

  const typeOptions = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'page', label: 'Pages', icon: FileText },
    { value: 'database', label: 'Databases', icon: Database },
    { value: 'database_row', label: 'Rows', icon: Rows3 },
  ]

  // Group by category for display
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, { name: string; templates: Template[] }> = {}

    // Initialize groups
    categories.forEach((cat) => {
      groups[cat.id] = { name: cat.name, templates: [] }
    })
    groups['uncategorized'] = { name: 'Uncategorized', templates: [] }

    // Group templates
    filteredTemplates.forEach((template) => {
      const groupId = template.category || 'uncategorized'
      if (groups[groupId]) {
        groups[groupId].templates.push(template)
      } else {
        groups['uncategorized'].templates.push(template)
      }
    })

    // Filter empty groups and sort
    return Object.entries(groups)
      .filter(([_, group]) => group.templates.length > 0)
      .sort(([a], [b]) => {
        if (a === 'uncategorized') return 1
        if (b === 'uncategorized') return -1
        return 0
      })
  }, [filteredTemplates, categories])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => loadTemplates(workspaceId)}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Templates</h2>
        {showCreateButton && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type Filter */}
        {!filterType && (
          <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            {typeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTypeFilter(option.value as any)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
                    typeFilter === option.value
                      ? 'bg-white dark:bg-neutral-700 shadow-sm'
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
          <Folder className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600" />
          <h3 className="mt-4 font-medium">No templates found</h3>
          <p className="text-sm text-neutral-500 mt-1">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first template to get started'}
          </p>
          {showCreateButton && !searchQuery && (
            <button
              onClick={onCreateNew}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Templates Grid */}
      {groupedTemplates.length > 0 && (
        <div className="space-y-8">
          {groupedTemplates.map(([categoryId, group]) => (
            <div key={categoryId}>
              {/* Category Header */}
              {categoryId !== 'uncategorized' && (
                <h3 className="text-sm font-medium text-neutral-500 mb-3">
                  {group.name}
                </h3>
              )}

              {/* Templates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={onSelect}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
