'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Page } from '@/types/database.types'

// Helper to get untyped supabase client
const getSupabase = () => createClient() as any

export interface PageAccess {
  id: string
  user_id: string
  page_id: string
  is_favorited: boolean
  last_accessed_at: string
  access_count: number
  created_at: string
}

export interface PagePath {
  page_id: string
  path_ids: string[]
  path_titles: string[]
  depth: number
}

export interface PageWithAccess extends Page {
  is_favorited?: boolean
  last_accessed_at?: string
  access_count?: number
}

interface NavigationState {
  // Data
  favorites: PageWithAccess[]
  recentPages: PageWithAccess[]
  pagePaths: Record<string, PagePath>
  isLoading: boolean

  // Actions
  loadFavorites: (userId: string, workspaceId: string) => Promise<void>
  loadRecentPages: (userId: string, workspaceId: string, limit?: number) => Promise<void>
  trackPageAccess: (userId: string, pageId: string) => Promise<void>
  toggleFavorite: (userId: string, pageId: string) => Promise<boolean>
  getPagePath: (pageId: string) => Promise<PagePath | null>
  getBreadcrumbs: (pageId: string, allPages: Page[]) => Page[]

  // Search
  searchPages: (query: string, pages: Page[]) => Page[]
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  favorites: [],
  recentPages: [],
  pagePaths: {},
  isLoading: false,

  // Load favorites
  loadFavorites: async (userId: string, workspaceId: string) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('page_access')
        .select(`
          *,
          pages!inner(*)
        `)
        .eq('user_id', userId)
        .eq('is_favorited', true)
        .eq('pages.workspace_id', workspaceId)
        .eq('pages.is_archived', false)
        .order('created_at', { ascending: false })

      if (error) {
        // Silently ignore PGRST205 (table not in schema cache) - this is a known issue
        if (error.code === 'PGRST205') return
        throw error
      }

      const favorites = (data || []).map((item: any) => ({
        ...item.pages,
        is_favorited: true,
        last_accessed_at: item.last_accessed_at,
        access_count: item.access_count,
      }))

      set({ favorites })
    } catch (error: any) {
      // Silently ignore PGRST205 errors
      if (error?.code === 'PGRST205') return
      console.error('Failed to load favorites:', error)
    }
  },

  // Load recent pages
  loadRecentPages: async (userId: string, workspaceId: string, limit = 10) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('page_access')
        .select(`
          *,
          pages!inner(*)
        `)
        .eq('user_id', userId)
        .eq('pages.workspace_id', workspaceId)
        .eq('pages.is_archived', false)
        .order('last_accessed_at', { ascending: false })
        .limit(limit)

      if (error) {
        // Silently ignore PGRST205 (table not in schema cache) - this is a known issue
        if (error.code === 'PGRST205') return
        throw error
      }

      const recentPages = (data || []).map((item: any) => ({
        ...item.pages,
        is_favorited: item.is_favorited,
        last_accessed_at: item.last_accessed_at,
        access_count: item.access_count,
      }))

      set({ recentPages })
    } catch (error: any) {
      // Silently ignore PGRST205 errors
      if (error?.code === 'PGRST205') return
      console.error('Failed to load recent pages:', error)
    }
  },

  // Track page access
  trackPageAccess: async (userId: string, pageId: string) => {
    const supabase = getSupabase()

    try {
      // Use upsert to update or create access record
      await supabase.from('page_access').upsert(
        {
          user_id: userId,
          page_id: pageId,
          last_accessed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,page_id',
        }
      )

      // Update access count
      await supabase.rpc('update_page_access', {
        p_user_id: userId,
        p_page_id: pageId,
      })
    } catch (error: any) {
      // Silently ignore PGRST205 errors
      if (error?.code === 'PGRST205') return
      console.error('Failed to track page access:', error)
    }
  },

  // Toggle favorite
  toggleFavorite: async (userId: string, pageId: string) => {
    const supabase = getSupabase()
    const { favorites } = get()

    const isFavorited = favorites.some((p) => p.id === pageId)
    const newFavorited = !isFavorited

    try {
      await supabase.from('page_access').upsert(
        {
          user_id: userId,
          page_id: pageId,
          is_favorited: newFavorited,
        },
        {
          onConflict: 'user_id,page_id',
        }
      )

      if (newFavorited) {
        // Add to favorites (will be loaded properly on next load)
        // For now, just mark it
      } else {
        // Remove from favorites
        set({
          favorites: favorites.filter((p) => p.id !== pageId),
        })
      }

      return newFavorited
    } catch (error: any) {
      // Silently ignore PGRST205 errors
      if (error?.code === 'PGRST205') return isFavorited
      console.error('Failed to toggle favorite:', error)
      return isFavorited
    }
  },

  // Get page path (breadcrumbs from cache)
  getPagePath: async (pageId: string) => {
    const { pagePaths } = get()

    if (pagePaths[pageId]) {
      return pagePaths[pageId]
    }

    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('page_paths')
        .select('*')
        .eq('page_id', pageId)
        .single()

      if (error) throw error

      if (data) {
        set({
          pagePaths: { ...pagePaths, [pageId]: data },
        })
        return data as PagePath
      }

      return null
    } catch (error) {
      console.error('Failed to get page path:', error)
      return null
    }
  },

  // Get breadcrumbs by walking up the tree (client-side fallback)
  getBreadcrumbs: (pageId: string, allPages: Page[]) => {
    const breadcrumbs: Page[] = []
    let currentPage = allPages.find((p) => p.id === pageId)

    while (currentPage?.parent_id) {
      const parent = allPages.find((p) => p.id === currentPage!.parent_id)
      if (parent) {
        breadcrumbs.unshift(parent)
        currentPage = parent
      } else {
        break
      }
    }

    return breadcrumbs
  },

  // Search pages
  searchPages: (query: string, pages: Page[]) => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()

    return pages
      .filter(
        (page) =>
          !page.is_archived &&
          (page.title.toLowerCase().includes(lowerQuery) ||
            page.icon?.includes(query))
      )
      .slice(0, 20)
  },
}))
