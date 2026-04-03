import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Workspace } from '@/types/database.types'

// Test user ID for development (bypasses auth)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get or create test workspace directly (no auth required)
  const { data: workspacesData } = await (supabase
    .from('workspaces') as any)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)

  const workspaces = (workspacesData || []) as Workspace[]

  if (workspaces.length > 0) {
    // Redirect to first workspace
    redirect(`/${workspaces[0].id}`)
  }

  // Create test profile if needed
  const { data: profileData } = await (supabase
    .from('profiles') as any)
    .select('*')
    .eq('id', TEST_USER_ID)
    .single()

  if (!profileData) {
    await (supabase.from('profiles') as any).insert({
      id: TEST_USER_ID,
      email: 'test@example.com',
      full_name: 'Test User',
    })
  }

  // Create test workspace
  const { data: newWorkspaceData, error: workspaceError } = await (supabase
    .from('workspaces') as any)
    .insert({
      name: 'My Workspace',
      owner_id: TEST_USER_ID,
    })
    .select()
    .single()

  if (newWorkspaceData) {
    redirect(`/${(newWorkspaceData as Workspace).id}`)
  }

  // Fallback with error info
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Setting up your workspace...</p>
        {workspaceError && (
          <p className="text-red-500 text-sm mt-2">Error: {workspaceError.message}</p>
        )}
      </div>
    </div>
  )
}
