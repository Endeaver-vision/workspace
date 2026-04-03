'use client'

import { useMemo, useState } from 'react'
import { DatabaseProperty, DatabaseRow, DatabaseView, useDatabaseStore } from '@/lib/store/database-store'
import { Plus, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BoardViewProps {
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  view: DatabaseView
}

function BoardCard({ row, properties, titleProperty }: {
  row: DatabaseRow
  properties: DatabaseProperty[]
  titleProperty: DatabaseProperty | undefined
}) {
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

  const title = titleProperty ? row.properties[titleProperty.id] || 'Untitled' : 'Untitled'

  // Get a few preview properties (excluding title and the group by property)
  const previewProperties = properties
    .filter(p => p.type !== 'title')
    .slice(0, 3)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow',
        isDragging && 'opacity-50'
      )}
    >
      <div className="font-medium text-sm mb-2">{title}</div>
      {previewProperties.map((prop) => {
        const value = row.properties[prop.id]
        if (!value) return null

        return (
          <div key={prop.id} className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="text-neutral-400 dark:text-neutral-500">{prop.name}: </span>
            <span>{String(value)}</span>
          </div>
        )
      })}
    </div>
  )
}

function BoardColumn({ column, rows, properties, titleProperty, onAddCard }: {
  column: { id: string; name: string; color: string }
  rows: DatabaseRow[]
  properties: DatabaseProperty[]
  titleProperty: DatabaseProperty | undefined
  onAddCard: () => void
}) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-neutral-100 dark:bg-neutral-800',
    red: 'bg-red-100 dark:bg-red-900/30',
    orange: 'bg-orange-100 dark:bg-orange-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    pink: 'bg-pink-100 dark:bg-pink-900/30',
  }

  const headerColorClasses: Record<string, string> = {
    gray: 'bg-neutral-200 dark:bg-neutral-700',
    red: 'bg-red-200 dark:bg-red-800',
    orange: 'bg-orange-200 dark:bg-orange-800',
    yellow: 'bg-yellow-200 dark:bg-yellow-800',
    green: 'bg-green-200 dark:bg-green-800',
    blue: 'bg-blue-200 dark:bg-blue-800',
    purple: 'bg-purple-200 dark:bg-purple-800',
    pink: 'bg-pink-200 dark:bg-pink-800',
  }

  return (
    <div className={cn('flex-shrink-0 w-72 rounded-lg', colorClasses[column.color] || colorClasses.gray)}>
      <div className={cn('flex items-center justify-between px-3 py-2 rounded-t-lg', headerColorClasses[column.color] || headerColorClasses.gray)}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{column.name}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-white/50 dark:bg-black/20 px-1.5 rounded">
            {rows.length}
          </span>
        </div>
        <button className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2 space-y-2 min-h-[100px]">
        <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {rows.map((row) => (
            <BoardCard
              key={row.id}
              row={row}
              properties={properties}
              titleProperty={titleProperty}
            />
          ))}
        </SortableContext>

        <button
          onClick={onAddCard}
          className="flex items-center gap-1 w-full px-2 py-1.5 text-sm text-neutral-500 hover:bg-white/50 dark:hover:bg-black/20 rounded"
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </button>
      </div>
    </div>
  )
}

export function BoardView({ properties, rows, view }: BoardViewProps) {
  const { selectOptions, addRow, updateRow } = useDatabaseStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const groupByProperty = properties.find(p => p.id === view.group_by)
  const titleProperty = properties.find(p => p.type === 'title')

  // Get columns from select options
  const columns = useMemo(() => {
    if (!groupByProperty || (groupByProperty.type !== 'select' && groupByProperty.type !== 'multi_select')) {
      return [{ id: 'ungrouped', name: 'No Status', color: 'gray' }]
    }

    const options = selectOptions[groupByProperty.id] || []
    const cols = options.map(o => ({ id: o.id, name: o.name, color: o.color }))

    // Add "No Status" column for items without a value
    cols.unshift({ id: 'ungrouped', name: 'No Status', color: 'gray' })

    return cols
  }, [groupByProperty, selectOptions])

  // Group rows by column
  const groupedRows = useMemo(() => {
    const groups: Record<string, DatabaseRow[]> = {}

    columns.forEach(col => {
      groups[col.id] = []
    })

    rows.forEach(row => {
      if (!groupByProperty) {
        groups['ungrouped'].push(row)
        return
      }

      const value = row.properties[groupByProperty.id]
      if (!value) {
        groups['ungrouped'].push(row)
      } else if (groups[value]) {
        groups[value].push(row)
      } else {
        groups['ungrouped'].push(row)
      }
    })

    return groups
  }, [rows, columns, groupByProperty])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !groupByProperty) return

    // Find which column the card was dropped into
    const activeRow = rows.find(r => r.id === active.id)
    if (!activeRow) return

    // Check if dropped over a column header or another card
    const overId = over.id as string
    let targetColumnId: string | null = null

    // If dropped over another card, find its column
    const overRow = rows.find(r => r.id === overId)
    if (overRow) {
      targetColumnId = overRow.properties[groupByProperty.id] || 'ungrouped'
    } else {
      // Dropped over a column
      targetColumnId = overId
    }

    if (targetColumnId && targetColumnId !== 'ungrouped') {
      updateRow(activeRow.id, { [groupByProperty.id]: targetColumnId })
    } else if (targetColumnId === 'ungrouped') {
      updateRow(activeRow.id, { [groupByProperty.id]: null })
    }
  }

  const handleAddCard = (columnId: string) => {
    const props: Record<string, any> = {}
    if (groupByProperty && columnId !== 'ungrouped') {
      props[groupByProperty.id] = columnId
    }
    addRow(props)
  }

  const activeRow = activeId ? rows.find(r => r.id === activeId) : null

  return (
    <div className="overflow-x-auto p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              rows={groupedRows[column.id] || []}
              properties={properties}
              titleProperty={titleProperty}
              onAddCard={() => handleAddCard(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeRow && (
            <BoardCard
              row={activeRow}
              properties={properties}
              titleProperty={titleProperty}
            />
          )}
        </DragOverlay>
      </DndContext>

      {!groupByProperty && (
        <div className="mt-4 text-sm text-neutral-500">
          Tip: Set a "Group by" property in the toolbar to organize cards into columns.
        </div>
      )}
    </div>
  )
}
