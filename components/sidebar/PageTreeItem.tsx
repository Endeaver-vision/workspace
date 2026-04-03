'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useNavigationStore } from '@/lib/store/navigation-store'
import { Page } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ChevronRight,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
  Copy,
  Link,
  Star,
  ArrowRight,
  Home,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDragContext, DropPosition } from './PageTree'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
const DRAG_THRESHOLD = 5 // pixels before drag starts

interface PageTreeItemProps {
  page: Page
  allPages: Page[]
  level: number
}

export function PageTreeItem({
  page,
  allPages,
  level,
}: PageTreeItemProps) {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient() as any
  const { currentWorkspace } = useWorkspaceStore()
  const { expandedPages, togglePageExpanded, setPageExpanded } = useUIStore()
  const { toggleFavorite, favorites, loadFavorites } = useNavigationStore()
  const [isHovered, setIsHovered] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  // Drag state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [hasDragStarted, setHasDragStarted] = useState(false)
  const [justFinishedDrag, setJustFinishedDrag] = useState(false)

  // Drag context
  const { dragState, setDraggedPage, setDropTarget } = useDragContext()
  const isDragging = dragState.draggedPage?.id === page.id
  const isDropTarget = dragState.overId === page.id
  const dropPosition = isDropTarget ? dragState.dropPosition : null

  const children = allPages.filter((p) => p.parent_id === page.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedPages[page.id] ?? false
  const isActive = params.pageId === page.id
  const isFavorited = favorites.some((f) => f.id === page.id)

  // Check if this page is a descendant of the dragged page
  const isDescendantOfDragged = useCallback(() => {
    if (!dragState.draggedPage) return false
    let current: Page | undefined = page
    while (current) {
      if (current.parent_id === dragState.draggedPage.id) return true
      current = allPages.find(p => p.id === current?.parent_id)
    }
    return false
  }, [dragState.draggedPage, page, allPages])

  const canBeDropTarget = dragState.draggedPage && !isDragging && !isDescendantOfDragged()

  // Get other pages that can be move targets (not self, not descendants)
  const getMoveTargets = () => {
    const descendants = new Set<string>()
    const findDescendants = (parentId: string) => {
      allPages.filter(p => p.parent_id === parentId).forEach(p => {
        descendants.add(p.id)
        findDescendants(p.id)
      })
    }
    findDescendants(page.id)

    return allPages.filter(p =>
      p.id !== page.id &&
      !descendants.has(p.id) &&
      p.id !== page.parent_id
    )
  }

  const handleClick = () => {
    if (currentWorkspace && !dragState.draggedPage && !justFinishedDrag) {
      router.push(`/${currentWorkspace.id}/${page.id}`)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    togglePageExpanded(page.id)
  }

  const handleCreateSubpage = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!currentWorkspace) return

    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: currentWorkspace.id,
        parent_id: page.id,
        title: 'Untitled',
        created_by: TEST_USER_ID,
        content: {},
      })
      .select()
      .single()

    if (data && !error) {
      setPageExpanded(page.id, true)
      useWorkspaceStore.getState().loadPages()
      router.push(`/${currentWorkspace.id}/${data.id}`)
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase
      .from('pages')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', page.id)

    if (!error) {
      useWorkspaceStore.getState().removePage(page.id)
      if (isActive && currentWorkspace) {
        router.push(`/${currentWorkspace.id}`)
      }
    }
  }

  const handleDuplicate = async () => {
    if (!currentWorkspace) return

    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: currentWorkspace.id,
        parent_id: page.parent_id,
        title: `${page.title} (copy)`,
        icon: page.icon,
        content: page.content,
        created_by: TEST_USER_ID,
      })
      .select()
      .single()

    if (data && !error) {
      useWorkspaceStore.getState().loadPages()
      router.push(`/${currentWorkspace.id}/${data.id}`)
    }
  }

  const handleCopyLink = () => {
    if (currentWorkspace) {
      const url = `${window.location.origin}/${currentWorkspace.id}/${page.id}`
      navigator.clipboard.writeText(url)
    }
  }

  const handleMoveTo = async (targetPageId: string | null) => {
    const { error } = await supabase
      .from('pages')
      .update({
        parent_id: targetPageId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)

    if (!error) {
      useWorkspaceStore.getState().loadPages()
      if (targetPageId) {
        setPageExpanded(targetPageId, true)
      }
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleFavorite(TEST_USER_ID, page.id)
    if (currentWorkspace) {
      loadFavorites(TEST_USER_ID, currentWorkspace.id)
    }
  }

  // Calculate drop position from mouse Y
  const calculateDropPosition = (e: React.MouseEvent): DropPosition => {
    const rect = rowRef.current?.getBoundingClientRect()
    if (!rect) return 'inside'

    const y = e.clientY - rect.top
    const height = rect.height
    const percentage = y / height

    // More forgiving zones: 20% top, 60% middle, 20% bottom
    if (percentage < 0.2) return 'before'
    if (percentage > 0.8) return 'after'
    return 'inside'
  }

  // Drag handlers with threshold
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on buttons or dropdown
    if ((e.target as HTMLElement).closest('button')) return

    e.preventDefault()
    setDragStart({ x: e.clientX, y: e.clientY })
    setHasDragStarted(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Check if we should start dragging (threshold)
    if (dragStart && !hasDragStarted) {
      const dx = Math.abs(e.clientX - dragStart.x)
      const dy = Math.abs(e.clientY - dragStart.y)
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        setHasDragStarted(true)
        setDraggedPage(page)
      }
    }

    // Update drop position while hovering during drag
    if (canBeDropTarget) {
      setDropTarget(page.id, calculateDropPosition(e))
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true)
    if (canBeDropTarget) {
      setDropTarget(page.id, calculateDropPosition(e))
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Clean up drag state on mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragStart || hasDragStarted) {
        setDragStart(null)
        // If we were actually dragging, set cooldown to prevent accidental clicks
        if (hasDragStarted) {
          setJustFinishedDrag(true)
          setTimeout(() => setJustFinishedDrag(false), 200)
        }
        setHasDragStarted(false)
      }
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [dragStart, hasDragStarted])

  const moveTargets = getMoveTargets()

  return (
    <div className="relative">
      {/* Drop indicator: BEFORE */}
      <div
        className={cn(
          'absolute -top-[1px] left-2 right-2 h-0.5 rounded-full z-50 pointer-events-none transition-all duration-150',
          dropPosition === 'before'
            ? 'bg-blue-500 opacity-100 scale-x-100'
            : 'bg-transparent opacity-0 scale-x-50'
        )}
      />

      {/* Main item */}
      <div
        ref={rowRef}
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 mx-1 rounded-md relative transition-all duration-150',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800/50',
          isActive && 'bg-neutral-100 dark:bg-neutral-800/50',
          isDragging && 'opacity-30 scale-[0.98]',
          // Drop highlight
          dropPosition === 'inside' && 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400 ring-inset',
          // Hover during drag
          canBeDropTarget && 'bg-neutral-50 dark:bg-neutral-800/30',
          // Cursor - pointer for clickable, grabbing only during active drag
          dragState.draggedPage ? 'cursor-grabbing' : 'cursor-pointer'
        )}
        style={{ paddingLeft: level * 16 + 8 }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Drag handle - visible on hover */}
        <div className={cn(
          'absolute left-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity',
          isHovered && !dragState.draggedPage && 'opacity-40'
        )} style={{ left: level * 16 + 2 }}>
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Expand/collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-5 w-5 shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-700',
            !hasChildren && 'invisible'
          )}
          onClick={handleToggle}
        >
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              isExpanded && 'rotate-90'
            )}
          />
        </Button>

        {/* Icon */}
        <span className="text-base shrink-0 select-none">
          {page.icon || <FileText className="h-4 w-4 text-muted-foreground" />}
        </span>

        {/* Title */}
        <span className="flex-1 truncate text-sm select-none ml-1">
          {page.title || 'Untitled'}
        </span>

        {/* Actions (hidden when dragging or just finished dragging) */}
        {!dragState.draggedPage && !justFinishedDrag && (
          <div
            className={cn(
              'flex items-center gap-0.5 opacity-0 transition-opacity duration-150',
              (isHovered || isActive) && 'opacity-100'
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={handleToggleFavorite}>
                  <Star
                    className={cn(
                      'h-4 w-4 mr-2',
                      isFavorited && 'fill-yellow-400 text-yellow-400'
                    )}
                  />
                  {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Move to submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Move to...
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48 max-h-64 overflow-y-auto">
                    {page.parent_id && (
                      <>
                        <DropdownMenuItem onClick={() => handleMoveTo(null)}>
                          <Home className="h-4 w-4 mr-2" />
                          Top level
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {moveTargets.length > 0 ? (
                      moveTargets.slice(0, 10).map((target) => (
                        <DropdownMenuItem
                          key={target.id}
                          onClick={() => handleMoveTo(target.id)}
                        >
                          <span className="mr-2">{target.icon || '📄'}</span>
                          <span className="truncate">{target.title || 'Untitled'}</span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No other pages
                      </div>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              onClick={handleCreateSubpage}
              title="Add subpage"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Drop indicator: AFTER */}
      <div
        className={cn(
          'absolute -bottom-[1px] left-2 right-2 h-0.5 rounded-full z-50 pointer-events-none transition-all duration-150',
          dropPosition === 'after'
            ? 'bg-blue-500 opacity-100 scale-x-100'
            : 'bg-transparent opacity-0 scale-x-50'
        )}
      />

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {children
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((childPage) => (
              <PageTreeItem
                key={childPage.id}
                page={childPage}
                allPages={allPages}
                level={level + 1}
              />
            ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{page.title || 'Untitled'}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the page to trash. You can restore it later from the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
