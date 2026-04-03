import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey, hasScope, unauthorized, forbidden, apiError } from '@/lib/api/auth'

// POST /api/v1/search - Search pages and databases
export async function POST(request: NextRequest) {
  const auth = await validateApiKey(request)
  if (!auth) return unauthorized()
  if (!hasScope(auth, 'read')) return forbidden()

  const supabase = await createClient()

  try {
    const body = await request.json()
    const { query, filter, sort, limit = 20, offset = 0 } = body

    if (!query || typeof query !== 'string') {
      return apiError('Query is required', 400)
    }

    const results: any[] = []

    // Search pages
    if (!filter || filter.object === 'page') {
      const { data: pages } = await (supabase as any)
        .from('pages')
        .select('id, title, icon, parent_id, created_at, updated_at')
        .eq('workspace_id', auth.workspaceId)
        .eq('is_archived', false)
        .ilike('title', `%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (pages) {
        results.push(
          ...pages.map((p: any) => ({
            object: 'page',
            ...p,
          }))
        )
      }
    }

    // Search databases
    if (!filter || filter.object === 'database') {
      const { data: databases } = await (supabase as any)
        .from('databases')
        .select('id, title, icon, page_id, created_at, updated_at')
        .eq('workspace_id', auth.workspaceId)
        .ilike('title', `%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (databases) {
        results.push(
          ...databases.map((d: any) => ({
            object: 'database',
            ...d,
          }))
        )
      }
    }

    // Sort by relevance (exact matches first, then by updated_at)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title?.toLowerCase() === query.toLowerCase()
      const bExact = b.title?.toLowerCase() === query.toLowerCase()
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    return Response.json({
      object: 'list',
      results: sortedResults.slice(offset, offset + limit),
      has_more: sortedResults.length > offset + limit,
      next_offset: sortedResults.length > offset + limit ? offset + limit : null,
    })
  } catch (e) {
    return apiError('Invalid request body', 400)
  }
}
