'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { Page } from '@/types/database.types'
import { PageHeader } from './PageHeader'
import { Editor } from '@/components/editor/Editor'
import { PresenceAvatars } from '@/components/collaboration/PresenceAvatars'
import { NotificationBell } from '@/components/collaboration/NotificationBell'
import { debounce } from '@/lib/utils'

// Test user ID for development (bypasses auth)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

interface PageEditorProps {
  page: Page
}

export function PageEditor({ page: initialPage }: PageEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const { setCurrentPage, updatePage } = useWorkspaceStore()
  const [page, setPage] = useState(initialPage)
  const [isSaving, setIsSaving] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  // Hydration fix
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Set current page in store
  useEffect(() => {
    setCurrentPage(page)
    return () => setCurrentPage(null)
  }, [page, setCurrentPage])

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`page-${page.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pages',
          filter: `id=eq.${page.id}`,
        },
        (payload) => {
          // Only update if changes came from another client
          const newData = payload.new as Page
          setPage(newData)
          updatePage(page.id, newData)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [page.id, supabase, updatePage])

  // Save function with debouncing
  const saveContent = useCallback(
    debounce(async (content: any) => {
      setIsSaving(true)
      await (supabase.from('pages') as any)
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', page.id)
      setIsSaving(false)
    }, 1000),
    [page.id, supabase]
  )

  const handleTitleChange = async (title: string) => {
    setPage((prev) => ({ ...prev, title }))
    updatePage(page.id, { title })

    await (supabase.from('pages') as any)
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', page.id)
  }

  const handleIconChange = async (icon: string | null) => {
    setPage((prev) => ({ ...prev, icon }))
    updatePage(page.id, { icon })

    await (supabase.from('pages') as any)
      .update({ icon, updated_at: new Date().toISOString() })
      .eq('id', page.id)
  }

  const handleCoverChange = async (cover_image: string | null) => {
    setPage((prev) => ({ ...prev, cover_image }))
    updatePage(page.id, { cover_image })

    await (supabase.from('pages') as any)
      .update({ cover_image, updated_at: new Date().toISOString() })
      .eq('id', page.id)
  }

  const handleContentChange = (content: any) => {
    saveContent(content)
  }

  return (
    <div className="min-h-screen">
      {/* Top toolbar with collaboration */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-16 py-2 flex items-center justify-end gap-3">
          {hasMounted && (
            <>
              <PresenceAvatars
                pageId={page.id}
                userId={TEST_USER_ID}
                maxAvatars={4}
              />
              <NotificationBell userId={TEST_USER_ID} />
            </>
          )}
        </div>
      </div>

      {/* Cover image */}
      {page.cover_image && (
        <div
          className="h-48 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${page.cover_image})` }}
        />
      )}

      <div className="max-w-4xl mx-auto px-16 py-12">
        <PageHeader
          title={page.title}
          icon={page.icon}
          coverImage={page.cover_image}
          onTitleChange={handleTitleChange}
          onIconChange={handleIconChange}
          onCoverChange={handleCoverChange}
        />

        <div className="mt-4">
          <Editor
            initialContent={page.content as any}
            onChange={handleContentChange}
          />
        </div>

        {/* Saving indicator */}
        {isSaving && (
          <div className="fixed bottom-4 right-4 text-sm text-muted-foreground bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border">
            Saving...
          </div>
        )}
      </div>
    </div>
  )
}
