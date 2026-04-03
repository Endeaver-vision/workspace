'use client'

import { useState } from 'react'
import { DatabaseView, DatabaseProperty, useDatabaseStore, FilterRule, SortRule } from '@/lib/store/database-store'
import {
  Filter,
  ArrowUpDown,
  Layers,
  Search,
  Plus,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatabaseToolbarProps {
  view: DatabaseView
  properties: DatabaseProperty[]
}

const filterOperators = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
]

export function DatabaseToolbar({ view, properties }: DatabaseToolbarProps) {
  const { addFilter, updateFilter, removeFilter, addSort, removeSort, setGroupBy, addRow } = useDatabaseStore()
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showGroupMenu, setShowGroupMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleAddFilter = async (propertyId: string) => {
    await addFilter(view.id, {
      property_id: propertyId,
      operator: 'contains',
      value: '',
    })
    setShowFilterMenu(false)
  }

  const handleRemoveFilter = async (filterId: string) => {
    await removeFilter(view.id, filterId)
  }

  const handleUpdateFilter = async (filterId: string, updates: Partial<FilterRule>) => {
    await updateFilter(view.id, filterId, updates)
  }

  const handleAddSort = async (propertyId: string) => {
    await addSort(view.id, {
      property_id: propertyId,
      direction: 'asc',
    })
    setShowSortMenu(false)
  }

  const handleRemoveSort = async (sortId: string) => {
    await removeSort(view.id, sortId)
  }

  const handleToggleSortDirection = async (sort: SortRule) => {
    // Remove and re-add with opposite direction
    await removeSort(view.id, sort.id)
    await addSort(view.id, {
      property_id: sort.property_id,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  const handleSetGroupBy = async (propertyId: string | null) => {
    await setGroupBy(view.id, propertyId)
    setShowGroupMenu(false)
  }

  const groupByProperty = properties.find(p => p.id === view.group_by)

  return (
    <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800',
              view.filters.length > 0 && 'text-blue-600 dark:text-blue-400'
            )}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {view.filters.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1.5 rounded text-xs">
                {view.filters.length}
              </span>
            )}
          </button>

          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase">
                  Add filter
                </div>
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => handleAddFilter(prop.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {prop.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort Button */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800',
              view.sorts.length > 0 && 'text-blue-600 dark:text-blue-400'
            )}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort</span>
            {view.sorts.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1.5 rounded text-xs">
                {view.sorts.length}
              </span>
            )}
          </button>

          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase">
                  Add sort
                </div>
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => handleAddSort(prop.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {prop.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Group By Button (for board/timeline views) */}
        {(view.type === 'board' || view.type === 'timeline') && (
          <div className="relative">
            <button
              onClick={() => setShowGroupMenu(!showGroupMenu)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800',
                view.group_by && 'text-blue-600 dark:text-blue-400'
              )}
            >
              <Layers className="h-4 w-4" />
              <span>Group by</span>
              {groupByProperty && (
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1.5 rounded text-xs">
                  {groupByProperty.name}
                </span>
              )}
            </button>

            {showGroupMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowGroupMenu(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => handleSetGroupBy(null)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    No grouping
                  </button>
                  {properties
                    .filter(p => p.type === 'select' || p.type === 'multi_select' || p.type === 'person')
                    .map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => handleSetGroupBy(prop.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        {prop.name}
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-sm rounded border border-neutral-200 dark:border-neutral-700 ml-auto">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-transparent outline-none w-40"
          />
        </div>

        {/* New Button */}
        <button
          onClick={() => addRow({})}
          className="flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </button>
      </div>

      {/* Active Filters */}
      {view.filters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {view.filters.map((filter) => {
            const property = properties.find(p => p.id === filter.property_id)
            return (
              <div
                key={filter.id}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 rounded"
              >
                <span className="font-medium">{property?.name}</span>
                <select
                  value={filter.operator}
                  onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value })}
                  className="bg-transparent outline-none text-neutral-600 dark:text-neutral-400"
                >
                  {filterOperators.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                  <input
                    type="text"
                    value={filter.value as string || ''}
                    onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value"
                    className="bg-transparent outline-none w-24 border-b border-neutral-300 dark:border-neutral-600"
                  />
                )}
                <button
                  onClick={() => handleRemoveFilter(filter.id)}
                  className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Active Sorts */}
      {view.sorts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {view.sorts.map((sort) => {
            const property = properties.find(p => p.id === sort.property_id)
            return (
              <div
                key={sort.id}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 rounded"
              >
                <span className="font-medium">{property?.name}</span>
                <button
                  onClick={() => handleToggleSortDirection(sort)}
                  className="px-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                >
                  {sort.direction === 'asc' ? '↑' : '↓'}
                </button>
                <button
                  onClick={() => handleRemoveSort(sort.id)}
                  className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
