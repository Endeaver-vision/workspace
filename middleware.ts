import { NextResponse, type NextRequest } from 'next/server'

// Simple cache for slug -> id mapping (in-memory, refreshed on cold start)
const slugCache = new Map<string, string>()

// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Check if a string is a UUID
function isUUID(str: string): boolean {
  return UUID_PATTERN.test(str)
}

// Get workspace ID from slug (with caching)
async function getWorkspaceIdBySlug(slug: string, baseUrl: string): Promise<string | null> {
  // Check cache first
  if (slugCache.has(slug)) {
    return slugCache.get(slug)!
  }

  try {
    // Use fetch to call our API endpoint instead of Supabase directly
    const response = await fetch(`${baseUrl}/api/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'select',
        table: 'workspaces',
        select: 'id',
        where: [{ column: 'slug', value: slug }],
        limit: 1
      })
    })

    const result = await response.json()

    if (result.data && result.data.length > 0) {
      const id = result.data[0].id
      slugCache.set(slug, id)
      return id
    }
  } catch (error) {
    console.error('Middleware: Failed to lookup workspace slug:', error)
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
  const baseUrl = request.nextUrl.origin
  const workspaceId = await getWorkspaceIdBySlug(firstSegment, baseUrl)

  if (workspaceId) {
    // If just the workspace slug with no subpath, redirect to SOPs library
    if (segments.length === 1) {
      const url = request.nextUrl.clone()
      url.pathname = `/${firstSegment}/sops`
      return NextResponse.redirect(url)
    }

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
