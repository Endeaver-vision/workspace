'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useNavigationStore } from '@/lib/store/navigation-store'
import { Clock, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Test user ID (for development)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function RecentPages() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const { recentPages, loadRecentPages } = useNavigationStore()
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    // Temporarily disabled - page_access table not in PostgREST schema cache
    // Uncomment when Supabase schema cache is refreshed
    // if (currentWorkspace) {
    //   loadRecentPages(TEST_USER_ID, currentWorkspace.id, 8)
    // }
  }, [currentWorkspace, loadRecentPages])

  const handleNavigate = (pageId: string) => {
    if (currentWorkspace) {
      router.push(`/${currentWorkspace.id}/${pageId}`)
    }
  }

  if (recentPages.length === 0) return null

  return (
    <div className="mb-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 w-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Clock className="h-3 w-3" />
        <span>Recent</span>
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="mt-0.5 space-y-0.5 px-2">
          {recentPages.map((page) => (
            <div
              key={page.id}
              onClick={() => handleNavigate(page.id)}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              {/* Icon */}
              <span className="text-sm">
                {page.icon || <FileText className="h-4 w-4 text-muted-foreground" />}
              </span>

              {/* Title */}
              <span className="flex-1 text-sm truncate">
                {page.title || 'Untitled'}
              </span>

              {/* Time ago */}
              {page.last_accessed_at && (
                <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatDistanceToNow(new Date(page.last_accessed_at), {
                    addSuffix: false,
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
