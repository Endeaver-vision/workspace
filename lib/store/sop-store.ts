import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type {
  SOP,
  SOPInsert,
  SOPUpdate,
  SOPCategory,
  SOPCategoryInsert,
  SOPCategoryUpdate,
  SOPDocument,
  SOPDocumentInsert,
  SOPStatus,
  SOPSearchResult,
  SearchFilters,
} from '@/types/training.types'

interface SOPState {
  // SOPs
  sops: SOP[]
  currentSOP: SOP | null

  // Categories
  categories: SOPCategory[]
  categoryTree: SOPCategory[]

  // Documents
  documents: SOPDocument[]

  // Search
  searchResults: SOPSearchResult[]
  searchQuery: string

  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // SOP Actions
  loadSOPs: (workspaceId: string, filters?: SearchFilters) => Promise<void>
  loadSOP: (sopId: string) => Promise<void>
  createSOP: (sop: SOPInsert) => Promise<SOP | null>
  updateSOP: (sopId: string, updates: SOPUpdate) => Promise<void>
  deleteSOP: (sopId: string) => Promise<void>
  publishSOP: (sopId: string) => Promise<void>
  archiveSOP: (sopId: string) => Promise<void>

  // Category Actions
  loadCategories: (workspaceId: string) => Promise<void>
  createCategory: (category: SOPCategoryInsert) => Promise<SOPCategory | null>
  updateCategory: (categoryId: string, updates: SOPCategoryUpdate) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>

  // Document Actions
  loadDocuments: (sopId: string) => Promise<void>
  addDocument: (document: SOPDocumentInsert) => Promise<SOPDocument | null>
  deleteDocument: (documentId: string) => Promise<void>

  // Search Actions
  searchSOPs: (workspaceId: string, query: string) => Promise<void>
  setSearchQuery: (query: string) => void
  clearSearch: () => void

  // Reset
  reset: () => void
}

const initialState = {
  sops: [],
  currentSOP: null,
  categories: [],
  categoryTree: [],
  documents: [],
  searchResults: [],
  searchQuery: '',
  isLoading: false,
  isSaving: false,
  error: null,
}

