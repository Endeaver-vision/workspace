import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope, unauthorized, forbidden, apiError } from '@/lib/api/auth'

interface RouteParams {
  params: Promise<{ pageId: string }>
}

// GET /api/v1/pages/[pageId] - Get page
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'read')) return forbidden()

  const { pageId } = await params
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .eq('workspace_id', auth.workspaceId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return apiError('Page not found', 404)
    }
    return apiError(error.message, 500)
  }

  return Response.json(data)
}

// PATCH /api/v1/pages/[pageId] - Update page
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'write')) return forbidden()

  const { pageId } = await params
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { title, icon, cover_image, content, is_archived } = body

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updates.title = title
    if (icon !== undefined) updates.icon = icon
    if (cover_image !== undefined) updates.cover_image = cover_image
    if (content !== undefined) updates.content = content
    if (is_archived !== undefined) updates.is_archived = is_archived

    const { data, error } = await (supabase as any)
      .from('pages')
      .update(updates)
      .eq('id', pageId)
      .eq('workspace_id', auth.workspaceId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return apiError('Page not found', 404)
      }
      return apiError(error.message, 500)
    }

    return Response.json(data)
  } catch (e) {
    return apiError('Invalid request body', 400)
  }
}

// DELETE /api/v1/pages/[pageId] - Delete page
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'write')) return forbidden()

  const { pageId } = await params
  const supabase = await createClient()

  // Soft delete by archiving
  const { error } = await (supabase as any)
    .from('pages')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', pageId)
    .eq('workspace_id', auth.workspaceId)

  if (error) {
    return apiError(error.message, 500)
  }

  return new Response(null, { status: 204 })
}
