'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WorkspaceContextValue {
  workspaceId: string
  workspaceSlug: string | null
  urlPath: string // slug if available, otherwise id
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

interface WorkspaceProviderProps {
  workspaceId: string
  children: ReactNode
}

export function WorkspaceProvider({ workspaceId, children }: WorkspaceProviderProps) {
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWorkspace = async () => {
      const supabase = createClient()
      const { data } = await (supabase
        .from('workspaces') as any)
        .select('slug')
        .eq('id', workspaceId)
        .single()

      if (data?.slug) {
        setWorkspaceSlug(data.slug)
      }
      setIsLoading(false)
    }

    fetchWorkspace()
  }, [workspaceId])

  const urlPath = workspaceSlug || workspaceId

  return (
    <WorkspaceContext.Provider value={{ workspaceId, workspaceSlug, urlPath, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

// Helper to get URL path for a workspace route
export function useWorkspaceUrl(path: string = '') {
  const { urlPath } = useWorkspace()
  return `/${urlPath}${path}`
}
