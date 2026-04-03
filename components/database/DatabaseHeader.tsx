'use client'

import { useState } from 'react'
import { Database, DatabaseView, ViewType, useDatabaseStore } from '@/lib/store/database-store'
import {
  Table2,
  Kanban,
  Calendar,
  LayoutGrid,
  GanttChart,
  List,
  Plus,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatabaseHeaderProps {
  database: Database
  views: DatabaseView[]
  activeViewId: string | null
  isInline?: boolean
}

const viewIcons: Record<ViewType, React.ElementType> = {
  table: Table2,
  board: Kanban,
  calendar: Calendar,
  gallery: LayoutGrid,
  timeline: GanttChart,
  list: List,
}

const viewLabels: Record<ViewType, string> = {
  table: 'Table',
  board: 'Board',
  calendar: 'Calendar',
  gallery: 'Gallery',
  timeline: 'Timeline',
  list: 'List',
}

export function DatabaseHeader({ database, views, activeViewId, isInline }: DatabaseHeaderProps) {
  const { setActiveView, updateDatabase, addView } = useDatabaseStore()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(database.title)
  const [showViewMenu, setShowViewMenu] = useState(false)

  const handleTitleSubmit = () => {
    if (title.trim() && title !== database.title) {
      updateDatabase({ title: title.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleAddView = async (type: ViewType) => {
    await addView(type, `${viewLabels[type]} view`)
    setShowViewMenu(false)
  }

  return (
    <div className={cn('border-b border-neutral-200 dark:border-neutral-800', isInline && 'border-t')}>
      {/* Database Title */}
      <div className="flex items-center gap-2 px-4 py-3">
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit()
              if (e.key === 'Escape') {
                setTitle(database.title)
                setIsEditingTitle(false)
              }
            }}
            className="flex-1 bg-transparent text-xl font-semibold outline-none"
            autoFocus
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 cursor-pointer text-xl font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 -mx-1"
          >
            {database.title}
          </h2>
        )}
        <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
          <MoreHorizontal className="h-5 w-5 text-neutral-500" />
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {views.map((view) => {
          const Icon = viewIcons[view.type]
          const isActive = view.id === activeViewId
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{view.name}</span>
            </button>
          )
        })}

        {/* Add View Button */}
        <div className="relative">
          <button
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
          >
            <Plus className="h-4 w-4" />
          </button>

          {showViewMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowViewMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1">
                {(Object.keys(viewIcons) as ViewType[]).map((type) => {
                  const Icon = viewIcons[type]
                  return (
                    <button
                      key={type}
                      onClick={() => handleAddView(type)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{viewLabels[type]}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
