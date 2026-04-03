'use client'

import { useEffect, useState } from 'react'
import { useCollaborationStore } from '@/lib/store/collaboration-store'
import { CommentThread } from './CommentThread'
import { CommentInput } from './CommentInput'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentPopoverProps {
  pageId: string
  userId: string
  workspaceId?: string
  blockId?: string
  className?: string
}

export function CommentPopover({
  pageId,
  userId,
  workspaceId,
  blockId,
  className,
}: CommentPopoverProps) {
  const [open, setOpen] = useState(false)
  const { comments, loadComments, isLoadingComments } = useCollaborationStore()

  // Filter comments for this block if blockId provided
  const filteredComments = blockId
    ? comments.filter((c) => c.block_id === blockId)
    : comments

  const unresolvedCount = filteredComments.filter((c) => !c.is_resolved).length

  useEffect(() => {
    if (open) {
      loadComments(pageId)
    }
  }, [open, pageId, loadComments])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'relative inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground',
          className
        )}
      >
        <MessageSquare className="h-4 w-4" />
        {unresolvedCount > 0 && (
          <span className="text-xs">{unresolvedCount}</span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h4 className="font-medium">
            Comments
            {unresolvedCount > 0 && (
              <span className="ml-1 text-muted-foreground">
                ({unresolvedCount} unresolved)
              </span>
            )}
          </h4>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="p-4 space-y-3">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading comments...
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground text-sm">
                No comments yet. Start the conversation!
              </div>
            ) : (
              filteredComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  pageId={pageId}
                  userId={userId}
                  workspaceId={workspaceId}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <CommentInput
            pageId={pageId}
            userId={userId}
            workspaceId={workspaceId}
            blockId={blockId}
            placeholder="Add a comment..."
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
