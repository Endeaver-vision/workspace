import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Workspace, Page, Profile } from '@/types/database.types'

interface WorkspaceState {
  // Current workspace
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace | null) => void

  // All workspaces
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
  addWorkspace: (workspace: Workspace) => void
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void
  removeWorkspace: (id: string) => void

  // Pages
  pages: Page[]
  setPages: (pages: Page[]) => void
  addPage: (page: Page) => void
  updatePage: (id: string, updates: Partial<Page>) => void
  removePage: (id: string) => void
  loadPages: () => Promise<void>

  // Current page
  currentPage: Page | null
  setCurrentPage: (page: Page | null) => void

  // User profile
  profile: Profile | null
  setProfile: (profile: Profile | null) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  // Current workspace
  currentWorkspace: null,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  // All workspaces
  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace] })),
  updateWorkspace: (id, updates) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
      currentWorkspace:
        state.currentWorkspace?.id === id
          ? { ...state.currentWorkspace, ...updates }
          : state.currentWorkspace,
    })),
  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace:
        state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    })),

  // Pages
  pages: [],
  setPages: (pages) => set({ pages }),
  addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
  updatePage: (id, updates) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPage:
        state.currentPage?.id === id
          ? { ...state.currentPage, ...updates }
          : state.currentPage,
    })),
  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPage: state.currentPage?.id === id ? null : state.currentPage,
    })),
  loadPages: async () => {
    const state = useWorkspaceStore.getState()
    const workspace = state.currentWorkspace
    if (!workspace) return

    const supabase = createClient()
    const { data: pagesData } = await (supabase
      .from('pages') as any)
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: true })

    if (pagesData) {
      set({ pages: pagesData })
    }
  },

  // Current page
  currentPage: null,
  setCurrentPage: (page) => set({ currentPage: page }),

  // User profile
  profile: null,
  setProfile: (profile) => set({ profile }),

  // Loading states
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
