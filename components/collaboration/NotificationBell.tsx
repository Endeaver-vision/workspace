'use client'

import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useCollaborationStore, Notification } from '@/lib/store/collaboration-store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  AtSign,
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Settings,
  UserPlus,
} from 'lucide-react'

interface NotificationBellProps {
  userId: string
  className?: string
}

const notificationIcons: Record<string, React.ReactNode> = {
  mention: <AtSign className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  invite: <UserPlus className="h-4 w-4" />,
  update: <Settings className="h-4 w-4" />,
}

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    loadNotifications,
    markNotificationRead,
    markAllRead,
  } = useCollaborationStore()

  useEffect(() => {
    // Temporarily disabled - notifications table not in PostgREST schema cache
    // Uncomment when Supabase schema cache is refreshed
    // loadNotifications(userId)
  }, [userId, loadNotifications])

  const handleNotificationClick = (notification: Notification) => {
    markNotificationRead(notification.id)

    // Navigate to relevant page if available
    if (notification.metadata?.page_id) {
      const workspaceId = notification.metadata?.workspace_id || ''
      router.push(`/${workspaceId}/${notification.metadata.page_id}`)
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent',
          className
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead(userId)}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification
  onClick: () => void
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  })

  const icon = notificationIcons[notification.type] || <Bell className="h-4 w-4" />

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors',
        !notification.is_read && 'bg-muted/30'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          notification.is_read
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/10 text-primary'
        )}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm',
            !notification.is_read && 'font-medium'
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {!notification.is_read && (
        <div className="shrink-0 h-2 w-2 rounded-full bg-primary" />
      )}
    </button>
  )
}
