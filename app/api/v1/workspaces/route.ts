import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope, unauthorized, forbidden, apiError } from '@/lib/api/auth'

// GET /api/v1/workspaces - List workspaces
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'read')) return forbidden()

  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('workspaces')
    .select('id, name, icon, created_at, updated_at')
    .eq('id', auth.workspaceId)

  if (error) {
    return apiError(error.message, 500)
  }

  return Response.json({
    object: 'list',
    results: data,
  })
}
