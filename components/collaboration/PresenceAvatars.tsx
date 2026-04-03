'use client'

import { useEffect } from 'react'
import { useCollaborationStore, Presence } from '@/lib/store/collaboration-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PresenceAvatarsProps {
  pageId: string
  userId: string
  maxAvatars?: number
  className?: string
}

export function PresenceAvatars({
  pageId,
  userId,
  maxAvatars = 5,
  className,
}: PresenceAvatarsProps) {
  const { presence, joinPage, leavePage } = useCollaborationStore()
  const pagePresence = presence[pageId] || []

  // Filter out current user and get others
  const otherUsers = pagePresence.filter((p) => p.user_id !== userId)
  const visibleUsers = otherUsers.slice(0, maxAvatars)
  const remainingCount = Math.max(0, otherUsers.length - maxAvatars)

  useEffect(() => {
    // Temporarily disabled - presence table not in PostgREST schema cache
    // Uncomment when Supabase schema cache is refreshed
    // joinPage(userId, pageId)
    // return () => {
    //   leavePage(userId, pageId)
    // }
  }, [userId, pageId, joinPage, leavePage])

  if (otherUsers.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center -space-x-2', className)}>
        {visibleUsers.map((user) => (
          <PresenceAvatar key={user.user_id} presence={user} />
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
              +{remainingCount}
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more {remainingCount === 1 ? 'person' : 'people'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

function PresenceAvatar({ presence }: { presence: Presence }) {
  const initials = presence.user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <Tooltip>
      <TooltipTrigger className="relative">
        <Avatar
          className="h-7 w-7 border-2"
          style={{ borderColor: presence.color }}
        >
          <AvatarImage
            src={presence.user?.avatar_url}
            alt={presence.user?.full_name}
          />
          <AvatarFallback
            className="text-xs"
            style={{ backgroundColor: presence.color, color: 'white' }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        <p>{presence.user?.full_name || 'Unknown user'}</p>
        <p className="text-xs text-muted-foreground">Viewing this page</p>
      </TooltipContent>
    </Tooltip>
  )
}
