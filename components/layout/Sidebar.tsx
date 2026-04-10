'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Award,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/training.types'

interface SidebarProps {
  workspaceId: string
  userRole: UserRole
}

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  roles?: UserRole[]
}

export function Sidebar({ workspaceId, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: `/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      label: 'My Training',
      href: `/${workspaceId}/training`,
      icon: GraduationCap,
      roles: ['learner', 'trainer', 'admin'],
    },
    {
      label: 'SOP Library',
      href: `/${workspaceId}/sops`,
      icon: BookOpen,
    },
    {
      label: 'Certificates',
      href: `/${workspaceId}/certificates`,
      icon: Award,
    },
    {
      label: 'Users',
      href: `/${workspaceId}/users`,
      icon: Users,
      roles: ['admin', 'trainer'],
    },
    {
      label: 'Reports',
      href: `/${workspaceId}/reports`,
      icon: BarChart3,
      roles: ['admin', 'trainer'],
    },
  ]

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <aside
      className={cn(
        'h-screen bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">TrainHub</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href={`/${workspaceId}/settings`}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800'
          )}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  )
}
