'use client'

import { useMemo, useState } from 'react'
import { DatabaseProperty, DatabaseRow, DatabaseView, useDatabaseStore } from '@/lib/store/database-store'
import { CellRenderer } from '../cells'
import { Plus, ChevronRight, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ListViewProps {
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  view: DatabaseView
}

function ListItem({ row, properties, titleProperty, onUpdateRow, onDeleteRow }: {
  row: DatabaseRow
  properties: DatabaseProperty[]
  titleProperty: DatabaseProperty | undefined
  onUpdateRow: (rowId: string, propertyId: string, value: any) => void
  onDeleteRow: (rowId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Get non-title properties for expanded view
  const otherProperties = properties.filter(p => p.type !== 'title')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 group',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-neutral-400" />
        </button>

        {/* Expand Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-transform',
            isExpanded && 'rotate-90'
          )}
        >
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        </button>

        {/* Title */}
        <div className="flex-1">
          {titleProperty ? (
            <CellRenderer
              property={titleProperty}
              value={row.properties[titleProperty.id]}
              rowId={row.id}
              onChange={(value) => onUpdateRow(row.id, titleProperty.id, value)}
            />
          ) : (
            <span className="text-neutral-500">Untitled</span>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDeleteRow(row.id)}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded Properties */}
      {isExpanded && (
        <div className="pl-14 pr-4 pb-3 space-y-2">
          {otherProperties.map((property) => (
            <div key={property.id} className="flex items-start gap-4">
              <span className="text-sm text-neutral-500 w-32 flex-shrink-0 pt-1">
                {property.name}
              </span>
              <div className="flex-1">
                <CellRenderer
                  property={property}
                  value={row.properties[property.id]}
                  rowId={row.id}
                  onChange={(value) => onUpdateRow(row.id, property.id, value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ListView({ properties, rows, view }: ListViewProps) {
  const { updateRow, deleteRow, addRow } = useDatabaseStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = (event: DragEndEvent) => {
    // Row reordering logic would go here
  }

  const handleUpdateRow = (rowId: string, propertyId: string, value: any) => {
    updateRow(rowId, { [propertyId]: value })
  }

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredRows.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {filteredRows.map((row) => (
            <ListItem
              key={row.id}
              row={row}
              properties={properties}
              titleProperty={titleProperty}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={deleteRow}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Row Button */}
      <button
        onClick={() => addRow({})}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      >
        <Plus className="h-4 w-4" />
        <span>New</span>
      </button>
    </div>
  )
}
