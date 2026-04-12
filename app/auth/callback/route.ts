import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)

  // With PostgreSQL auth, callbacks are handled directly by API routes
  // This route just redirects to dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
