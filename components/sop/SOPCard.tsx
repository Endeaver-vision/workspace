'use client'

import { useRouter } from 'next/navigation'
import { FileText, MoreHorizontal, Archive, Trash2, Edit } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SOP } from '@/types/training.types'
import { cn } from '@/lib/utils'

interface SOPCardProps {
  sop: SOP
  workspaceId: string
  onArchive?: (sopId: string) => void
  onDelete?: (sopId: string) => void
}

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export function SOPCard({ sop, workspaceId, onArchive, onDelete }: SOPCardProps) {
  const router = useRouter()
  const sopUrl = `/${workspaceId}/sop/${sop.id}`

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown or its children
    const target = e.target as HTMLElement
    if (target.closest('[data-radix-collection-item]') || target.closest('[role="menu"]')) {
      return
    }
    router.push(sopUrl)
  }

  return (
    <Card
      className="group hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <h3 className="font-medium truncate">{sop.title || 'Untitled'}</h3>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 w-8 opacity-0 group-hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-accent"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(sopUrl)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sop.status !== 'archived' && onArchive && (
                <DropdownMenuItem onClick={() => onArchive(sop.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(sop.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {sop.category && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            {sop.category.icon && <span>{sop.category.icon}</span>}
            <span className="truncate">{sop.category.name}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
        <Badge
          variant="secondary"
          className={cn('text-xs', statusColors[sop.status])}
        >
          {sop.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          v{sop.version}
        </span>
      </CardFooter>
    </Card>
  )
}
