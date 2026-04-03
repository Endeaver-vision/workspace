'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useNavigationStore } from '@/lib/store/navigation-store'
import { useUIStore } from '@/lib/store/ui-store'
import { Page } from '@/types/database.types'
import { Search, FileText, Clock, Star, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuickSwitcher() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { currentWorkspace, pages } = useWorkspaceStore()
  const { recentPages, favorites, searchPages, loadRecentPages, loadFavorites } =
    useNavigationStore()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()

  // Test user ID (for development)
  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

  // Load recent and favorites when opened
  useEffect(() => {
    if (commandPaletteOpen && currentWorkspace) {
      loadRecentPages(TEST_USER_ID, currentWorkspace.id)
      loadFavorites(TEST_USER_ID, currentWorkspace.id)
    }
  }, [commandPaletteOpen, currentWorkspace, loadRecentPages, loadFavorites])

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  // Search results
  const searchResults = useMemo(() => {
    if (query.trim()) {
      return searchPages(query, pages)
    }
    return []
  }, [query, pages, searchPages])

  // Combined results: search results or recent + favorites
  const results = useMemo(() => {
    if (query.trim()) {
      return searchResults.map((page) => ({
        page,
        type: 'search' as const,
      }))
    }

    const items: Array<{ page: Page; type: 'recent' | 'favorite' }> = []

    // Add favorites first
    favorites.slice(0, 5).forEach((page) => {
      items.push({ page, type: 'favorite' })
    })

    // Add recent pages (excluding favorites already shown)
    const favoriteIds = new Set(favorites.map((f) => f.id))
    recentPages
      .filter((p) => !favoriteIds.has(p.id))
      .slice(0, 5)
      .forEach((page) => {
        items.push({ page, type: 'recent' })
      })

    return items
  }, [query, searchResults, recentPages, favorites])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = results[selectedIndex]
        if (selected && currentWorkspace) {
          router.push(`/${currentWorkspace.id}/${selected.page.id}`)
          setCommandPaletteOpen(false)
        }
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    },
    [results, selectedIndex, currentWorkspace, router, setCommandPaletteOpen]
  )

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [setCommandPaletteOpen])

  const handleSelect = (page: Page) => {
    if (currentWorkspace) {
      router.push(`/${currentWorkspace.id}/${page.id}`)
      setCommandPaletteOpen(false)
    }
  }

  if (!commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="h-5 w-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-lg placeholder:text-neutral-400"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {results.length === 0 && query.trim() && (
            <div className="px-4 py-8 text-center text-neutral-500">
              No pages found for "{query}"
            </div>
          )}

          {results.length === 0 && !query.trim() && (
            <div className="px-4 py-8 text-center text-neutral-500">
              Type to search pages
            </div>
          )}

          {/* Section headers */}
          {!query.trim() && favorites.length > 0 && (
            <div className="px-3 py-1.5 text-xs font-medium text-neutral-500">
              Favorites
            </div>
          )}

          {results.map((item, index) => {
            const isRecent = item.type === 'recent'
            const showRecentHeader =
              !query.trim() &&
              isRecent &&
              index > 0 &&
              results[index - 1]?.type === 'favorite'

            return (
              <div key={item.page.id}>
                {showRecentHeader && (
                  <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 mt-2">
                    Recent
                  </div>
                )}
                <button
                  onClick={() => handleSelect(item.page)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors',
                    selectedIndex === index
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    {item.page.icon ? (
                      <span className="text-lg">{item.page.icon}</span>
                    ) : (
                      <FileText className="h-4 w-4 text-neutral-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {item.page.title || 'Untitled'}
                    </div>
                  </div>

                  {/* Type indicator */}
                  <div className="flex items-center gap-1 text-neutral-400 flex-shrink-0">
                    {item.type === 'favorite' && <Star className="h-3.5 w-3.5" />}
                    {item.type === 'recent' && <Clock className="h-3.5 w-3.5" />}
                    {selectedIndex === index && (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  )
}
