import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope, unauthorized, forbidden, apiError } from '@/lib/api/auth'

// GET /api/v1/pages - List pages
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'read')) return forbidden()

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const parentId = searchParams.get('parent_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = (supabase as any)
    .from('pages')
    .select('id, title, icon, cover_image, parent_id, is_archived, created_at, updated_at')
    .eq('workspace_id', auth.workspaceId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (parentId) {
    query = query.eq('parent_id', parentId)
  }

  const { data, error, count } = await query

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

// POST /api/v1/pages - Create page
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'write')) return forbidden()

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { title, icon, cover_image, parent_id, content } = body

    const { data, error } = await (supabase as any)
      .from('pages')
      .insert({
        workspace_id: auth.workspaceId,
        created_by: auth.userId,
        title: title || 'Untitled',
        icon,
        cover_image,
        parent_id,
        content: content || {},
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
