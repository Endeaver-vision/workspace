import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope, unauthorized, forbidden, apiError } from '@/lib/api/auth'

interface RouteParams {
  params: Promise<{ databaseId: string }>
}

// GET /api/v1/databases/[databaseId] - Get database with properties and rows
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'read')) return forbidden()

  const { databaseId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // Get database
  const { data: database, error: dbError } = await (supabase as any)
    .from('databases')
    .select('*')
    .eq('id', databaseId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (dbError) {
    if (dbError.code === 'PGRST116') {
      return apiError('Database not found', 404)
    }
    return apiError(dbError.message, 500)
  }

  // Get properties
  const { data: properties } = await (supabase as any)
    .from('database_properties')
    .select('*')
    .eq('database_id', databaseId)
    .order('position', { ascending: true })

  // Get rows
  const { data: rows } = await (supabase as any)
    .from('database_rows')
    .select('*')
    .eq('database_id', databaseId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  return Response.json({
    ...database,
    properties: properties || [],
    rows: rows || [],
    has_more: rows?.length === limit,
    next_offset: rows?.length === limit ? offset + limit : null,
  })
}

// PATCH /api/v1/databases/[databaseId] - Update database
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'write')) return forbidden()

  const { databaseId } = await params
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { title, icon } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updates.title = title
    if (icon !== undefined) updates.icon = icon

    const { data, error } = await (supabase as any)
      .from('databases')
      .update(updates)
      .eq('id', databaseId)
      .eq('workspace_id', auth.workspaceId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return apiError('Database not found', 404)
      }
      return apiError(error.message, 500)
    }

    return Response.json(data)
  } catch (e) {
    return apiError('Invalid request body', 400)
  }
}

// DELETE /api/v1/databases/[databaseId] - Delete database
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'write')) return forbidden()

  const { databaseId } = await params
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('databases')
    .delete()
    .eq('id', databaseId)
    .eq('workspace_id', auth.workspaceId)

  if (error) {
    return apiError(error.message, 500)
  }

  return new Response(null, { status: 204 })
}
