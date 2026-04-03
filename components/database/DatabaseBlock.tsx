'use client'

import { useEffect } from 'react'
import { useDatabaseStore } from '@/lib/store/database-store'
import { DatabaseHeader } from './DatabaseHeader'
import { DatabaseToolbar } from './DatabaseToolbar'
import { TableView } from './views/TableView'
import { BoardView } from './views/BoardView'
import { CalendarView } from './views/CalendarView'
import { GalleryView } from './views/GalleryView'
import { TimelineView } from './views/TimelineView'
import { ListView } from './views/ListView'
import { Loader2 } from 'lucide-react'

interface DatabaseBlockProps {
  databaseId: string
  isInline?: boolean
}

export function DatabaseBlock({ databaseId, isInline = false }: DatabaseBlockProps) {
  const {
    database,
    properties,
    rows,
    views,
    activeViewId,
    isLoading,
    error,
    loadDatabase,
  } = useDatabaseStore()

  useEffect(() => {
    loadDatabase(databaseId)
  }, [databaseId, loadDatabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        Error loading database: {error}
      </div>
    )
  }

  if (!database) {
    return (
      <div className="py-8 text-center text-neutral-500">
        Database not found
      </div>
    )
  }

  const activeView = views.find(v => v.id === activeViewId) || views[0]

  const renderView = () => {
    if (!activeView) return null

    const viewProps = {
      properties,
      rows,
      view: activeView,
    }

    switch (activeView.type) {
      case 'table':
        return <TableView {...viewProps} />
      case 'board':
        return <BoardView {...viewProps} />
      case 'calendar':
        return <CalendarView {...viewProps} />
      case 'gallery':
        return <GalleryView {...viewProps} />
      case 'timeline':
        return <TimelineView {...viewProps} />
      case 'list':
        return <ListView {...viewProps} />
      default:
        return <TableView {...viewProps} />
    }
  }

  return (
    <div className={isInline ? 'my-4' : ''}>
      <DatabaseHeader
        database={database}
        views={views}
        activeViewId={activeViewId}
        isInline={isInline}
      />
      {activeView && (
        <DatabaseToolbar
          view={activeView}
          properties={properties}
        />
      )}
      <div className="mt-2">
        {renderView()}
      </div>
    </div>
  )
}
