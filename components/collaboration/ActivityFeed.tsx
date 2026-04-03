'use client'

import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useCollaborationStore, Activity } from '@/lib/store/collaboration-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  FileText,
  MessageSquare,
  Pencil,
  Plus,
  Settings,
  Trash2,
  UserPlus,
} from 'lucide-react'

interface ActivityFeedProps {
  workspaceId: string
  limit?: number
  className?: string
}

const actionIcons: Record<string, React.ReactNode> = {
  'page.created': <Plus className="h-3 w-3" />,
  'page.updated': <Pencil className="h-3 w-3" />,
  'page.deleted': <Trash2 className="h-3 w-3" />,
  'comment.created': <MessageSquare className="h-3 w-3" />,
  'member.added': <UserPlus className="h-3 w-3" />,
  'settings.updated': <Settings className="h-3 w-3" />,
}

const actionLabels: Record<string, string> = {
  'page.created': 'created',
  'page.updated': 'edited',
  'page.deleted': 'deleted',
  'comment.created': 'commented on',
  'member.added': 'added',
  'settings.updated': 'updated settings for',
}

export function ActivityFeed({
  workspaceId,
  limit = 50,
  className,
}: ActivityFeedProps) {
  const { activities, isLoadingActivity, loadActivity } = useCollaborationStore()

  useEffect(() => {
    loadActivity(workspaceId, limit)
  }, [workspaceId, limit, loadActivity])

  if (isLoadingActivity) {
    return (
      <div className={cn('space-y-4 p-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className={cn('p-8 text-center text-muted-foreground', className)}>
        No recent activity
      </div>
    )
  }

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="space-y-1 p-2">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </ScrollArea>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
  })

  const icon = actionIcons[activity.action] || <FileText className="h-3 w-3" />
  const label = actionLabels[activity.action] || activity.action

  return (
    <div className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50">
      <Avatar className="h-8 w-8">
        <AvatarImage src={activity.user?.avatar_url} />
        <AvatarFallback className="text-xs">
          {activity.user?.full_name?.[0]?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">
            {activity.user?.full_name || 'Someone'}
          </span>{' '}
          <span className="text-muted-foreground">{label}</span>{' '}
          {activity.page && (
            <span className="inline-flex items-center gap-1">
              {activity.page.icon && (
                <span className="text-sm">{activity.page.icon}</span>
              )}
              <span className="font-medium truncate max-w-[200px]">
                {activity.page.title || 'Untitled'}
              </span>
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>

      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
    </div>
  )
}
