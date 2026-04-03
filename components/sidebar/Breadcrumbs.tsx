'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useNavigationStore } from '@/lib/store/navigation-store'
import { Page } from '@/types/database.types'
import { ChevronRight, Home, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbsProps {
  pageId: string
  className?: string
}

export function Breadcrumbs({ pageId, className }: BreadcrumbsProps) {
  const router = useRouter()
  const { currentWorkspace, pages } = useWorkspaceStore()
  const { getBreadcrumbs, getPagePath } = useNavigationStore()
  const [breadcrumbs, setBreadcrumbs] = useState<Page[]>([])

  useEffect(() => {
    // First try to get breadcrumbs from page cache
    const loadBreadcrumbs = async () => {
      const path = await getPagePath(pageId)
      if (path && path.path_ids.length > 0) {
        // Use cached path
        const pathPages = path.path_ids
          .map((id) => pages.find((p) => p.id === id))
          .filter(Boolean) as Page[]
        setBreadcrumbs(pathPages)
      } else {
        // Fall back to client-side calculation
        const crumbs = getBreadcrumbs(pageId, pages)
        setBreadcrumbs(crumbs)
      }
    }

    loadBreadcrumbs()
  }, [pageId, pages, getPagePath, getBreadcrumbs])

  const currentPage = pages.find((p) => p.id === pageId)

  const handleNavigate = (id: string) => {
    if (currentWorkspace) {
      router.push(`/${currentWorkspace.id}/${id}`)
    }
  }

  const handleGoHome = () => {
    if (currentWorkspace) {
      router.push(`/${currentWorkspace.id}`)
    }
  }

  if (!currentPage) return null

  return (
    <nav
      className={cn(
        'flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 overflow-x-auto',
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* Home */}
      <button
        onClick={handleGoHome}
        className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
      >
        <Home className="h-3.5 w-3.5" />
      </button>

      {/* Breadcrumb items */}
      {breadcrumbs.map((page, index) => (
        <div key={page.id} className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <button
            onClick={() => handleNavigate(page.id)}
            className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors max-w-[150px]"
          >
            {page.icon ? (
              <span className="text-sm">{page.icon}</span>
            ) : (
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{page.title || 'Untitled'}</span>
          </button>
        </div>
      ))}

      {/* Current page */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <ChevronRight className="h-3 w-3" />
        <span className="flex items-center gap-1 px-1.5 py-1 text-neutral-900 dark:text-neutral-100 font-medium max-w-[200px]">
          {currentPage.icon ? (
            <span className="text-sm">{currentPage.icon}</span>
          ) : (
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className="truncate">{currentPage.title || 'Untitled'}</span>
        </span>
      </div>
    </nav>
  )
}
