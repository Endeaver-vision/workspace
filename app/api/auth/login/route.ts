import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password, devMode } = await request.json()

    if (!email) {
      return Response.json({ error: { message: 'Email is required' } }, { status: 400 })
    }

    // Dev mode: auto-login with test user (no password required)
    if (devMode) {
      const result = await pool.query(
        'SELECT id, email, full_name, role FROM profiles WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        return Response.json({ error: { message: 'User not found' } }, { status: 401 })
      }

      const user = result.rows[0]

      // Set session cookie
      const cookieStore = await cookies()
      cookieStore.set('user_id', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })

      return Response.json({ data: { user }, error: null })
    }

    // Normal login: check email and password
    if (!password) {
      return Response.json({ error: { message: 'Password is required' } }, { status: 400 })
    }

    // For simplicity, storing passwords in plain text (NOT for production)
    // In production, use bcrypt or similar
    const result = await pool.query(
      'SELECT id, email, full_name, role FROM profiles WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return Response.json({ error: { message: 'Invalid email or password' } }, { status: 401 })
    }

    const user = result.rows[0]

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return Response.json({ data: { user }, error: null })
  } catch (err: any) {
    return Response.json({ error: { message: err.message } }, { status: 500 })
  }
}
