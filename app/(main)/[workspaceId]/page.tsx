import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { Workspace, Page } from '@/types/database.types'

// Test user ID for development (bypasses auth)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params
  const supabase = await createClient()

  // Get workspace (no auth required for testing)
  const { data: workspaceData } = await (supabase
    .from('workspaces') as any)
    .select('*')
    .eq('id', workspaceId)
    .single()

  if (!workspaceData) {
    redirect('/dashboard')
  }

  const workspace = workspaceData as Workspace

  // Get recent pages
  const { data: pagesData } = await (supabase
    .from('pages') as any)
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(10)

  const recentPages = (pagesData || []) as Page[]

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {workspace.icon && <span className="mr-2">{workspace.icon}</span>}
          {workspace.name}
        </h1>
        <p className="text-muted-foreground">
          Welcome to your workspace. Create a new page to get started.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent pages</h2>
          <form
            action={async () => {
              'use server'
              const supabase = await createClient()

              const { data: newPage, error } = await (supabase
                .from('pages') as any)
                .insert({
                  workspace_id: workspaceId,
                  title: 'Untitled',
                  created_by: TEST_USER_ID,
                  content: {},
                })
                .select()
                .single()

              if (error) {
                console.error('Failed to create page:', error)
                return
              }

              if (newPage) {
                redirect(`/${workspaceId}/${(newPage as Page).id}`)
              }
            }}
          >
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              New page
            </Button>
          </form>
        </div>

        {recentPages && recentPages.length > 0 ? (
          <div className="grid gap-2">
            {recentPages.map((page) => (
              <Link
                key={page.id}
                href={`/${workspaceId}/${page.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <span className="text-xl">
                  {page.icon || <FileText className="h-5 w-5 text-muted-foreground" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {page.title || 'Untitled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Updated {new Date(page.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No pages yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first page to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
