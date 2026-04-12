import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('user_id')

    return Response.json({ data: null, error: null })
  } catch (err: any) {
    return Response.json({ error: { message: err.message } }, { status: 500 })
  }
}
