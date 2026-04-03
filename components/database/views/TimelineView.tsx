'use client'

import { useMemo, useState } from 'react'
import { DatabaseProperty, DatabaseRow, DatabaseView, useDatabaseStore } from '@/lib/store/database-store'
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  differenceInDays,
  parseISO,
  isValid,
  isSameDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineViewProps {
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  view: DatabaseView
}

export function TimelineView({ properties, rows, view }: TimelineViewProps) {
  const { addRow, selectOptions } = useDatabaseStore()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [weeksToShow] = useState(4)

  // Find date property
  const dateProperty = properties.find(p => p.type === 'date')
  const titleProperty = properties.find(p => p.type === 'title')
  const groupByProperty = properties.find(p => p.id === view.group_by)

  // Calculate timeline range
  const timelineStart = startOfWeek(currentWeek)
  const timelineEnd = endOfWeek(addWeeks(currentWeek, weeksToShow - 1))
  const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd })

  // Get groups (lanes)
  const groups = useMemo(() => {
    if (!groupByProperty || (groupByProperty.type !== 'select' && groupByProperty.type !== 'multi_select')) {
      return [{ id: 'ungrouped', name: 'All Items', color: 'gray' }]
    }

    const options = selectOptions[groupByProperty.id] || []
    const grps = options.map(o => ({ id: o.id, name: o.name, color: o.color }))
    grps.unshift({ id: 'ungrouped', name: 'Ungrouped', color: 'gray' })
    return grps
  }, [groupByProperty, selectOptions])

  // Group rows and calculate positions
  const rowsWithPositions = useMemo(() => {
    if (!dateProperty) return {}

    const grouped: Record<string, Array<{
      row: DatabaseRow
      startDay: number
      duration: number
    }>> = {}

    groups.forEach(g => {
      grouped[g.id] = []
    })

    rows.forEach((row) => {
      const dateValue = row.properties[dateProperty.id]
      if (!dateValue) return

      const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue)
      if (!isValid(date)) return

      // Calculate position relative to timeline start
      const startDay = differenceInDays(date, timelineStart)
      if (startDay < 0 || startDay >= days.length) return

      // Default duration of 1 day (could be extended with end date property)
      const duration = 1

      // Determine group
      let groupId = 'ungrouped'
      if (groupByProperty) {
        const groupValue = row.properties[groupByProperty.id]
        if (groupValue && grouped[groupValue]) {
          groupId = groupValue
        }
      }

      grouped[groupId].push({ row, startDay, duration })
    })

    return grouped
  }, [rows, dateProperty, groupByProperty, groups, timelineStart, days.length])

  const colorClasses: Record<string, string> = {
    gray: 'bg-neutral-200 dark:bg-neutral-700',
    red: 'bg-red-400 dark:bg-red-600',
    orange: 'bg-orange-400 dark:bg-orange-600',
    yellow: 'bg-yellow-400 dark:bg-yellow-600',
    green: 'bg-green-400 dark:bg-green-600',
    blue: 'bg-blue-400 dark:bg-blue-600',
    purple: 'bg-purple-400 dark:bg-purple-600',
    pink: 'bg-pink-400 dark:bg-pink-600',
  }

  const dayWidth = 40 // pixels per day

  return (
    <div className="p-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <span className="text-sm text-neutral-500">
          {format(timelineStart, 'MMM d')} - {format(timelineEnd, 'MMM d, yyyy')}
        </span>
      </div>

      {!dateProperty && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          Add a Date property to use the Timeline view.
        </div>
      )}

      {/* Timeline */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-x-auto">
        <div style={{ minWidth: days.length * dayWidth + 200 }}>
          {/* Day Headers */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
            <div className="w-[200px] flex-shrink-0 px-3 py-2 border-r border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-medium text-neutral-500">Group</span>
            </div>
            <div className="flex">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  style={{ width: dayWidth }}
                  className={cn(
                    'flex-shrink-0 px-1 py-2 text-center text-xs border-r border-neutral-200 dark:border-neutral-700 last:border-r-0',
                    isSameDay(day, new Date()) && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div className="text-neutral-500">{format(day, 'EEE')}</div>
                  <div className={cn(
                    'font-medium',
                    isSameDay(day, new Date()) && 'text-blue-600 dark:text-blue-400'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Rows */}
          {groups.map((group) => {
            const groupRows = rowsWithPositions[group.id] || []

            return (
              <div key={group.id} className="flex border-b border-neutral-200 dark:border-neutral-700 last:border-b-0">
                <div className="w-[200px] flex-shrink-0 px-3 py-2 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
                  <span className="text-sm font-medium">{group.name}</span>
                  <span className="text-xs text-neutral-400 ml-2">({groupRows.length})</span>
                </div>
                <div className="relative flex-1 min-h-[60px]" style={{ width: days.length * dayWidth }}>
                  {/* Day Grid Lines */}
                  <div className="absolute inset-0 flex">
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        style={{ width: dayWidth }}
                        className={cn(
                          'flex-shrink-0 border-r border-neutral-100 dark:border-neutral-800 last:border-r-0',
                          isSameDay(day, new Date()) && 'bg-blue-50/50 dark:bg-blue-900/10'
                        )}
                      />
                    ))}
                  </div>

                  {/* Items */}
                  <div className="relative p-1">
                    {groupRows.map(({ row, startDay, duration }) => (
                      <div
                        key={row.id}
                        className={cn(
                          'absolute h-6 rounded px-2 text-xs text-white flex items-center cursor-pointer hover:opacity-80',
                          colorClasses[group.color] || colorClasses.blue
                        )}
                        style={{
                          left: startDay * dayWidth,
                          width: Math.max(duration * dayWidth - 4, dayWidth - 4),
                          top: 4,
                        }}
                      >
                        <span className="truncate">
                          {titleProperty ? row.properties[titleProperty.id] || 'Untitled' : 'Untitled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => {
          const props: Record<string, any> = {}
          if (dateProperty) {
            props[dateProperty.id] = new Date().toISOString()
          }
          addRow(props)
        }}
        className="flex items-center gap-2 mt-4 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
      >
        <Plus className="h-4 w-4" />
        <span>New item</span>
      </button>
    </div>
  )
}
