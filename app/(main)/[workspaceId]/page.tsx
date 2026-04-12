import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoleDashboard } from '@/components/layout'
import type { UserRole } from '@/types/training.types'

// Force dynamic rendering (database connection at runtime)
export const dynamic = 'force-dynamic'

// Test user ID for development (bypasses auth)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
const TEST_USER_NAME = 'Test User'
const TEST_USER_ROLE: UserRole = 'admin'

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

  // Get training stats for the dashboard
  // Total SOPs
  const { count: totalSOPs } = await (supabase
    .from('sops') as any)
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  // Total users in workspace
  const { count: totalUsers } = await (supabase
    .from('profiles') as any)
    .select('*', { count: 'exact', head: true })

  // User's assignments
  const { data: assignments } = await (supabase
    .from('training_assignments') as any)
    .select('*')
    .eq('user_id', TEST_USER_ID)

  const userAssignments = assignments || []
  const totalAssignments = userAssignments.length
  const completedAssignments = userAssignments.filter((a: any) => a.status === 'completed').length
  const inProgressAssignments = userAssignments.filter((a: any) => a.status === 'in_progress').length
  const overdueAssignments = userAssignments.filter((a: any) => a.status === 'overdue').length

  // User's certificates
  const { count: certificates } = await (supabase
    .from('certificates') as any)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', TEST_USER_ID)

  // Overall compliance rate (completed / total assignments across all users)
  const { data: allAssignments } = await (supabase
    .from('training_assignments') as any)
    .select('status')

  const allAssignmentsList = allAssignments || []
  const overallComplianceRate = allAssignmentsList.length > 0
    ? Math.round(
        (allAssignmentsList.filter((a: any) => a.status === 'completed').length /
          allAssignmentsList.length) *
          100
      )
    : 0

  const stats = {
    totalAssignments,
    completedAssignments,
    inProgressAssignments,
    overdueAssignments,
    certificates: certificates || 0,
    totalUsers: totalUsers || 0,
    totalSOPs: totalSOPs || 0,
    overallComplianceRate,
  }

  return (
    <RoleDashboard
      workspaceId={workspaceId}
      userRole={TEST_USER_ROLE}
      userName={TEST_USER_NAME}
      stats={stats}
    />
  )
}
