'use client'

import { useState, useMemo } from 'react'
import { DatabaseProperty, DatabaseRow, DatabaseView, useDatabaseStore, PropertyType } from '@/lib/store/database-store'
import { CellRenderer } from '../cells'
import { Plus, GripVertical, ChevronDown, Trash2 } from 'lucide-react'
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

interface TableViewProps {
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  view: DatabaseView
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-select' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
]

function SortableRow({ row, properties, onUpdateRow, onDeleteRow }: {
  row: DatabaseRow
  properties: DatabaseProperty[]
  onUpdateRow: (rowId: string, propertyId: string, value: any) => void
  onDeleteRow: (rowId: string) => void
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
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group"
    >
      <td className="w-8 px-2 py-1 text-center">
        <button
          {...attributes}
          {...listeners}
          className="p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-neutral-400" />
        </button>
      </td>
      {properties.map((property) => (
        <td key={property.id} className="px-1 py-0.5 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
          <CellRenderer
            property={property}
            value={row.properties[property.id]}
            rowId={row.id}
            onChange={(value) => onUpdateRow(row.id, property.id, value)}
          />
        </td>
      ))}
      <td className="w-8 px-2 py-1">
        <button
          onClick={() => onDeleteRow(row.id)}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

function ColumnHeader({ property, onUpdateProperty, onDeleteProperty }: {
  property: DatabaseProperty
  onUpdateProperty: (updates: Partial<DatabaseProperty>) => void
  onDeleteProperty: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(property.name)

  const handleSubmit = () => {
    if (name.trim() && name !== property.name) {
      onUpdateProperty({ name: name.trim() })
    }
    setIsEditing(false)
  }

  return (
    <th className="relative px-2 py-2 text-left text-sm font-medium text-neutral-600 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 bg-neutral-50 dark:bg-neutral-900">
      <div className="flex items-center gap-1">
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') {
                setName(property.name)
                setIsEditing(false)
              }
            }}
            className="flex-1 bg-transparent outline-none border-b border-blue-500"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            {property.name}
          </span>
        )}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded opacity-0 group-hover:opacity-100"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
            <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase">Property type</div>
            {propertyTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  onUpdateProperty({ type: type.value })
                  setShowMenu(false)
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  property.type === type.value && 'text-blue-600 dark:text-blue-400'
                )}
              >
                {type.label}
              </button>
            ))}
            <div className="border-t border-neutral-200 dark:border-neutral-700 mt-1 pt-1">
              <button
                onClick={() => {
                  onDeleteProperty()
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Trash2 className="h-4 w-4" />
                Delete property
              </button>
            </div>
          </div>
        </>
      )}
    </th>
  )
}

export function TableView({ properties, rows, view }: TableViewProps) {
  const { updateRow, deleteRow, addRow, addProperty, updateProperty, deleteProperty } = useDatabaseStore()
  const [showAddProperty, setShowAddProperty] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
          case 'greater_than':
            return Number(value) > Number(filterValue)
          case 'less_than':
            return Number(value) < Number(filterValue)
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

  const handleAddProperty = async (type: PropertyType) => {
    await addProperty({
      name: `Property ${properties.length + 1}`,
      type,
      config: {},
    })
    setShowAddProperty(false)
  }

  return (
    <div className="overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="group">
              <th className="w-8 bg-neutral-50 dark:bg-neutral-900"></th>
              {properties.map((property) => (
                <ColumnHeader
                  key={property.id}
                  property={property}
                  onUpdateProperty={(updates) => updateProperty(property.id, updates)}
                  onDeleteProperty={() => deleteProperty(property.id)}
                />
              ))}
              <th className="w-8 bg-neutral-50 dark:bg-neutral-900 relative">
                <button
                  onClick={() => setShowAddProperty(!showAddProperty)}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                >
                  <Plus className="h-4 w-4 text-neutral-400" />
                </button>

                {showAddProperty && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAddProperty(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                      {propertyTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => handleAddProperty(type.value)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={filteredRows.map(r => r.id)} strategy={verticalListSortingStrategy}>
              {filteredRows.map((row) => (
                <SortableRow
                  key={row.id}
                  row={row}
                  properties={properties}
                  onUpdateRow={handleUpdateRow}
                  onDeleteRow={deleteRow}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>

      {/* Add Row Button */}
      <button
        onClick={() => addRow({})}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800"
      >
        <Plus className="h-4 w-4" />
        <span>New</span>
      </button>
    </div>
  )
}
