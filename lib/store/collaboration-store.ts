'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

// Helper to get untyped supabase client
const getSupabase = () => createClient() as any

export interface Presence {
  user_id: string
  page_id: string
  cursor_position?: { x: number; y: number }
  selection?: { start: number; end: number }
  last_seen_at: string
  color: string
  user?: {
    id: string
    full_name: string
    avatar_url: string
  }
}

export interface Comment {
  id: string
  page_id: string
  block_id?: string
  user_id: string
  parent_id?: string
  content: string
  mentioned_users: string[]
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    avatar_url: string
  }
  replies?: Comment[]
}

export interface Activity {
  id: string
  workspace_id: string
  page_id?: string
  user_id?: string
  action: string
  target_type?: string
  target_id?: string
  metadata: Record<string, any>
  created_at: string
  user?: {
    id: string
    full_name: string
    avatar_url: string
  }
  page?: {
    id: string
    title: string
    icon?: string
  }
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body?: string
  metadata: Record<string, any>
  is_read: boolean
  created_at: string
}

interface CollaborationState {
  // Presence
  presence: Record<string, Presence[]> // keyed by page_id
  presenceChannel: RealtimeChannel | null

  // Comments
  comments: Comment[]
  isLoadingComments: boolean

  // Activity
  activities: Activity[]
  isLoadingActivity: boolean

  // Notifications
  notifications: Notification[]
  unreadCount: number

  // Presence actions
  joinPage: (userId: string, pageId: string, color?: string) => Promise<void>
  leavePage: (userId: string, pageId: string) => Promise<void>
  updateCursor: (userId: string, pageId: string, position: { x: number; y: number }) => Promise<void>
  updateSelection: (userId: string, pageId: string, selection: { start: number; end: number }) => Promise<void>

  // Comment actions
  loadComments: (pageId: string) => Promise<void>
  addComment: (comment: Partial<Comment>) => Promise<Comment | null>
  updateComment: (commentId: string, updates: Partial<Comment>) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  resolveComment: (commentId: string, resolvedBy: string) => Promise<void>

  // Activity actions
  loadActivity: (workspaceId: string, limit?: number) => Promise<void>
  logActivity: (
    workspaceId: string,
    userId: string,
    action: string,
    options?: { pageId?: string; targetType?: string; targetId?: string; metadata?: Record<string, any> }
  ) => Promise<void>

  // Notification actions
  loadNotifications: (userId: string) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  presence: {},
  presenceChannel: null,
  comments: [],
  isLoadingComments: false,
  activities: [],
  isLoadingActivity: false,
  notifications: [],
  unreadCount: 0,

  // Join page (start presence tracking)
  joinPage: async (userId: string, pageId: string, color = '#3b82f6') => {
    const supabase = getSupabase()

    // Upsert presence record
    await supabase.from('presence').upsert(
      {
        user_id: userId,
        page_id: pageId,
        last_seen_at: new Date().toISOString(),
        color,
      },
      { onConflict: 'user_id,page_id' }
    )

    // Subscribe to presence channel
    const channel = supabase.channel(`presence:${pageId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presenceList = Object.values(state)
          .flat()
          .map((p: any) => ({
            user_id: p.user_id,
            page_id: pageId,
            cursor_position: p.cursor_position,
            selection: p.selection,
            last_seen_at: p.last_seen_at,
            color: p.color,
            user: p.user,
          }))

        set((s) => ({
          presence: { ...s.presence, [pageId]: presenceList },
        }))
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any[] }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track our presence
          await channel.track({
            user_id: userId,
            page_id: pageId,
            last_seen_at: new Date().toISOString(),
            color,
          })
        }
      })

    set({ presenceChannel: channel })
  },

  // Leave page
  leavePage: async (userId: string, pageId: string) => {
    const supabase = getSupabase()
    const { presenceChannel } = get()

    // Remove presence record
    await supabase
      .from('presence')
      .delete()
      .eq('user_id', userId)
      .eq('page_id', pageId)

    // Unsubscribe from channel
    if (presenceChannel) {
      await supabase.removeChannel(presenceChannel)
      set({ presenceChannel: null })
    }
  },

  // Update cursor position
  updateCursor: async (userId: string, pageId: string, position: { x: number; y: number }) => {
    const { presenceChannel } = get()

    if (presenceChannel) {
      await presenceChannel.track({
        user_id: userId,
        page_id: pageId,
        cursor_position: position,
        last_seen_at: new Date().toISOString(),
      })
    }
  },

  // Update selection
  updateSelection: async (userId: string, pageId: string, selection: { start: number; end: number }) => {
    const { presenceChannel } = get()

    if (presenceChannel) {
      await presenceChannel.track({
        user_id: userId,
        page_id: pageId,
        selection,
        last_seen_at: new Date().toISOString(),
      })
    }
  },

  // Load comments for a page
  loadComments: async (pageId: string) => {
    set({ isLoadingComments: true })
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!comments_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('page_id', pageId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Load replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment: any) => {
          const { data: replies } = await supabase
            .from('comments')
            .select(`
              *,
              user:profiles!comments_user_id_fkey(id, full_name, avatar_url)
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true })

