'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useNavigationStore } from '@/lib/store/navigation-store'
import { Star, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// Test user ID (for development)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function FavoritesSection() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const { favorites, loadFavorites, toggleFavorite } = useNavigationStore()
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    // Temporarily disabled - page_access table not in PostgREST schema cache
    // Uncomment when Supabase schema cache is refreshed
    // if (currentWorkspace) {
    //   loadFavorites(TEST_USER_ID, currentWorkspace.id)
    // }
  }, [currentWorkspace, loadFavorites])

  const handleNavigate = (pageId: string) => {
    if (currentWorkspace) {
      router.push(`/${currentWorkspace.id}/${pageId}`)
    }
  }

  const handleUnfavorite = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation()
    await toggleFavorite(TEST_USER_ID, pageId)
    // Reload favorites
    if (currentWorkspace) {
      loadFavorites(TEST_USER_ID, currentWorkspace.id)
    }
  }

  if (favorites.length === 0) return null

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
        <Star className="h-3 w-3" />
        <span>Favorites</span>
        <span className="ml-auto text-neutral-400">{favorites.length}</span>
      </button>

      {/* Items */}
      {isExpanded && (
        <div className="mt-0.5 space-y-0.5 px-2">
          {favorites.map((page) => (
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

              {/* Unfavorite button */}
              <button
                onClick={(e) => handleUnfavorite(e, page.id)}
                className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded transition-opacity"
                title="Remove from favorites"
              >
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
