import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

// Types
export type PropertyType =
  | 'title'
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'person'
  | 'files'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created_time'
  | 'created_by'
  | 'last_edited_time'
  | 'last_edited_by'

export type ViewType = 'table' | 'board' | 'calendar' | 'gallery' | 'timeline' | 'list'

export interface SelectOption {
  id: string
  property_id: string
  name: string
  color: string
  position: number
}

export interface DatabaseProperty {
  id: string
  database_id: string
  name: string
  type: PropertyType
  config: Record<string, any>
  position: number
  is_primary: boolean
  width: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseRow {
  id: string
  database_id: string
  properties: Record<string, any>
  page_id: string | null
  position: number
  created_at: string
  updated_at: string
  created_by: string | null
  last_edited_by: string | null
}

export interface DatabaseView {
  id: string
  database_id: string
  name: string
  type: ViewType
  filters: FilterRule[]
  sorts: SortRule[]
  group_by: string | null
  group_config: Record<string, any>
  visible_properties: string[]
  property_widths: Record<string, number>
  position: number
  is_default: boolean
  config: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Database {
  id: string
  workspace_id: string
  page_id: string | null
  title: string
  description: string | null
  is_inline: boolean
  icon: string | null
  cover_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface FilterRule {
  id: string
  property_id: string
  operator: string
  value: any
}

export interface SortRule {
  id: string
  property_id: string
  direction: 'asc' | 'desc'
}

interface DatabaseState {
  // Current database
  database: Database | null
  properties: DatabaseProperty[]
  rows: DatabaseRow[]
  views: DatabaseView[]
  selectOptions: Record<string, SelectOption[]>

  // Current view
  activeViewId: string | null

  // Loading states
  isLoading: boolean
  error: string | null

  // Actions
  loadDatabase: (databaseId: string) => Promise<void>
  createDatabase: (workspaceId: string, title?: string, isInline?: boolean) => Promise<Database | null>
  updateDatabase: (updates: Partial<Database>) => Promise<void>
  deleteDatabase: () => Promise<void>

  // Property actions
  addProperty: (property: Partial<DatabaseProperty>) => Promise<DatabaseProperty | null>
  updateProperty: (propertyId: string, updates: Partial<DatabaseProperty>) => Promise<void>
  deleteProperty: (propertyId: string) => Promise<void>
  reorderProperties: (propertyIds: string[]) => Promise<void>

  // Row actions
  addRow: (properties?: Record<string, any>) => Promise<DatabaseRow | null>
  updateRow: (rowId: string, properties: Record<string, any>) => Promise<void>
  deleteRow: (rowId: string) => Promise<void>
  reorderRows: (rowIds: string[]) => Promise<void>

  // View actions
  addView: (type: ViewType, name?: string) => Promise<DatabaseView | null>
  updateView: (viewId: string, updates: Partial<DatabaseView>) => Promise<void>
  deleteView: (viewId: string) => Promise<void>
  setActiveView: (viewId: string) => void

  // Select option actions
  addSelectOption: (propertyId: string, name: string, color?: string) => Promise<SelectOption | null>
  updateSelectOption: (optionId: string, updates: Partial<SelectOption>) => Promise<void>
  deleteSelectOption: (optionId: string) => Promise<void>

  // Filter/Sort actions
  addFilter: (viewId: string, filter: Omit<FilterRule, 'id'>) => Promise<void>
  updateFilter: (viewId: string, filterId: string, updates: Partial<FilterRule>) => Promise<void>
  removeFilter: (viewId: string, filterId: string) => Promise<void>
  addSort: (viewId: string, sort: Omit<SortRule, 'id'>) => Promise<void>
  removeSort: (viewId: string, sortId: string) => Promise<void>
  setGroupBy: (viewId: string, propertyId: string | null) => Promise<void>

  // Reset
  reset: () => void
}

const initialState = {
  database: null,
  properties: [],
  rows: [],
  views: [],
  selectOptions: {},
  activeViewId: null,
  isLoading: false,
  error: null,
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  ...initialState,

  loadDatabase: async (databaseId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      // Load database
      const { data: database, error: dbError } = await (supabase
        .from('databases') as any)
        .select('*')
        .eq('id', databaseId)
        .single()

      if (dbError) throw dbError

      // Load properties
      const { data: properties, error: propsError } = await (supabase
        .from('database_properties') as any)
        .select('*')
        .eq('database_id', databaseId)
        .order('position')

      if (propsError) throw propsError

      // Load rows
      const { data: rows, error: rowsError } = await (supabase
        .from('database_rows') as any)
        .select('*')
        .eq('database_id', databaseId)
        .order('position')

      if (rowsError) throw rowsError

      // Load views
      const { data: views, error: viewsError } = await (supabase
        .from('database_views') as any)
        .select('*')
        .eq('database_id', databaseId)
        .order('position')

      if (viewsError) throw viewsError

      // Load select options for select/multi_select properties
      const selectPropertyIds = properties
        .filter((p: DatabaseProperty) => p.type === 'select' || p.type === 'multi_select')
        .map((p: DatabaseProperty) => p.id)

      let selectOptions: Record<string, SelectOption[]> = {}

      if (selectPropertyIds.length > 0) {
        const { data: options, error: optionsError } = await (supabase
          .from('select_options') as any)
          .select('*')
          .in('property_id', selectPropertyIds)
          .order('position')

        if (optionsError) throw optionsError

        // Group by property_id
        selectOptions = (options || []).reduce((acc: Record<string, SelectOption[]>, opt: SelectOption) => {
          if (!acc[opt.property_id]) acc[opt.property_id] = []
          acc[opt.property_id].push(opt)
          return acc
        }, {})
      }

      const defaultView = views.find((v: DatabaseView) => v.is_default) || views[0]

      set({
        database,
        properties: properties || [],
        rows: rows || [],
        views: views || [],
        selectOptions,
        activeViewId: defaultView?.id || null,
        isLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createDatabase: async (workspaceId: string, title = 'Untitled Database', isInline = false) => {
    const supabase = createClient()

    try {
      // Create database
      const { data: database, error: dbError } = await (supabase
        .from('databases') as any)
        .insert({
          workspace_id: workspaceId,
          title,
          is_inline: isInline,
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Create default title property
      const { data: titleProp, error: propError } = await (supabase
        .from('database_properties') as any)
        .insert({
          database_id: database.id,
          name: 'Name',
          type: 'title',
          is_primary: true,
          position: 0,
        })
        .select()
        .single()

      if (propError) throw propError

      // Create default table view
      const { data: view, error: viewError } = await (supabase
        .from('database_views') as any)
        .insert({
          database_id: database.id,
          name: 'Table',
          type: 'table',
          is_default: true,
          visible_properties: [titleProp.id],
          position: 0,
        })
        .select()
        .single()

      if (viewError) throw viewError

      set({
        database,
        properties: [titleProp],
        rows: [],
        views: [view],
        activeViewId: view.id,
      })

      return database
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateDatabase: async (updates: Partial<Database>) => {
    const { database } = get()
    if (!database) return

    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('databases') as any)
        .update(updates)
        .eq('id', database.id)

      if (error) throw error

      set({ database: { ...database, ...updates } })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteDatabase: async () => {
    const { database } = get()
    if (!database) return

    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('databases') as any)
        .delete()
        .eq('id', database.id)

      if (error) throw error

      set(initialState)
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  addProperty: async (property: Partial<DatabaseProperty>) => {
    const { database, properties } = get()
    if (!database) return null

    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('database_properties') as any)
        .insert({
          database_id: database.id,
          name: property.name || 'Property',
          type: property.type || 'text',
          config: property.config || {},
          position: properties.length,
          width: property.width || 200,
        })
        .select()
        .single()

      if (error) throw error

      set({ properties: [...properties, data] })
      return data
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateProperty: async (propertyId: string, updates: Partial<DatabaseProperty>) => {
    const { properties } = get()
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('database_properties') as any)
        .update(updates)
        .eq('id', propertyId)

      if (error) throw error

      set({
        properties: properties.map(p =>
          p.id === propertyId ? { ...p, ...updates } : p
        ),
      })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteProperty: async (propertyId: string) => {
    const { properties } = get()
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('database_properties') as any)
        .delete()
        .eq('id', propertyId)

      if (error) throw error

      set({ properties: properties.filter(p => p.id !== propertyId) })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  reorderProperties: async (propertyIds: string[]) => {
    const { properties } = get()
    const supabase = createClient()

    try {
      const updates = propertyIds.map((id, index) => ({
        id,
        position: index,
      }))

      for (const update of updates) {
        await (supabase
          .from('database_properties') as any)
          .update({ position: update.position })
          .eq('id', update.id)
      }

      const reordered = propertyIds.map(id =>
        properties.find(p => p.id === id)!
      ).filter(Boolean)

      set({ properties: reordered })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  addRow: async (rowProperties = {}) => {
    const { database, rows, properties } = get()
    if (!database) return null

    const supabase = createClient()

    // Initialize with default values for each property
    const defaultProperties: Record<string, any> = {}
    properties.forEach(prop => {
      if (prop.type === 'checkbox') {
        defaultProperties[prop.id] = false
      } else if (prop.type === 'number') {
        defaultProperties[prop.id] = null
      } else {
        defaultProperties[prop.id] = ''
      }
    })

    try {
      const { data, error } = await (supabase
        .from('database_rows') as any)
        .insert({
          database_id: database.id,
          properties: { ...defaultProperties, ...rowProperties },
          position: rows.length,
        })
        .select()
        .single()

      if (error) throw error

      set({ rows: [...rows, data] })
      return data
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateRow: async (rowId: string, properties: Record<string, any>) => {
    const { rows } = get()
    const supabase = createClient()

    const row = rows.find(r => r.id === rowId)
    if (!row) return

    const updatedProperties = { ...row.properties, ...properties }

    try {
      const { error } = await (supabase
        .from('database_rows') as any)
        .update({ properties: updatedProperties })
        .eq('id', rowId)

      if (error) throw error

      set({
        rows: rows.map(r =>
          r.id === rowId ? { ...r, properties: updatedProperties } : r
        ),
      })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteRow: async (rowId: string) => {
    const { rows } = get()
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('database_rows') as any)
        .delete()
        .eq('id', rowId)

      if (error) throw error

      set({ rows: rows.filter(r => r.id !== rowId) })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  reorderRows: async (rowIds: string[]) => {
    const { rows } = get()
    const supabase = createClient()

    try {
      const updates = rowIds.map((id, index) => ({
        id,
        position: index,
      }))

      for (const update of updates) {
        await (supabase
          .from('database_rows') as any)
          .update({ position: update.position })
          .eq('id', update.id)
      }

      const reordered = rowIds.map(id =>
        rows.find(r => r.id === id)!
      ).filter(Boolean)

      set({ rows: reordered })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  addView: async (type: ViewType, name?: string) => {
    const { database, views, properties } = get()
    if (!database) return null

    const supabase = createClient()

    const viewNames: Record<ViewType, string> = {
      table: 'Table',
      board: 'Board',
      calendar: 'Calendar',
      gallery: 'Gallery',
      timeline: 'Timeline',
      list: 'List',
    }

    try {
      const { data, error } = await (supabase
        .from('database_views') as any)
        .insert({
          database_id: database.id,
          name: name || viewNames[type],
          type,
          visible_properties: properties.map(p => p.id),
          position: views.length,
        })
        .select()
        .single()

      if (error) throw error

      set({ views: [...views, data] })
      return data
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateView: async (viewId: string, updates: Partial<DatabaseView>) => {
    const { views } = get()
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('database_views') as any)
        .update(updates)
        .eq('id', viewId)

      if (error) throw error

      set({
        views: views.map(v =>
          v.id === viewId ? { ...v, ...updates } : v
        ),
      })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteView: async (viewId: string) => {
    const { views, activeViewId } = get()
    const supabase = createClient()

    if (views.length <= 1) {
      set({ error: 'Cannot delete the last view' })
      return
    }

    try {
      const { error } = await (supabase
        .from('database_views') as any)
        .delete()
        .eq('id', viewId)

      if (error) throw error

      const newViews = views.filter(v => v.id !== viewId)
      set({
        views: newViews,
        activeViewId: activeViewId === viewId ? newViews[0]?.id : activeViewId,
      })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  setActiveView: (viewId: string) => {
    set({ activeViewId: viewId })
  },

  addSelectOption: async (propertyId: string, name: string, color = 'gray') => {
    const { selectOptions } = get()
    const supabase = createClient()

    const currentOptions = selectOptions[propertyId] || []

    try {
      const { data, error } = await (supabase
        .from('select_options') as any)
        .insert({
          property_id: propertyId,
          name,
          color,
          position: currentOptions.length,
        })
        .select()
        .single()

      if (error) throw error

      set({
        selectOptions: {
          ...selectOptions,
          [propertyId]: [...currentOptions, data],
        },
      })
      return data
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateSelectOption: async (optionId: string, updates: Partial<SelectOption>) => {
    const { selectOptions } = get()
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('select_options') as any)
        .update(updates)
        .eq('id', optionId)

      if (error) throw error

      const newOptions = { ...selectOptions }
      for (const propId in newOptions) {
        newOptions[propId] = newOptions[propId].map(opt =>
          opt.id === optionId ? { ...opt, ...updates } : opt
        )
      }
      set({ selectOptions: newOptions })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteSelectOption: async (optionId: string) => {
    const { selectOptions } = get()
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('select_options') as any)
        .delete()
        .eq('id', optionId)

      if (error) throw error

      const newOptions = { ...selectOptions }
      for (const propId in newOptions) {
        newOptions[propId] = newOptions[propId].filter(opt => opt.id !== optionId)
      }
      set({ selectOptions: newOptions })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  addFilter: async (viewId: string, filter: Omit<FilterRule, 'id'>) => {
    const { views } = get()
    const view = views.find(v => v.id === viewId)
    if (!view) return

    const newFilter: FilterRule = {
      ...filter,
      id: crypto.randomUUID(),
    }

    await get().updateView(viewId, {
      filters: [...view.filters, newFilter],
    })
  },

  updateFilter: async (viewId: string, filterId: string, updates: Partial<FilterRule>) => {
    const { views } = get()
    const view = views.find(v => v.id === viewId)
    if (!view) return

    await get().updateView(viewId, {
      filters: view.filters.map(f =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    })
  },

  removeFilter: async (viewId: string, filterId: string) => {
    const { views } = get()
    const view = views.find(v => v.id === viewId)
    if (!view) return

    await get().updateView(viewId, {
      filters: view.filters.filter(f => f.id !== filterId),
    })
  },

  addSort: async (viewId: string, sort: Omit<SortRule, 'id'>) => {
    const { views } = get()
    const view = views.find(v => v.id === viewId)
    if (!view) return

    const newSort: SortRule = {
      ...sort,
      id: crypto.randomUUID(),
    }

    await get().updateView(viewId, {
      sorts: [...view.sorts, newSort],
    })
  },

  removeSort: async (viewId: string, sortId: string) => {
    const { views } = get()
    const view = views.find(v => v.id === viewId)
    if (!view) return

    await get().updateView(viewId, {
      sorts: view.sorts.filter(s => s.id !== sortId),
    })
  },

  setGroupBy: async (viewId: string, propertyId: string | null) => {
    await get().updateView(viewId, { group_by: propertyId })
  },

  reset: () => set(initialState),
}))
