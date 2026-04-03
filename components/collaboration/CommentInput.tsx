'use client'

import { useState } from 'react'
import { useCollaborationStore } from '@/lib/store/collaboration-store'
import { MentionInput } from './MentionInput'
import { Button } from '@/components/ui/button'
import { Send, X } from 'lucide-react'

interface CommentInputProps {
  pageId: string
  userId: string
  workspaceId?: string
  blockId?: string
  parentId?: string
  onCancel?: () => void
  onSuccess?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentInput({
  pageId,
  userId,
  workspaceId,
  blockId,
  parentId,
  onCancel,
  onSuccess,
  placeholder,
  autoFocus,
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addComment } = useCollaborationStore()

  const handleChange = (value: string, mentions: string[]) => {
    setContent(value)
    setMentionedUsers(mentions)
  }

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      await addComment({
        page_id: pageId,
        block_id: blockId,
        user_id: userId,
        parent_id: parentId,
        content: content.trim(),
        mentioned_users: mentionedUsers,
      })

      setContent('')
      setMentionedUsers([])
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasContent = content.trim().length > 0

  return (
    <div className="space-y-2">
      <MentionInput
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        workspaceId={workspaceId}
        autoFocus={autoFocus}
        onSubmit={handleSubmit}
      />

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!hasContent || isSubmitting}
        >
          <Send className="mr-1 h-4 w-4" />
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
