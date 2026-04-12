import { NextRequest } from 'next/server'
import { pool } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return Response.json({ error: { message: 'All fields are required' } }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: { message: 'Password must be at least 6 characters' } }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return Response.json({ error: { message: 'Email already registered' } }, { status: 400 })
    }

    // Create new user
    const userId = uuidv4()
    const result = await pool.query(
      `INSERT INTO profiles (id, email, full_name, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, email, full_name, role`,
      [userId, email, fullName]
    )

    const user = result.rows[0]

    // Create default workspace for user
    const workspaceId = uuidv4()
    await pool.query(
      `INSERT INTO workspaces (id, name, owner_id)
       VALUES ($1, $2, $3)`,
      [workspaceId, `${fullName}'s Workspace`, userId]
    )

    // Add user as workspace member
    await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [workspaceId, userId]
    )

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
