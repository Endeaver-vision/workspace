'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useDatabaseStore } from '@/lib/store/database-store'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { PageTree } from './PageTree'
import { UserMenu } from './UserMenu'
import { FavoritesSection } from './FavoritesSection'
import { RecentPages } from './RecentPages'
import { QuickSwitcher } from './QuickSwitcher'
import { NotificationBell } from '@/components/collaboration/NotificationBell'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ChevronsLeft,
  Database,
  LayoutTemplate,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Test user ID for development (bypasses auth)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function Sidebar() {
  const router = useRouter()
  const supabase = createClient()
  const { sidebarOpen, setSidebarOpen, sidebarWidth } = useUIStore()
  const {
    currentWorkspace,
    pages,
    setPages,
    addPage,
    profile,
    setProfile,
    setWorkspaces,
    setCurrentWorkspace,
  } = useWorkspaceStore()

  // Hydration fix: wait for client-side mount before rendering
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Load user profile and workspaces (no auth required for testing)
  useEffect(() => {
    const loadData = async () => {
      // Load test profile
      const { data: profileData } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', TEST_USER_ID)
        .single()

      if (profileData) {
        setProfile(profileData)
      } else {
        // Create test profile if not exists
        setProfile({
          id: TEST_USER_ID,
          email: 'test@example.com',
          full_name: 'Test User',
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Load workspaces
      const { data: workspacesData } = await (supabase
        .from('workspaces') as any)
        .select('*')
        .order('created_at', { ascending: true })

      if (workspacesData && workspacesData.length > 0) {
        setWorkspaces(workspacesData)
        setCurrentWorkspace(workspacesData[0])
      }
    }

    loadData()
  }, [supabase, setProfile, setWorkspaces, setCurrentWorkspace])

  // Load pages when workspace changes
  useEffect(() => {
    if (!currentWorkspace) return

    const loadPages = async () => {
      const { data: pagesData } = await (supabase
        .from('pages') as any)
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: true })

      if (pagesData) {
        setPages(pagesData)
      }
    }

    loadPages()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pages',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addPage(payload.new as any)
          } else if (payload.eventType === 'UPDATE') {
            useWorkspaceStore.getState().updatePage(payload.new.id, payload.new as any)
          } else if (payload.eventType === 'DELETE') {
            useWorkspaceStore.getState().removePage(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentWorkspace, supabase, setPages, addPage])

  const { createDatabase } = useDatabaseStore()

  const handleCreatePage = async () => {
    if (!currentWorkspace) return

    const { data, error } = await (supabase
      .from('pages') as any)
      .insert({
        workspace_id: currentWorkspace.id,
        title: 'Untitled',
        created_by: TEST_USER_ID,
        content: {},
      })
      .select()
      .single()

    if (data && !error) {
      router.push(`/${currentWorkspace.id}/${data.id}`)
    }
  }

  const handleCreateDatabase = async () => {
    if (!currentWorkspace) return

    // Create a page for the database
    const { data: page, error: pageError } = await (supabase
      .from('pages') as any)
      .insert({
        workspace_id: currentWorkspace.id,
        title: 'Untitled Database',
        created_by: TEST_USER_ID,
        content: {},
      })
      .select()
      .single()

    if (pageError || !page) return

    // Create the database
    const database = await createDatabase(currentWorkspace.id, 'Untitled Database')

    if (database) {
      // Link database to page
      await (supabase
        .from('databases') as any)
        .update({ page_id: page.id })
        .eq('id', database.id)

      router.push(`/${currentWorkspace.id}/${page.id}`)
    }
  }

  const handleOpenTemplates = () => {
    useUIStore.getState().setTemplatesOpen(true)
  }

  // During SSR, render a placeholder to avoid hydration mismatch
  if (!hasMounted) {
    return (
      <aside
        className="fixed top-0 left-0 z-40 h-screen bg-neutral-100 dark:bg-neutral-900 border-r flex flex-col transition-all duration-200"
        style={{ width: 280 }}
      />
    )
  }

  if (!sidebarOpen) {
    return (
      <div className="fixed top-0 left-0 z-50 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="h-8 w-8"
        >
          <ChevronsLeft className="h-4 w-4 rotate-180" />
        </Button>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen bg-neutral-100 dark:bg-neutral-900 border-r flex flex-col',
        'transition-all duration-200'
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 h-12">
        <WorkspaceSwitcher />
        <div className="flex items-center gap-1">
          <NotificationBell userId={TEST_USER_ID} className="h-7 w-7" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:opacity-100"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 text-sm text-muted-foreground"
          onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4 mr-2" />
          Search
          <kbd className="ml-auto text-xs bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 text-sm text-muted-foreground"
          onClick={handleOpenTemplates}
        >
          <LayoutTemplate className="h-4 w-4 mr-2" />
          Templates
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 text-sm text-muted-foreground"
          onClick={handleCreateDatabase}
        >
          <Database className="h-4 w-4 mr-2" />
          New Database
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 text-sm text-muted-foreground"
          onClick={() => useUIStore.getState().setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Separator className="my-2" />

      {/* Favorites section */}
      <FavoritesSection />

      {/* Recent section */}
      <RecentPages />

      {/* Pages section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-medium text-muted-foreground">Pages</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleCreatePage}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <PageTree
            pages={pages.filter((p) => !p.parent_id)}
            allPages={pages}
          />
        </ScrollArea>
      </div>

      {/* Quick Switcher (Cmd+K) */}
      <QuickSwitcher />

      <Separator />

      {/* Trash */}
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start h-8 px-2 text-sm text-muted-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Trash
        </Button>
      </div>

      {/* User menu */}
      <div className="p-2 border-t">
        <UserMenu />
      </div>
    </aside>
  )
}
