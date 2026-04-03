'use client'

import { useMemo, useState } from 'react'
import { DatabaseProperty, DatabaseRow, DatabaseView, useDatabaseStore } from '@/lib/store/database-store'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isValid,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  view: DatabaseView
}

export function CalendarView({ properties, rows, view }: CalendarViewProps) {
  const { addRow } = useDatabaseStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Find date properties
  const dateProperty = properties.find(p => p.type === 'date')
  const titleProperty = properties.find(p => p.type === 'title')

  // Get days for the calendar grid
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Group rows by date
  const rowsByDate = useMemo(() => {
    const grouped: Record<string, DatabaseRow[]> = {}

    if (!dateProperty) return grouped

    rows.forEach((row) => {
      const dateValue = row.properties[dateProperty.id]
      if (!dateValue) return

      const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue)
      if (!isValid(date)) return

      const key = format(date, 'yyyy-MM-dd')
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(row)
    })

    return grouped
  }, [rows, dateProperty])

  const handleAddOnDate = (date: Date) => {
    if (!dateProperty) return

    addRow({
      [dateProperty.id]: date.toISOString(),
    })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!dateProperty && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          Add a Date property to use the Calendar view.
        </div>
      )}

      {/* Calendar Grid */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-sm font-medium text-neutral-500">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayRows = rowsByDate[dateKey] || []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={idx}
                className={cn(
                  'min-h-[100px] border-b border-r border-neutral-200 dark:border-neutral-700 p-1 group',
                  !isCurrentMonth && 'bg-neutral-50 dark:bg-neutral-900/50',
                  isToday && 'bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm w-6 h-6 flex items-center justify-center rounded-full',
                      isToday && 'bg-blue-600 text-white',
                      !isCurrentMonth && 'text-neutral-400'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dateProperty && (
                    <button
                      onClick={() => handleAddOnDate(day)}
                      className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                    >
                      <Plus className="h-4 w-4 text-neutral-400" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayRows.slice(0, 3).map((row) => (
                    <div
                      key={row.id}
                      className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50"
                    >
                      {titleProperty ? row.properties[titleProperty.id] || 'Untitled' : 'Untitled'}
                    </div>
                  ))}
                  {dayRows.length > 3 && (
                    <div className="text-xs text-neutral-500 px-1.5">
                      +{dayRows.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
