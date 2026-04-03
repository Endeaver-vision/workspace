import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Sidebar width
  sidebarWidth: number
  setSidebarWidth: (width: number) => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Settings modal
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  // Templates modal
  templatesOpen: boolean
  setTemplatesOpen: (open: boolean) => void

  // Page tree expanded states
  expandedPages: Record<string, boolean>
  togglePageExpanded: (pageId: string) => void
  setPageExpanded: (pageId: string, expanded: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Sidebar width
      sidebarWidth: 280,
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

      // Settings modal
      settingsOpen: false,
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

      // Templates modal
      templatesOpen: false,
      setTemplatesOpen: (templatesOpen) => set({ templatesOpen }),

      // Page tree expanded states
      expandedPages: {},
      togglePageExpanded: (pageId) =>
        set((state) => ({
          expandedPages: {
            ...state.expandedPages,
            [pageId]: !state.expandedPages[pageId],
          },
        })),
      setPageExpanded: (pageId, expanded) =>
        set((state) => ({
          expandedPages: {
            ...state.expandedPages,
            [pageId]: expanded,
          },
        })),
    }),
    {
      name: 'workspace-ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        expandedPages: state.expandedPages,
      }),
    }
  )
)
