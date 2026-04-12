'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useApiStore, SyncedBlock as SyncedBlockType } from '@/lib/store/api-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Copy, Link2, MoreHorizontal, RefreshCw, Trash2, Unlink } from 'lucide-react'

interface SyncedBlockProps {
  syncedBlockId: string
  pageId: string
  blockId: string
  workspaceId: string
  userId: string
  onUpdate?: (content: any[]) => void
  onUnlink?: () => void
  isEditable?: boolean
}

export function SyncedBlock({
  syncedBlockId,
  pageId,
  blockId,
  workspaceId,
  userId,
  onUpdate,
  onUnlink,
  isEditable = true,
}: SyncedBlockProps) {
  const [syncedBlock, setSyncedBlock] = useState<SyncedBlockType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [referenceCount, setReferenceCount] = useState(0)
  const supabase = createClient() as any
  const { getSyncedBlock, updateSyncedBlock, deleteSyncedBlock } = useApiStore()

  // Load synced block
  const loadSyncedBlock = useCallback(async () => {
    setIsLoading(true)
    const block = await getSyncedBlock(syncedBlockId)
    setSyncedBlock(block)
    setIsLoading(false)

    // Get reference count
    const { count } = await supabase
      .from('synced_block_references')
      .select('*', { count: 'exact', head: true })
      .eq('synced_block_id', syncedBlockId)

    setReferenceCount(count || 0)
  }, [syncedBlockId, getSyncedBlock, supabase])

  useEffect(() => {
    loadSyncedBlock()

    // Note: Realtime subscriptions removed during PostgreSQL migration
    // Can be re-added later using WebSockets or polling
  }, [syncedBlockId, supabase, loadSyncedBlock, onUpdate])

  const handleContentUpdate = async (newContent: any[]) => {
    await updateSyncedBlock(syncedBlockId, newContent)
  }

  const handleUnlink = async () => {
    // Remove reference
    await supabase
      .from('synced_block_references')
      .delete()
      .eq('page_id', pageId)
      .eq('block_id', blockId)

    onUnlink?.()
  }

  const handleDelete = async () => {
    if (referenceCount > 1) {
      if (!confirm(`This synced block is used in ${referenceCount} places. Delete it everywhere?`)) {
        return
      }
    }

    await deleteSyncedBlock(syncedBlockId)
    onUnlink?.()
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/synced/${syncedBlockId}`
    navigator.clipboard.writeText(link)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    )
  }

  if (!syncedBlock) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Synced block not found or deleted
      </div>
    )
  }

  return (
    <div className="group relative rounded-lg border-2 border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-500/20 px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 text-orange-500" />
          <span>Synced block</span>
          {referenceCount > 1 && (
            <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-orange-700 dark:text-orange-300">
              {referenceCount} copies
            </span>
          )}
        </div>

        <Popover>
          <PopoverTrigger className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-orange-500/10">
            <MoreHorizontal className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="end">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              onClick={handleCopyLink}
            >
              <Link2 className="h-4 w-4" />
              Copy link
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              onClick={handleUnlink}
            >
              <Unlink className="h-4 w-4" />
              Unlink
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete everywhere
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Content */}
      <div className="p-3">
        {syncedBlock.content && Array.isArray(syncedBlock.content) ? (
          <div className="space-y-2">
            {syncedBlock.content.map((block: any, index: number) => (
              <div key={index} className="text-sm">
                {block.content?.[0]?.text || block.text || '(empty block)'}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Empty synced block</div>
        )}
      </div>
    </div>
  )
}

// Component to create a new synced block
interface CreateSyncedBlockProps {
  workspaceId: string
  userId: string
  pageId: string
  onCreated: (syncedBlockId: string) => void
  initialContent?: any[]
}

export function CreateSyncedBlock({
  workspaceId,
  userId,
  pageId,
  onCreated,
  initialContent = [],
}: CreateSyncedBlockProps) {
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { createSyncedBlock } = useApiStore()
  const supabase = createClient() as any

  const handleCreate = async () => {
    if (isCreating) return
    setIsCreating(true)

    try {
      const syncedBlock = await createSyncedBlock(
        workspaceId,
        userId,
        initialContent,
        title || undefined
      )

      if (syncedBlock) {
        // Create reference
        await supabase
          .from('synced_block_references')
          .insert({
            synced_block_id: syncedBlock.id,
            page_id: pageId,
            block_id: crypto.randomUUID(),
          })

        onCreated(syncedBlock.id)
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border">
      <h4 className="font-medium">Create Synced Block</h4>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Block title (optional)"
      />
      <Button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create'}
      </Button>
    </div>
  )
}

// Component to pick an existing synced block
interface SyncedBlockPickerProps {
  workspaceId: string
  pageId: string
  onSelect: (syncedBlockId: string) => void
  onCancel: () => void
}

export function SyncedBlockPicker({
  workspaceId,
  pageId,
  onSelect,
  onCancel,
}: SyncedBlockPickerProps) {
  const { syncedBlocks, loadSyncedBlocks, isLoadingSyncedBlocks } = useApiStore()
  const supabase = createClient() as any

  useEffect(() => {
    loadSyncedBlocks(workspaceId)
  }, [workspaceId, loadSyncedBlocks])

  const handleSelect = async (syncedBlockId: string) => {
    // Create reference
    await supabase
      .from('synced_block_references')
      .insert({
        synced_block_id: syncedBlockId,
        page_id: pageId,
        block_id: crypto.randomUUID(),
      })

    onSelect(syncedBlockId)
  }

  if (isLoadingSyncedBlocks) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-2 p-4 max-h-80 overflow-auto">
      <h4 className="font-medium">Select Synced Block</h4>
      {syncedBlocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No synced blocks yet</p>
      ) : (
        <div className="space-y-1">
          {syncedBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-accent"
              onClick={() => handleSelect(block.id)}
            >
              <Copy className="h-4 w-4 text-orange-500" />
              <span className="text-sm">{block.title || 'Untitled'}</span>
            </button>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
