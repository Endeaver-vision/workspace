'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useCollaborationStore, Comment } from '@/lib/store/collaboration-store'
import { CommentInput } from './CommentInput'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Check,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2,
} from 'lucide-react'

interface CommentThreadProps {
  comment: Comment
  pageId: string
  userId: string
  workspaceId?: string
}

export function CommentThread({
  comment,
  pageId,
  userId,
  workspaceId,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { deleteComment, resolveComment, updateComment } = useCollaborationStore()

  const isAuthor = comment.user_id === userId
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  })

  const handleDelete = () => {
    if (confirm('Delete this comment?')) {
      deleteComment(comment.id)
    }
  }

  const handleResolve = () => {
    resolveComment(comment.id, userId)
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        comment.is_resolved && 'opacity-60'
      )}
    >
      {/* Comment header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.user?.avatar_url} />
            <AvatarFallback className="text-xs">
              {comment.user?.full_name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {comment.user?.full_name || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsReplying(true)}>
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </DropdownMenuItem>
            {!comment.is_resolved && (
              <DropdownMenuItem onClick={handleResolve}>
                <Check className="mr-2 h-4 w-4" />
                Resolve
              </DropdownMenuItem>
            )}
            {isAuthor && (
              <>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Comment content */}
      <div className="mt-2">
        {isEditing ? (
          <EditComment
            comment={comment}
            onCancel={() => setIsEditing(false)}
            onSave={(content) => {
              updateComment(comment.id, { content })
              setIsEditing(false)
            }}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>

      {/* Resolved badge */}
      {comment.is_resolved && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="h-3 w-3" />
          Resolved
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l-2 pl-3">
          {comment.replies.map((reply) => (
            <CommentReply
              key={reply.id}
              reply={reply}
              userId={userId}
              onDelete={() => deleteComment(reply.id)}
            />
          ))}
        </div>
      )}

      {/* Reply input */}
      {isReplying && (
        <div className="mt-3 border-t pt-3">
          <CommentInput
            pageId={pageId}
            userId={userId}
            workspaceId={workspaceId}
            parentId={comment.id}
            onCancel={() => setIsReplying(false)}
            onSuccess={() => setIsReplying(false)}
            placeholder="Write a reply..."
            autoFocus
          />
        </div>
      )}

      {/* Reply button when no replies */}
      {!isReplying && (!comment.replies || comment.replies.length === 0) && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 text-muted-foreground"
          onClick={() => setIsReplying(true)}
        >
          <MessageSquare className="mr-1 h-3 w-3" />
          Reply
        </Button>
      )}
    </div>
  )
}

function CommentReply({
  reply,
  userId,
  onDelete,
}: {
  reply: Comment
  userId: string
  onDelete: () => void
}) {
  const isAuthor = reply.user_id === userId
  const timeAgo = formatDistanceToNow(new Date(reply.created_at), {
    addSuffix: true,
  })

  return (
    <div className="group">
      <div className="flex items-start gap-2">
        <Avatar className="h-5 w-5">
          <AvatarImage src={reply.user?.avatar_url} />
          <AvatarFallback className="text-xs">
            {reply.user?.full_name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {reply.user?.full_name || 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm">{reply.content}</p>
        </div>
        {isAuthor && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

function EditComment({
  comment,
  onCancel,
  onSave,
}: {
  comment: Comment
  onCancel: () => void
  onSave: (content: string) => void
}) {
  const [content, setContent] = useState(comment.content)

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full min-h-[60px] rounded-md border bg-background p-2 text-sm"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(content)}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
