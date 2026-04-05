import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type {
  Assignment,
  AssignmentInsert,
  AssignmentUpdate,
  AssignmentStatus,
  AssignmentWithProgress,
  Completion,
  CompletionInsert,
  Certificate,
  LearnerDashboard,
  LearnerStats,
  ComplianceReport,
  ComplianceFilters,
  ComplianceRow,
  ComplianceSummary,
} from '@/types/training.types'

interface AssignmentState {
  // Assignments
  assignments: Assignment[]
  userAssignments: AssignmentWithProgress[]

  // Completions
  completions: Completion[]

  // Certificates
  certificates: Certificate[]

  // Dashboard
  learnerDashboard: LearnerDashboard | null

  // Compliance
  complianceReport: ComplianceReport | null

  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Assignment Actions
  loadAssignments: (filters?: { userId?: string; sopId?: string; status?: AssignmentStatus[] }) => Promise<void>
  loadUserAssignments: (userId: string) => Promise<void>
  createAssignment: (assignment: AssignmentInsert) => Promise<Assignment | null>
  createBulkAssignments: (sopId: string, userIds: string[], assignedBy: string, dueDate?: string) => Promise<Assignment[]>
  updateAssignment: (assignmentId: string, updates: AssignmentUpdate) => Promise<void>
  deleteAssignment: (assignmentId: string) => Promise<void>
  markInProgress: (assignmentId: string) => Promise<void>
  markComplete: (assignmentId: string) => Promise<void>

  // Completion Actions
  loadCompletions: (filters?: { userId?: string; sopId?: string }) => Promise<void>
  recordCompletion: (completion: CompletionInsert) => Promise<Completion | null>

  // Certificate Actions
  loadCertificates: (userId: string) => Promise<void>

  // Dashboard Actions
  loadLearnerDashboard: (userId: string) => Promise<void>

  // Compliance Actions
  generateComplianceReport: (filters: ComplianceFilters) => Promise<void>

  // Reset
  reset: () => void
}