          return {
            ...comment,
            replies: replies || [],
          }
        })
      )

      set({ comments: commentsWithReplies, isLoadingComments: false })
    } catch (error) {
      console.error('Failed to load comments:', error)
      set({ isLoadingComments: false })
    }
  },

  // Add comment
  addComment: async (comment: Partial<Comment>) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          page_id: comment.page_id,
          block_id: comment.block_id,
          user_id: comment.user_id,
          parent_id: comment.parent_id,
          content: comment.content,
          mentioned_users: comment.mentioned_users || [],
        })
        .select(`
          *,
          user:profiles!comments_user_id_fkey(id, full_name, avatar_url)
        `)
        .single()

      if (error) throw error

      // Create mentions
      if (comment.mentioned_users?.length) {
        await Promise.all(
          comment.mentioned_users.map((userId) =>
            supabase.from('mentions').insert({
              user_id: userId,
              mentioned_by: comment.user_id,
              page_id: comment.page_id,
              comment_id: data.id,
            })
          )
        )
      }

      // Update local state
      if (comment.parent_id) {
        // Add as reply
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === comment.parent_id
              ? { ...c, replies: [...(c.replies || []), data] }
              : c
          ),
        }))
      } else {
        // Add as top-level comment
        set((state) => ({
          comments: [...state.comments, { ...data, replies: [] }],
        }))
      }

      return data
    } catch (error) {
      console.error('Failed to add comment:', error)
      return null
    }
  },

  // Update comment
  updateComment: async (commentId: string, updates: Partial<Comment>) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('comments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', commentId)

      if (error) throw error

      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? { ...c, ...updates } : c
        ),
      }))
    } catch (error) {
      console.error('Failed to update comment:', error)
    }
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      set((state) => ({
        comments: state.comments.filter((c) => c.id !== commentId),
      }))
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  },

  // Resolve comment
  resolveComment: async (commentId: string, resolvedBy: string) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
        })
        .eq('id', commentId)

      if (error) throw error

      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId
            ? { ...c, is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: resolvedBy }
            : c
        ),
      }))
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  },

  // Load activity
  loadActivity: async (workspaceId: string, limit = 50) => {
    set({ isLoadingActivity: true })
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('activity')
        .select(`
          *,
          user:profiles!activity_user_id_fkey(id, full_name, avatar_url),
          page:pages!activity_page_id_fkey(id, title, icon)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      set({ activities: data || [], isLoadingActivity: false })
    } catch (error) {
      console.error('Failed to load activity:', error)
      set({ isLoadingActivity: false })
    }
  },

  // Log activity
  logActivity: async (workspaceId, userId, action, options = {}) => {
    const supabase = getSupabase()

    try {
      await supabase.rpc('log_activity', {
        p_workspace_id: workspaceId,
        p_user_id: userId,
        p_action: action,
        p_page_id: options.pageId,
        p_target_type: options.targetType,
        p_target_id: options.targetId,
        p_metadata: options.metadata || {},
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  },

  // Load notifications
  loadNotifications: async (userId: string) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Silently ignore PGRST205 (table not in schema cache) - this is a known issue
        if (error.code === 'PGRST205') return
        throw error
      }

      const unreadCount = (data || []).filter((n: any) => !n.is_read).length

      set({ notifications: data || [], unreadCount })
    } catch (error: any) {
      // Silently ignore PGRST205 errors
      if (error?.code === 'PGRST205') return
      console.error('Failed to load notifications:', error)
    }
  },

  // Mark notification as read
  markNotificationRead: async (notificationId: string) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error: any) {
      // Silently ignore PGRST205 errors
      if (error?.code === 'PGRST205') return
      console.error('Failed to mark notification read:', error)
    }
  },

  // Mark all notifications as read
  markAllRead: async (userId: string) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }))
    } catch (error: any) {
      // Silently ignore PGRST205 errors
      if (error?.code === 'PGRST205') return
      console.error('Failed to mark all read:', error)
    }
  },
}))
