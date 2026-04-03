'use client'

import { useMemo } from 'react'
import { DatabaseProperty, DatabaseRow, DatabaseView, useDatabaseStore } from '@/lib/store/database-store'
import { Plus, Image as ImageIcon } from 'lucide-react'

interface GalleryViewProps {
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  view: DatabaseView
}

function GalleryCard({ row, properties, titleProperty }: {
  row: DatabaseRow
  properties: DatabaseProperty[]
  titleProperty: DatabaseProperty | undefined
}) {
  const title = titleProperty ? row.properties[titleProperty.id] || 'Untitled' : 'Untitled'

  // Find image property (url type that looks like an image)
  const imageProperty = properties.find(p => p.type === 'url')
  const imageUrl = imageProperty ? row.properties[imageProperty.id] : null

  // Get preview properties (excluding title and image)
  const previewProperties = properties
    .filter(p => p.type !== 'title' && p.id !== imageProperty?.id)
    .slice(0, 3)

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      {/* Image/Cover */}
      <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm mb-2 truncate">{title}</h3>

        {previewProperties.map((prop) => {
          const value = row.properties[prop.id]
          if (!value) return null

          return (
            <div key={prop.id} className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 truncate">
              <span className="text-neutral-400 dark:text-neutral-500">{prop.name}: </span>
              <span>{String(value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GalleryView({ properties, rows, view }: GalleryViewProps) {
  const { addRow } = useDatabaseStore()

  const titleProperty = properties.find(p => p.type === 'title')

  // Apply filters and sorts
  const filteredRows = useMemo(() => {
    let result = [...rows]

    // Apply filters
    view.filters.forEach((filter) => {
      const property = properties.find(p => p.id === filter.property_id)
      if (!property) return

      result = result.filter((row) => {
        const value = row.properties[filter.property_id]
        const filterValue = filter.value

        switch (filter.operator) {
          case 'equals':
            return value === filterValue
          case 'not_equals':
            return value !== filterValue
          case 'contains':
            return String(value || '').toLowerCase().includes(String(filterValue).toLowerCase())
          case 'not_contains':
            return !String(value || '').toLowerCase().includes(String(filterValue).toLowerCase())
          case 'is_empty':
            return value === null || value === undefined || value === ''
          case 'is_not_empty':
            return value !== null && value !== undefined && value !== ''
          default:
            return true
        }
      })
    })

    // Apply sorts
    view.sorts.forEach((sort) => {
      result.sort((a, b) => {
        const aVal = a.properties[sort.property_id]
        const bVal = b.properties[sort.property_id]

        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sort.direction === 'asc' ? comparison : -comparison
      })
    })

    return result
  }, [rows, view.filters, view.sorts, properties])

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRows.map((row) => (
          <GalleryCard
            key={row.id}
            row={row}
            properties={properties}
            titleProperty={titleProperty}
          />
        ))}

        {/* Add Card */}
        <button
          onClick={() => addRow({})}
          className="aspect-video bg-neutral-50 dark:bg-neutral-800/50 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm">Add new</span>
        </button>
      </div>
    </div>
  )
}