const initialState = {
  assignments: [],
  userAssignments: [],
  completions: [],
  certificates: [],
  learnerDashboard: null,
  complianceReport: null,
  isLoading: false,
  isSaving: false,
  error: null,
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  ...initialState,

  loadAssignments: async (filters) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      let query = (supabase
        .from('assignments') as any)
        .select(`
          *,
          sop:sops(id, title, status, category:sop_categories(*)),
          user:profiles!assignments_user_id_fkey(*),
          assigned_by_profile:profiles!assignments_assigned_by_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters?.sopId) {
        query = query.eq('sop_id', filters.sopId)
      }
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error

      set({ assignments: data || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  loadUserAssignments: async (userId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      // Load assignments with SOP data
      const { data: assignments, error: assignError } = await (supabase
        .from('assignments') as any)
        .select(`
          *,
          sop:sops(id, title, status, category:sop_categories(*), quiz:quizzes(*)),
          assigned_by_profile:profiles!assignments_assigned_by_fkey(*)
        `)
        .eq('user_id', userId)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (assignError) throw assignError

      // Load completions for progress calculation
      const { data: completions, error: compError } = await (supabase
        .from('completions') as any)
        .select('*')
        .eq('user_id', userId)

      if (compError) throw compError

      // Map to AssignmentWithProgress
      const userAssignments: AssignmentWithProgress[] = (assignments || []).map((a: Assignment) => {
        const completion = completions?.find((c: Completion) => c.sop_id === a.sop_id)
        let progressPercent = 0

        if (a.status === 'completed' || completion) {
          progressPercent = 100
        } else if (a.status === 'in_progress') {
          progressPercent = 50 // Could be more granular based on quiz progress
        }

        return {
          ...a,
          progress_percent: progressPercent,
          completion,
        }
      })

      set({ userAssignments, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createAssignment: async (assignment: AssignmentInsert) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('assignments') as any)
        .insert({
          ...assignment,
          status: assignment.status || 'pending',
        })
        .select(`
          *,
          sop:sops(id, title, status),
          user:profiles!assignments_user_id_fkey(*),
          assigned_by_profile:profiles!assignments_assigned_by_fkey(*)
        `)
        .single()

      if (error) throw error

      const { assignments } = get()
      set({ assignments: [data, ...assignments], isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  createBulkAssignments: async (sopId: string, userIds: string[], assignedBy: string, dueDate?: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const inserts = userIds.map(userId => ({
        sop_id: sopId,
        user_id: userId,
        assigned_by: assignedBy,
        due_date: dueDate || null,
        status: 'pending' as AssignmentStatus,
      }))

      const { data, error } = await (supabase
        .from('assignments') as any)
        .upsert(inserts, { onConflict: 'sop_id,user_id' })
        .select(`
          *,
          sop:sops(id, title, status),
          user:profiles!assignments_user_id_fkey(*),
          assigned_by_profile:profiles!assignments_assigned_by_fkey(*)
        `)

      if (error) throw error

      const { assignments } = get()
      set({ assignments: [...(data || []), ...assignments], isSaving: false })
      return data || []
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return []
    }
  },

  updateAssignment: async (assignmentId: string, updates: AssignmentUpdate) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('assignments') as any)
        .update(updates)
        .eq('id', assignmentId)

      if (error) throw error

      const { assignments, userAssignments } = get()
      set({
        assignments: assignments.map(a =>
          a.id === assignmentId ? { ...a, ...updates } : a
        ),
        userAssignments: userAssignments.map(a =>
          a.id === assignmentId ? { ...a, ...updates } : a
        ),
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  deleteAssignment: async (assignmentId: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('assignments') as any)
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      const { assignments, userAssignments } = get()
      set({
        assignments: assignments.filter(a => a.id !== assignmentId),
        userAssignments: userAssignments.filter(a => a.id !== assignmentId),
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  markInProgress: async (assignmentId: string) => {
    await get().updateAssignment(assignmentId, { status: 'in_progress' })
  },

  markComplete: async (assignmentId: string) => {
    await get().updateAssignment(assignmentId, { status: 'completed' })
  },

  // Completion Actions
  loadCompletions: async (filters) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      let query = (supabase
        .from('completions') as any)
        .select(`
          *,
          sop:sops(id, title, status),
          quiz:quizzes(id, title),
          user:profiles!completions_user_id_fkey(*),
          certificate:certificates(*)
        `)
        .order('completed_at', { ascending: false })

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters?.sopId) {
        query = query.eq('sop_id', filters.sopId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ completions: data || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  recordCompletion: async (completion: CompletionInsert) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('completions') as any)
        .insert(completion)
        .select(`
          *,
          sop:sops(id, title, status),
          quiz:quizzes(id, title),
          user:profiles!completions_user_id_fkey(*)
        `)
        .single()

      if (error) throw error

      // Also update the assignment status if there is one
      const { assignments } = get()
      const assignment = assignments.find(
        a => a.sop_id === completion.sop_id && a.user_id === completion.user_id
      )
      if (assignment) {
        await get().markComplete(assignment.id)
      }

      const { completions } = get()
      set({ completions: [data, ...completions], isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  // Certificate Actions
  loadCertificates: async (userId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('certificates') as any)
        .select(`
          *,
          sop:sops(id, title),
          completion:completions(*)
        `)
        .eq('user_id', userId)
        .order('issued_at', { ascending: false })

      if (error) throw error

      set({ certificates: data || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Dashboard Actions
  loadLearnerDashboard: async (userId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      // Load user profile
      const { data: user, error: userError } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Load user assignments with progress
      await get().loadUserAssignments(userId)
      const { userAssignments } = get()

      // Load recent completions
      const { data: recentCompletions, error: compError } = await (supabase
        .from('completions') as any)
        .select(`
          *,
          sop:sops(id, title),
          quiz:quizzes(id, title)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5)

      if (compError) throw compError

      // Load certificates
      const { data: certificates, error: certError } = await (supabase
        .from('certificates') as any)
        .select(`
          *,
          sop:sops(id, title)
        `)
        .eq('user_id', userId)
        .order('issued_at', { ascending: false })

      if (certError) throw certError

      // Calculate stats
      const stats: LearnerStats = {
        total_assigned: userAssignments.length,
        completed: userAssignments.filter(a => a.status === 'completed').length,
        in_progress: userAssignments.filter(a => a.status === 'in_progress').length,
        pending: userAssignments.filter(a => a.status === 'pending').length,
        overdue: userAssignments.filter(a => a.status === 'overdue').length,
        average_score: recentCompletions?.length > 0
          ? Math.round(
              recentCompletions.reduce((sum: number, c: Completion) => sum + (c.score || 0), 0) /
              recentCompletions.filter((c: Completion) => c.score !== null).length
            ) || null
          : null,
        certificates_earned: certificates?.length || 0,
      }

      const dashboard: LearnerDashboard = {
        user,
        assignments: userAssignments,
        recent_completions: recentCompletions || [],
        certificates: certificates || [],
        stats,
      }

      set({ learnerDashboard: dashboard, certificates: certificates || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  // Compliance Actions
  generateComplianceReport: async (filters: ComplianceFilters) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      // Build query for assignments with all related data
      let query = (supabase
        .from('assignments') as any)
        .select(`
          *,
          sop:sops(*, category:sop_categories(*)),
          user:profiles!assignments_user_id_fkey(*),
          assigned_by_profile:profiles!assignments_assigned_by_fkey(*)
        `)

      // Apply filters
      if (filters.user_ids && filters.user_ids.length > 0) {
        query = query.in('user_id', filters.user_ids)
      }
      if (filters.sop_ids && filters.sop_ids.length > 0) {
        query = query.in('sop_id', filters.sop_ids)
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data: assignments, error: assignError } = await query

      if (assignError) throw assignError

      // Load completions and certificates for the filtered users
      const userIds = [...new Set((assignments || []).map((a: Assignment) => a.user_id))]
      const sopIds = [...new Set((assignments || []).map((a: Assignment) => a.sop_id))]

      const { data: completions } = await (supabase
        .from('completions') as any)
        .select('*')
        .in('user_id', userIds)
        .in('sop_id', sopIds)

      const { data: certificates } = await (supabase
        .from('certificates') as any)
        .select('*')
        .in('user_id', userIds)
        .in('sop_id', sopIds)

      // Build compliance rows
      const rows: ComplianceRow[] = (assignments || []).map((a: Assignment) => {
        const completion = completions?.find(
          (c: Completion) => c.user_id === a.user_id && c.sop_id === a.sop_id
        ) || null
        const certificate = certificates?.find(
          (c: Certificate) => c.user_id === a.user_id && c.sop_id === a.sop_id
        ) || null

        return {
          user: a.user!,
          sop: a.sop!,
          assignment: a,
          completion,
          certificate,
        }
      })

      // Calculate summary
      const completedCount = rows.filter(r => r.assignment.status === 'completed').length
      const summary: ComplianceSummary = {
        total_assignments: rows.length,
        completed: completedCount,
        completion_rate: rows.length > 0 ? Math.round((completedCount / rows.length) * 100) : 0,
        average_score: completions?.length > 0
          ? Math.round(
              completions.reduce((sum: number, c: Completion) => sum + (c.score || 0), 0) /
              completions.filter((c: Completion) => c.score !== null).length
            ) || null
          : null,
        overdue_count: rows.filter(r => r.assignment.status === 'overdue').length,
      }

      const report: ComplianceReport = {
        filters,
        data: rows,
        summary,
      }

      set({ complianceReport: report, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  reset: () => set(initialState),
}))
