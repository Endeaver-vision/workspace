'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbProps {
  workspaceId: string
}

// Map path segments to readable labels
const pathLabels: Record<string, string> = {
  training: 'My Training',
  sops: 'SOP Library',
  sop: 'SOP',
  certificates: 'Certificates',
  users: 'Users',
  reports: 'Reports',
  quiz: 'Quiz',
  builder: 'Builder',
  search: 'AI Search',
  settings: 'Settings',
  profile: 'Profile',
}

export function Breadcrumb({ workspaceId }: BreadcrumbProps) {
  const pathname = usePathname()

  // Build breadcrumb items from path
  const pathParts = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  // Skip workspace ID from display
  let currentPath = ''
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`

    // Skip the workspace ID in display but include in hrefs
    if (index === 0) return

    // Get label for this segment
    let label = pathLabels[part] || part

    // If it looks like a UUID, skip or show a shorter version
    if (part.length === 36 && part.includes('-')) {
      // This is likely a detail page ID - skip adding it as separate crumb
      // The parent will have context
      return
    }

    breadcrumbs.push({
      label,
      href: currentPath,
    })
  })

  // Don't show breadcrumb if we're at the root dashboard
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center text-sm text-muted-foreground py-3 px-6 bg-slate-50 border-b">
      <Link
        href={`/${workspaceId}`}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
