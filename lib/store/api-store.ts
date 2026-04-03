'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
// Use Web Crypto API for browser compatibility

// Helper to get untyped supabase client
const getSupabase = () => createClient() as any

export interface ApiKey {
  id: string
  workspace_id: string
  user_id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at?: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface Webhook {
  id: string
  workspace_id: string
  url: string
  secret?: string
  events: string[]
  is_active: boolean
  last_triggered_at?: string
  failure_count: number
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event: string
  payload: Record<string, any>
  response_status?: number
  response_body?: string
  delivered_at: string
  success: boolean
}

export interface SyncedBlock {
  id: string
  workspace_id: string
  created_by?: string
  content: any[]
  title?: string
  created_at: string
  updated_at: string
}

export interface Embed {
  id: string
  page_id: string
  block_id: string
  service: string
  original_url: string
  embed_url?: string
  embed_data: Record<string, any>
  thumbnail_url?: string
  title?: string
  description?: string
  created_at: string
}

interface ApiState {
  // API Keys
  apiKeys: ApiKey[]
  isLoadingApiKeys: boolean

  // Webhooks
  webhooks: Webhook[]
  isLoadingWebhooks: boolean

  // Synced Blocks
  syncedBlocks: SyncedBlock[]
  isLoadingSyncedBlocks: boolean

  // API Key actions
  loadApiKeys: (workspaceId: string) => Promise<void>
  createApiKey: (
    workspaceId: string,
    userId: string,
    name: string,
    scopes?: string[],
    expiresAt?: string
  ) => Promise<{ key: string; apiKey: ApiKey } | null>
  revokeApiKey: (keyId: string) => Promise<void>

  // Webhook actions
  loadWebhooks: (workspaceId: string) => Promise<void>
  createWebhook: (
    workspaceId: string,
    url: string,
    events: string[]
  ) => Promise<Webhook | null>
  updateWebhook: (webhookId: string, updates: Partial<Webhook>) => Promise<void>
  deleteWebhook: (webhookId: string) => Promise<void>
  testWebhook: (webhookId: string) => Promise<boolean>

