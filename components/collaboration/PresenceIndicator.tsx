'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCollaborationStore, Presence } from '@/lib/store/collaboration-store'
import { cn } from '@/lib/utils'

interface PresenceIndicatorProps {
  pageId: string
  userId: string
  containerRef: React.RefObject<HTMLElement>
}

export function PresenceIndicator({
  pageId,
  userId,
  containerRef,
}: PresenceIndicatorProps) {
  const { presence, updateCursor } = useCollaborationStore()
  const pagePresence = presence[pageId] || []
  const throttleRef = useRef<NodeJS.Timeout | null>(null)

  // Filter out current user
  const otherUsers = pagePresence.filter((p) => p.user_id !== userId)

  // Track cursor movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return

      // Throttle updates
      if (throttleRef.current) return

      throttleRef.current = setTimeout(() => {
        throttleRef.current = null
      }, 50) // 50ms throttle

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      updateCursor(userId, pageId, { x, y })
    },
    [userId, pageId, updateCursor, containerRef]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mousemove', handleMouseMove)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }
    }
  }, [containerRef, handleMouseMove])

  return (
    <>
      {otherUsers.map((user) => (
        <RemoteCursor key={user.user_id} presence={user} />
      ))}
    </>
  )
}

function RemoteCursor({ presence }: { presence: Presence }) {
  if (!presence.cursor_position) return null

  const { x, y } = presence.cursor_position
  const name = presence.user?.full_name?.split(' ')[0] || 'User'

  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-100"
      style={{
        left: x,
        top: y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M5.65376 12.4563L5.65376 3.47805L18.3851 11.1505L11.5765 12.2583L8.84559 18.6578L5.65376 12.4563Z"
          fill={presence.color}
        />
        <path
          d="M5.65376 12.4563L5.65376 3.47805L18.3851 11.1505L11.5765 12.2583L8.84559 18.6578L5.65376 12.4563Z"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Name label */}
      <div
        className={cn(
          'absolute left-4 top-5 whitespace-nowrap rounded px-1.5 py-0.5',
          'text-xs font-medium text-white'
        )}
        style={{ backgroundColor: presence.color }}
      >
        {name}
      </div>
    </div>
  )
}
