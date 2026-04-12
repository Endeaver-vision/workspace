import { NextRequest } from 'next/server'
import { pool } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    if (!userId) {
      return Response.json({ data: null, error: null })
    }

    const result = await pool.query(
      'SELECT id, email, full_name, role, avatar_url FROM profiles WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return Response.json({ data: null, error: null })
    }

    return Response.json({ data: { user: result.rows[0] }, error: null })
  } catch (err: any) {
    return Response.json({ error: { message: err.message } }, { status: 500 })
  }
}