  // Synced Block actions
  loadSyncedBlocks: (workspaceId: string) => Promise<void>
  createSyncedBlock: (
    workspaceId: string,
    userId: string,
    content: any[],
    title?: string
  ) => Promise<SyncedBlock | null>
  updateSyncedBlock: (blockId: string, content: any[]) => Promise<void>
  deleteSyncedBlock: (blockId: string) => Promise<void>
  getSyncedBlock: (blockId: string) => Promise<SyncedBlock | null>
}

// Generate a secure API key using Web Crypto API
function generateApiKey(): string {
  const prefix = 'wsp_'
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const randomHex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}${randomHex}`
}

// Hash the API key for storage using Web Crypto API
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useApiStore = create<ApiState>((set, get) => ({
  apiKeys: [],
  isLoadingApiKeys: false,
  webhooks: [],
  isLoadingWebhooks: false,
  syncedBlocks: [],
  isLoadingSyncedBlocks: false,

  // Load API keys
  loadApiKeys: async (workspaceId: string) => {
    set({ isLoadingApiKeys: true })
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ apiKeys: data || [], isLoadingApiKeys: false })
    } catch (error: any) {
      if (error?.code === 'PGRST205') {
        set({ isLoadingApiKeys: false })
        return
      }
      console.error('Failed to load API keys:', error)
      set({ isLoadingApiKeys: false })
    }
  },

  // Create API key
  createApiKey: async (workspaceId, userId, name, scopes = ['read'], expiresAt) => {
    const supabase = getSupabase()

    try {
      const rawKey = generateApiKey()
      const keyHash = await hashApiKey(rawKey)
      const keyPrefix = rawKey.slice(0, 12)

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        apiKeys: [data, ...state.apiKeys],
      }))

      // Return the raw key (only time it's visible)
      return { key: rawKey, apiKey: data }
    } catch (error: any) {
      if (error?.code === 'PGRST205') return null
      console.error('Failed to create API key:', error)
      return null
    }
  },

  // Revoke API key
  revokeApiKey: async (keyId: string) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)

      if (error) throw error

      set((state) => ({
        apiKeys: state.apiKeys.map((k) =>
          k.id === keyId ? { ...k, is_active: false } : k
        ),
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      console.error('Failed to revoke API key:', error)
    }
  },

  // Load webhooks
  loadWebhooks: async (workspaceId: string) => {
    set({ isLoadingWebhooks: true })
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ webhooks: data || [], isLoadingWebhooks: false })
    } catch (error: any) {
      if (error?.code === 'PGRST205') {
        set({ isLoadingWebhooks: false })
        return
      }
      console.error('Failed to load webhooks:', error)
      set({ isLoadingWebhooks: false })
    }
  },

  // Create webhook
  createWebhook: async (workspaceId, url, events) => {
    const supabase = getSupabase()

    try {
      // Generate a webhook secret using Web Crypto API
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      const secret = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')

      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          workspace_id: workspaceId,
          url,
          secret,
          events,
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        webhooks: [data, ...state.webhooks],
      }))

      return data
    } catch (error: any) {
      if (error?.code === 'PGRST205') return null
      console.error('Failed to create webhook:', error)
      return null
    }
  },

  // Update webhook
  updateWebhook: async (webhookId, updates) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', webhookId)

      if (error) throw error

      set((state) => ({
        webhooks: state.webhooks.map((w) =>
          w.id === webhookId ? { ...w, ...updates } : w
        ),
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      console.error('Failed to update webhook:', error)
    }
  },

  // Delete webhook
  deleteWebhook: async (webhookId) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)

      if (error) throw error

      set((state) => ({
        webhooks: state.webhooks.filter((w) => w.id !== webhookId),
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      console.error('Failed to delete webhook:', error)
    }
  },

  // Test webhook
  testWebhook: async (webhookId) => {
    const webhook = get().webhooks.find((w) => w.id === webhookId)
    if (!webhook) return false

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Test': 'true',
        },
        body: JSON.stringify({
          event: 'test',
          data: { message: 'This is a test webhook' },
          timestamp: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Failed to test webhook:', error)
      return false
    }
  },

  // Load synced blocks
  loadSyncedBlocks: async (workspaceId: string) => {
    set({ isLoadingSyncedBlocks: true })
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('synced_blocks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ syncedBlocks: data || [], isLoadingSyncedBlocks: false })
    } catch (error: any) {
      if (error?.code === 'PGRST205') {
        set({ isLoadingSyncedBlocks: false })
        return
      }
      console.error('Failed to load synced blocks:', error)
      set({ isLoadingSyncedBlocks: false })
    }
  },

  // Create synced block
  createSyncedBlock: async (workspaceId, userId, content, title) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('synced_blocks')
        .insert({
          workspace_id: workspaceId,
          created_by: userId,
          content,
          title,
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        syncedBlocks: [data, ...state.syncedBlocks],
      }))

      return data
    } catch (error: any) {
      if (error?.code === 'PGRST205') return null
      console.error('Failed to create synced block:', error)
      return null
    }
  },

  // Update synced block
  updateSyncedBlock: async (blockId, content) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('synced_blocks')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', blockId)

      if (error) throw error

      set((state) => ({
        syncedBlocks: state.syncedBlocks.map((b) =>
          b.id === blockId ? { ...b, content, updated_at: new Date().toISOString() } : b
        ),
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      console.error('Failed to update synced block:', error)
    }
  },

  // Delete synced block
  deleteSyncedBlock: async (blockId) => {
    const supabase = getSupabase()

    try {
      const { error } = await supabase
        .from('synced_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error

      set((state) => ({
        syncedBlocks: state.syncedBlocks.filter((b) => b.id !== blockId),
      }))
    } catch (error: any) {
      if (error?.code === 'PGRST205') return
      console.error('Failed to delete synced block:', error)
    }
  },

  // Get single synced block
  getSyncedBlock: async (blockId) => {
    const supabase = getSupabase()

    try {
      const { data, error } = await supabase
        .from('synced_blocks')
        .select('*')
        .eq('id', blockId)
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      if (error?.code === 'PGRST205') return null
      console.error('Failed to get synced block:', error)
      return null
    }
  },
}))