// Helper to build category tree
function buildCategoryTree(categories: SOPCategory[]): SOPCategory[] {
  const categoryMap = new Map<string, SOPCategory>()
  const roots: SOPCategory[] = []

  // First pass: create map with children arrays
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [], level: 0 })
  })

  // Second pass: build tree
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)!
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      const parent = categoryMap.get(cat.parent_id)!
      node.level = (parent.level || 0) + 1
      parent.children = parent.children || []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export const useSOPStore = create<SOPState>((set, get) => ({
  ...initialState,

  loadSOPs: async (workspaceId: string, filters?: SearchFilters) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      let query = (supabase
        .from('sops') as any)
        .select(`
          *,
          category:sop_categories(*),
          created_by_profile:profiles!sops_created_by_fkey(*)
        `)
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      if (filters?.category_ids && filters.category_ids.length > 0) {
        query = query.in('category_id', filters.category_ids)
      }
      if (filters?.created_by && filters.created_by.length > 0) {
        query = query.in('created_by', filters.created_by)
      }

      const { data, error } = await query

      if (error) throw error

      set({ sops: data || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  loadSOP: async (sopId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('sops') as any)
        .select(`
          *,
          category:sop_categories(*),
          quiz:quizzes(*),
          documents:sop_documents(*),
          created_by_profile:profiles!sops_created_by_fkey(*)
        `)
        .eq('id', sopId)
        .single()

      if (error) throw error

      set({ currentSOP: data, isLoading: false })

      // Also load documents
      if (data) {
        get().loadDocuments(sopId)
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createSOP: async (sop: SOPInsert) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('sops') as any)
        .insert({
          ...sop,
          content: sop.content || {},
          status: sop.status || 'draft',
        })
        .select(`
          *,
          category:sop_categories(*),
          created_by_profile:profiles!sops_created_by_fkey(*)
        `)
        .single()

      if (error) throw error

      const { sops } = get()
      set({ sops: [data, ...sops], currentSOP: data, isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  updateSOP: async (sopId: string, updates: SOPUpdate) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('sops') as any)
        .update(updates)
        .eq('id', sopId)
        .select(`
          *,
          category:sop_categories(*),
          created_by_profile:profiles!sops_created_by_fkey(*)
        `)
        .single()

      if (error) throw error

      const { sops, currentSOP } = get()
      set({
        sops: sops.map(s => (s.id === sopId ? data : s)),
        currentSOP: currentSOP?.id === sopId ? data : currentSOP,
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  deleteSOP: async (sopId: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('sops') as any)
        .delete()
        .eq('id', sopId)

      if (error) throw error

      const { sops, currentSOP } = get()
      set({
        sops: sops.filter(s => s.id !== sopId),
        currentSOP: currentSOP?.id === sopId ? null : currentSOP,
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  publishSOP: async (sopId: string) => {
    const { sops } = get()
    const sop = sops.find(s => s.id === sopId)
    await get().updateSOP(sopId, {
      status: 'published',
      version: (sop?.version || 0) + 1,
    })
  },

  archiveSOP: async (sopId: string) => {
    await get().updateSOP(sopId, { status: 'archived' })
  },

  // Category Actions
  loadCategories: async (workspaceId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('sop_categories') as any)
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name')

      if (error) throw error

      const categories = data || []
      const categoryTree = buildCategoryTree(categories)

      set({ categories, categoryTree, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createCategory: async (category: SOPCategoryInsert) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('sop_categories') as any)
        .insert(category)
        .select()
        .single()

      if (error) throw error

      const { categories } = get()
      const newCategories = [...categories, data]
      const categoryTree = buildCategoryTree(newCategories)

      set({ categories: newCategories, categoryTree, isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  updateCategory: async (categoryId: string, updates: SOPCategoryUpdate) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('sop_categories') as any)
        .update(updates)
        .eq('id', categoryId)

      if (error) throw error

      const { categories } = get()
      const newCategories = categories.map(c =>
        c.id === categoryId ? { ...c, ...updates } : c
      )
      const categoryTree = buildCategoryTree(newCategories)

      set({ categories: newCategories, categoryTree, isSaving: false })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  deleteCategory: async (categoryId: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('sop_categories') as any)
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      const { categories } = get()
      const newCategories = categories.filter(c => c.id !== categoryId)
      const categoryTree = buildCategoryTree(newCategories)

      set({ categories: newCategories, categoryTree, isSaving: false })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  // Document Actions
  loadDocuments: async (sopId: string) => {
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('sop_documents') as any)
        .select(`
          *,
          uploaded_by_profile:profiles!sop_documents_uploaded_by_fkey(*)
        `)
        .eq('sop_id', sopId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ documents: data || [] })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  addDocument: async (document: SOPDocumentInsert) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('sop_documents') as any)
        .insert(document)
        .select(`
          *,
          uploaded_by_profile:profiles!sop_documents_uploaded_by_fkey(*)
        `)
        .single()

      if (error) throw error

      const { documents } = get()
      set({ documents: [data, ...documents], isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  deleteDocument: async (documentId: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('sop_documents') as any)
        .delete()
        .eq('id', documentId)

      if (error) throw error

      const { documents } = get()
      set({ documents: documents.filter(d => d.id !== documentId), isSaving: false })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  // Search Actions
  searchSOPs: async (workspaceId: string, query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' })
      return
    }

    set({ isLoading: true, error: null, searchQuery: query })
    const supabase = createClient()

    try {
      // Use full-text search on title and content
      const { data, error } = await (supabase
        .from('sops') as any)
        .select(`
          *,
          category:sop_categories(*),
          created_by_profile:profiles!sops_created_by_fkey(*)
        `)
        .eq('workspace_id', workspaceId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Map to search results with relevance scoring
      const searchResults: SOPSearchResult[] = (data || []).map((sop: SOP) => {
        const matchedFields: string[] = []
        let relevanceScore = 0

        const lowerQuery = query.toLowerCase()
        if (sop.title.toLowerCase().includes(lowerQuery)) {
          matchedFields.push('title')
          relevanceScore += 10
        }
        const contentStr = JSON.stringify(sop.content).toLowerCase()
        if (contentStr.includes(lowerQuery)) {
          matchedFields.push('content')
          relevanceScore += 5
        }

        return {
          sop,
          relevance_score: relevanceScore,
          matched_fields: matchedFields,
        }
      })

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance_score - a.relevance_score)

      set({ searchResults, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  clearSearch: () => {
    set({ searchResults: [], searchQuery: '' })
  },

  reset: () => set(initialState),
}))
