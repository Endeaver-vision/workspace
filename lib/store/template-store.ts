'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

// Helper to get untyped supabase client for tables not yet in generated types
const getSupabase = () => createClient() as any

export interface Template {
  id: string
  workspace_id: string
  name: string
  description?: string
  type: 'page' | 'database' | 'database_row'
  content: any
  icon?: string
  cover_url?: string
  is_public: boolean
  is_default: boolean
  category?: string
  tags: string[]
  use_count: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface TemplateButton {
  id: string
  page_id: string
  block_id: string
  template_id: string
  label: string
  style: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TemplateCategory {
  id: string
  workspace_id: string
  name: string
  description?: string
  icon?: string
  position: number
  created_at: string
}

interface TemplateState {
  // Data
  templates: Template[]
  categories: TemplateCategory[]
  selectedTemplate: Template | null
  isLoading: boolean
  error: string | null

  // Filters
  typeFilter: 'all' | 'page' | 'database' | 'database_row'
  categoryFilter: string | null
  searchQuery: string

  // Actions
  loadTemplates: (workspaceId: string) => Promise<void>
  loadCategories: (workspaceId: string) => Promise<void>
  createTemplate: (template: Partial<Template>) => Promise<Template | null>
  updateTemplate: (templateId: string, updates: Partial<Template>) => Promise<void>
  deleteTemplate: (templateId: string) => Promise<void>
  duplicateTemplate: (templateId: string) => Promise<Template | null>
  useTemplate: (templateId: string, targetPageId?: string) => Promise<any>

  // Category actions
  createCategory: (category: Partial<TemplateCategory>) => Promise<TemplateCategory | null>
  updateCategory: (categoryId: string, updates: Partial<TemplateCategory>) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>

  // UI actions
  setSelectedTemplate: (template: Template | null) => void
  setTypeFilter: (type: 'all' | 'page' | 'database' | 'database_row') => void
  setCategoryFilter: (categoryId: string | null) => void
  setSearchQuery: (query: string) => void

  // Computed
  getFilteredTemplates: () => Template[]
  getTemplatesByCategory: () => Record<string, Template[]>
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  templates: [],
  categories: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,
  typeFilter: 'all',
  categoryFilter: null,
  searchQuery: '',

  // Load templates
  loadTemplates: async (workspaceId: string) => {
    set({ isLoading: true, error: null })
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('templates' as any)
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ templates: (data || []) as Template[], isLoading: false })
    } catch (error: any) {
      // Silently ignore PGRST205 errors (schema cache issues)
      if (error?.code === 'PGRST205') {
        set({ isLoading: false })
        return
      }
      set({ error: error.message, isLoading: false })
    }
  },

  // Load categories
  loadCategories: async (workspaceId: string) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('template_categories' as any)
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('position', { ascending: true })

      if (error) throw error

      set({ categories: (data || []) as TemplateCategory[] })
    } catch (error: any) {
      // Silently ignore PGRST205 errors (schema cache issues)
      if (error?.code === 'PGRST205') return
      console.error('Failed to load categories:', error)
    }
  },

  // Create template
  createTemplate: async (template: Partial<Template>) => {
    const supabase = getSupabase()

    try {
      const insertData = {
        workspace_id: template.workspace_id!,
        name: template.name!,
        type: template.type!,
        content: template.content || {},
        description: template.description,
        icon: template.icon,
        cover_url: template.cover_url,
        category: template.category,
        tags: template.tags || [],
        is_public: template.is_public ?? false,
        is_default: template.is_default ?? false,
      }

      const { data, error } = await supabase
        .from('templates' as any)
        .insert(insertData as any)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        templates: [data as Template, ...state.templates],
      }))

      return data as Template
    } catch (error: any) {
      if (error?.code === 'PGRST205') return null
      set({ error: error.message })
      return null
    }
  },

  // Update template
  updateTemplate: async (templateId: string, updates: Partial<Template>) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('templates' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', templateId)

      if (error) throw error

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === templateId ? { ...t, ...updates } : t
        ),
        selectedTemplate:
          state.selectedTemplate?.id === templateId
            ? { ...state.selectedTemplate, ...updates }
            : state.selectedTemplate,
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      set({ error: error.message })
    }
  },

  // Delete template
  deleteTemplate: async (templateId: string) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('templates' as any)
        .delete()
        .eq('id', templateId)

      if (error) throw error

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== templateId),
        selectedTemplate:
          state.selectedTemplate?.id === templateId
            ? null
            : state.selectedTemplate,
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      set({ error: error.message })
    }
  },

  // Duplicate template
  duplicateTemplate: async (templateId: string) => {
    const { templates, createTemplate } = get()
    const original = templates.find((t) => t.id === templateId)
    if (!original) return null

    return createTemplate({
      workspace_id: original.workspace_id,
      name: `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      content: original.content,
      icon: original.icon,
      cover_url: original.cover_url,
      is_public: false,
      is_default: false,
      category: original.category,
      tags: original.tags,
    })
  },

  // Use template (create new page/database/row from template)
  useTemplate: async (templateId: string, targetPageId?: string) => {
    const supabase = getSupabase()
    const { templates } = get()
    const template = templates.find((t) => t.id === templateId)
    if (!template) return null

    try {
      // Track usage
      await supabase.from('template_usage' as any).insert({
        template_id: templateId,
        page_id: targetPageId,
      } as any)

      // Return the content to be used by the caller
      // The actual creation is handled by the calling component
      return {
        type: template.type,
        content: template.content,
        name: template.name,
        icon: template.icon,
      }
    } catch (error: any) {
      if (error?.code === 'PGRST205') return null
      console.error('Failed to use template:', error)
      return null
    }
  },

  // Category actions
  createCategory: async (category: Partial<TemplateCategory>) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('template_categories' as any)
        .insert(category as any)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        categories: [...state.categories, data as TemplateCategory],
      }))

      return data as TemplateCategory
    } catch (error: any) {
      if (error?.code === 'PGRST205') return null
      set({ error: error.message })
      return null
    }
  },

  updateCategory: async (categoryId: string, updates: Partial<TemplateCategory>) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('template_categories' as any)
        .update(updates as any)
        .eq('id', categoryId)

      if (error) throw error

      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === categoryId ? { ...c, ...updates } : c
        ),
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      set({ error: error.message })
    }
  },

  deleteCategory: async (categoryId: string) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('template_categories' as any)
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      set({ error: error.message })
    }
  },

  // UI actions
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setCategoryFilter: (categoryId) => set({ categoryFilter: categoryId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Computed: get filtered templates
  getFilteredTemplates: () => {
    const { templates, typeFilter, categoryFilter, searchQuery } = get()

    return templates.filter((template) => {
      // Type filter
      if (typeFilter !== 'all' && template.type !== typeFilter) {
        return false
      }

      // Category filter
      if (categoryFilter && template.category !== categoryFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = template.name.toLowerCase().includes(query)
        const matchesDescription = template.description?.toLowerCase().includes(query)
        const matchesTags = template.tags.some((tag) => tag.toLowerCase().includes(query))

        if (!matchesName && !matchesDescription && !matchesTags) {
          return false
        }
      }

      return true
    })
  },

  // Computed: get templates grouped by category
  getTemplatesByCategory: () => {
    const { templates, categories } = get()
    const grouped: Record<string, Template[]> = {
      uncategorized: [],
    }

    // Initialize groups for each category
    categories.forEach((cat) => {
      grouped[cat.id] = []
    })

    // Group templates
    templates.forEach((template) => {
      if (template.category && grouped[template.category]) {
        grouped[template.category].push(template)
      } else {
        grouped.uncategorized.push(template)
      }
    })

    return grouped
  },
}))
