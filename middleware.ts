import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple cache for slug -> id mapping (in-memory, refreshed on cold start)
const slugCache = new Map<string, string>()

// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Check if a string is a UUID
function isUUID(str: string): boolean {
  return UUID_PATTERN.test(str)
}

// Get workspace ID from slug (with caching)
async function getWorkspaceIdBySlug(slug: string): Promise<string | null> {
  // Check cache first
  if (slugCache.has(slug)) {
    return slugCache.get(slug)!
  }

  // Create a Supabase client for middleware (no cookies needed for public read)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single()

  if (data?.id) {
    slugCache.set(slug, data.id)
    return data.id
  }

  return null
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get the first path segment
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return NextResponse.next()
  }

  const firstSegment = segments[0]

  // If it's already a UUID, continue as normal
  if (isUUID(firstSegment)) {
    return NextResponse.next()
  }

  // Skip known non-workspace routes
  const nonWorkspaceRoutes = ['login', 'signup', 'auth', 'invite']
  if (nonWorkspaceRoutes.includes(firstSegment)) {
    return NextResponse.next()
  }

  // Try to look up the workspace by slug
  const workspaceId = await getWorkspaceIdBySlug(firstSegment)

  if (workspaceId) {
    // Rewrite the URL to use the workspace ID internally
    const newPathname = '/' + [workspaceId, ...segments.slice(1)].join('/')
    const url = request.nextUrl.clone()
    url.pathname = newPathname
    return NextResponse.rewrite(url)
  }

  // If no workspace found, continue (might be a 404 or other route)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
