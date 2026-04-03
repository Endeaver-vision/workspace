'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MentionInputProps {
  value: string
  onChange: (value: string, mentionedUsers: string[]) => void
  placeholder?: string
  className?: string
  workspaceId?: string
  autoFocus?: boolean
  onSubmit?: () => void
}

interface User {
  id: string
  full_name: string
  avatar_url: string | null
}

export function MentionInput({
  value,
  onChange,
  placeholder = 'Add a comment... Use @ to mention someone',
  className,
  workspaceId,
  autoFocus,
  onSubmit,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient() as any

  // Search for users when @ is typed
  const searchUsers = useCallback(
    async (query: string) => {
      if (!workspaceId) return

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(5)

      setSuggestions(data || [])
    },
    [workspaceId, supabase]
  )

  useEffect(() => {
    if (mentionQuery) {
      searchUsers(mentionQuery)
    }
  }, [mentionQuery, searchUsers])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    // Check for @ symbol
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Only show suggestions if there's no space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
        setMentionStart(lastAtIndex)
        setMentionQuery(textAfterAt)
        setShowSuggestions(true)
        setSelectedIndex(0)
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }

    onChange(newValue, mentionedUsers)
  }

  const insertMention = (user: User) => {
    const beforeMention = value.slice(0, mentionStart)
    const afterMention = value.slice(
      mentionStart + mentionQuery.length + 1
    )
    const newValue = `${beforeMention}@${user.full_name} ${afterMention}`

    // Track mentioned user
    const newMentionedUsers = [...mentionedUsers, user.id]
    setMentionedUsers(newMentionedUsers)

    onChange(newValue, newMentionedUsers)
    setShowSuggestions(false)
    setMentionQuery('')

    // Focus back on textarea
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(suggestions[selectedIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('min-h-[80px] resize-none', className)}
        autoFocus={autoFocus}
      />

      {/* Mention suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-1 shadow-md">
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => insertMention(user)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {user.full_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span>{user.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
