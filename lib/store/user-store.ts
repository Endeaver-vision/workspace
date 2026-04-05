import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ProfileUpdate, UserRole } from '@/types/training.types'

interface UserState {
  // Users
  users: Profile[]
  currentUser: Profile | null

  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions
  loadUsers: (workspaceId?: string) => Promise<void>
  loadUser: (userId: string) => Promise<Profile | null>
  updateUserRole: (userId: string, role: UserRole) => Promise<void>
  updateProfile: (userId: string, updates: ProfileUpdate) => Promise<void>
  inviteUser: (email: string, role: UserRole, fullName?: string) => Promise<Profile | null>
  searchUsers: (query: string) => Promise<Profile[]>

  // Reset
  reset: () => void
}

const initialState = {
  users: [],
  currentUser: null,
  isLoading: false,
  isSaving: false,
  error: null,
}

export const useUserStore = create<UserState>((set, get) => ({
  ...initialState,

  loadUsers: async () => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw error

      set({ users: data || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  loadUser: async (userId: string) => {
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      set({ currentUser: data })
      return data
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateUserRole: async (userId: string, role: UserRole) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ role })
        .eq('id', userId)

      if (error) throw error

      const { users } = get()
      set({
        users: users.map(u => u.id === userId ? { ...u, role } : u),
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  updateProfile: async (userId: string, updates: ProfileUpdate) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      const { users } = get()
      set({
        users: users.map(u => u.id === userId ? { ...u, ...updates } : u),
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  inviteUser: async (email: string, role: UserRole, fullName?: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      // Create a new profile entry
      // In a real app, this would also send an invitation email
      const { data, error } = await (supabase
        .from('profiles') as any)
        .insert({
          email,
          role,
          full_name: fullName || null,
        })
        .select()
        .single()

      if (error) throw error

      const { users } = get()
      set({ users: [...users, data], isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  searchUsers: async (query: string) => {
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20)

      if (error) throw error

      return data || []
    } catch (error: any) {
      return []
    }
  },

  reset: () => set(initialState),
}))
