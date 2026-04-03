import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope, unauthorized, forbidden, apiError } from '@/lib/api/auth'

// GET /api/v1/databases - List databases
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'read')) return forbidden()

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data, error } = await (supabase as any)
    .from('databases')
    .select(`
      id,
      title,
      icon,
      is_inline,
      page_id,
      created_at,
      updated_at
    `)
    .eq('workspace_id', auth.workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return apiError(error.message, 500)
  }

  return Response.json({
    object: 'list',
    results: data,
    has_more: data.length === limit,
    next_offset: data.length === limit ? offset + limit : null,
  })
}

// POST /api/v1/databases - Create database
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'write')) return forbidden()

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { title, icon, page_id, is_inline, properties } = body

    // Create database
    const { data: database, error: dbError } = await (supabase as any)
      .from('databases')
      .insert({
        workspace_id: auth.workspaceId,
        page_id,
        title: title || 'Untitled Database',
        icon,
        is_inline: is_inline || false,
      })
      .select()
      .single()

    if (dbError) {
      return apiError(dbError.message, 500)
    }

    // Create default title property
    await (supabase as any)
      .from('database_properties')
      .insert({
        database_id: database.id,
        name: 'Name',
        type: 'title',
        config: {},
      })

    // Create additional properties if provided
    if (properties && Array.isArray(properties)) {
      for (const prop of properties) {
        await (supabase as any)
          .from('database_properties')
          .insert({
            database_id: database.id,
            name: prop.name,
            type: prop.type,
            config: prop.config || {},
          })
      }
    }

    // Create default table view
    await (supabase as any)
      .from('database_views')
      .insert({
        database_id: database.id,
        name: 'Table',
        type: 'table',
      })

    return Response.json(database, { status: 201 })
  } catch (e) {
    return apiError('Invalid request body', 400)
  }
}
