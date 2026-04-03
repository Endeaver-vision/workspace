'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useUIStore } from '@/lib/store/ui-store'
import { Page } from '@/types/database.types'
import { PageTreeItem } from './PageTreeItem'
import { FileText } from 'lucide-react'
import { createPortal } from 'react-dom'

// Drop position types
export type DropPosition = 'before' | 'inside' | 'after' | null

// Context for sharing drag state
interface DragState {
  draggedPage: Page | null
  overId: string | null
  dropPosition: DropPosition
}

const DragStateContext = createContext<{
  dragState: DragState
  setDraggedPage: (page: Page | null) => void
  setDropTarget: (id: string | null, position: DropPosition) => void
}>({
  dragState: { draggedPage: null, overId: null, dropPosition: null },
  setDraggedPage: () => {},
  setDropTarget: () => {},
})

export const useDragContext = () => useContext(DragStateContext)

interface PageTreeProps {
  pages: Page[]
  allPages: Page[]
  level?: number
  parentId?: string | null
}

export function PageTree({ pages, allPages, level = 0, parentId = null }: PageTreeProps) {
  const supabase = createClient() as any
  const { setPageExpanded } = useUIStore()
  const [dragState, setDragState] = useState<DragState>({
    draggedPage: null,
    overId: null,
    dropPosition: null,
  })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const setDraggedPage = useCallback((page: Page | null) => {
    setDragState(prev => ({ ...prev, draggedPage: page }))
  }, [])

  const setDropTarget = useCallback((id: string | null, position: DropPosition) => {
    setDragState(prev => ({ ...prev, overId: id, dropPosition: position }))
  }, [])

  // Check if targetId is a descendant of sourceId
  const isDescendant = useCallback((sourceId: string, targetId: string): boolean => {
    let current = allPages.find(p => p.id === targetId)
    while (current) {
      if (current.parent_id === sourceId) return true
      current = allPages.find(p => p.id === current?.parent_id)
    }
    return false
  }, [allPages])

  const handleDrop = useCallback(async () => {
    const { draggedPage, overId, dropPosition } = dragState

    console.log('handleDrop called with:', { draggedPage: draggedPage?.title, overId, dropPosition })

    if (!draggedPage || !overId || !dropPosition) {
      console.log('Early return - missing data')
      return
    }
    if (draggedPage.id === overId) {
      console.log('Early return - same page')
      return
    }
    if (isDescendant(draggedPage.id, overId)) {
      console.log('Early return - descendant')
      return
    }

    const overPage = allPages.find(p => p.id === overId)
    if (!overPage) {
      console.log('Early return - overPage not found')
      return
    }

    console.log('Proceeding with drop operation:', dropPosition)

    try {
      if (dropPosition === 'inside') {
        // Nest inside the target page
        await supabase
          .from('pages')
          .update({
            parent_id: overId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draggedPage.id)

        // Expand the target so user sees the nested page
        setPageExpanded(overId, true)
      } else {
        // Move before or after the target - just update parent_id to match target's parent
        const newParentId = overPage.parent_id

        await supabase
          .from('pages')
          .update({
            parent_id: newParentId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draggedPage.id)
      }

      // Refresh pages
      console.log('Refreshing pages...')
      await useWorkspaceStore.getState().loadPages()
      console.log('Pages refreshed successfully')
    } catch (error) {
      console.error('Failed to move page:', error)
    }
  }, [dragState, allPages, supabase, setPageExpanded, isDescendant])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.draggedPage) {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
  }, [dragState.draggedPage])

  const handleMouseUp = useCallback(async () => {
    console.log('MouseUp - dragState:', {
      draggedPage: dragState.draggedPage?.title,
      overId: dragState.overId,
      dropPosition: dragState.dropPosition
    })

    if (dragState.draggedPage && dragState.overId && dragState.dropPosition) {
      console.log('Executing drop...')
      await handleDrop()
      console.log('Drop complete')
    }
    setDragState({ draggedPage: null, overId: null, dropPosition: null })
  }, [dragState, handleDrop])

  // Get pages at this level
  const pagesAtLevel = pages
    .filter(p => p.parent_id === parentId)
    .sort((a, b) => (a.position || 0) - (b.position || 0))

  // Only wrap in context at root level
  if (level === 0) {
    return (
      <DragStateContext.Provider value={{ dragState, setDraggedPage, setDropTarget }}>
        <div
          className="space-y-0.5"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {pagesAtLevel.map((page) => (
            <PageTreeItem
              key={page.id}
              page={page}
              allPages={allPages}
              level={level}
            />
          ))}
        </div>

        {/* Drag preview - follows cursor */}
        {dragState.draggedPage && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed pointer-events-none z-[9999] flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: mousePos.x + 16,
              top: mousePos.y + 4,
              transform: 'rotate(-1deg)',
            }}
          >
            <span className="text-sm shrink-0">
              {dragState.draggedPage.icon || (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
            <span className="text-sm font-medium truncate max-w-[180px]">
              {dragState.draggedPage.title || 'Untitled'}
            </span>
          </div>,
          document.body
        )}
      </DragStateContext.Provider>
    )
  }

  // Nested levels - render children directly (context is already provided by root)
  return (
    <div className="space-y-0.5">
      {pagesAtLevel.map((page) => (
        <PageTreeItem
          key={page.id}
          page={page}
          allPages={allPages}
          level={level}
        />
      ))}
    </div>
  )
}
