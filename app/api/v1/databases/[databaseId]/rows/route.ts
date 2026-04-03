import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope, unauthorized, forbidden, apiError } from '@/lib/api/auth'

interface RouteParams {
  params: Promise<{ databaseId: string }>
}

// POST /api/v1/databases/[databaseId]/rows - Create row
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'write')) return forbidden()

  const { databaseId } = await params
  const supabase = await createClient()

  // Verify database belongs to workspace
  const { data: database, error: dbError } = await (supabase as any)
    .from('databases')
    .select('id')
    .eq('id', databaseId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (dbError || !database) {
    return apiError('Database not found', 404)
  }

  try {
    const body = await request.json()
    const { properties, page_id } = body

    const { data, error } = await (supabase as any)
      .from('database_rows')
      .insert({
        database_id: databaseId,
        properties: properties || {},
        page_id,
      })
      .select()
      .single()

    if (error) {
      return apiError(error.message, 500)
    }

    return Response.json(data, { status: 201 })
  } catch (e) {
    return apiError('Invalid request body', 400)
  }
}
