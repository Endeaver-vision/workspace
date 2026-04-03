import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

export interface ApiAuth {
  workspaceId: string
  userId: string
  scopes: string[]
}

export async function validateApiKey(request: NextRequest): Promise<ApiAuth | null> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.slice(7)
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

  const supabase = await createClient()

  const { data, error } = await (supabase as any).rpc('validate_api_key', {
    p_key_hash: keyHash,
  })

  if (error || !data || data.length === 0) {
    return null
  }

  return {
    workspaceId: data[0].workspace_id,
    userId: data[0].user_id,
    scopes: data[0].scopes,
  }
}

export function hasScope(auth: ApiAuth, requiredScope: string): boolean {
  // 'write' scope includes 'read'
  if (requiredScope === 'read' && auth.scopes.includes('write')) {
    return true
  }
  return auth.scopes.includes(requiredScope)
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

export function unauthorized() {
  return Response.json(
    { error: 'Unauthorized. Provide a valid API key in the Authorization header.' },
    { status: 401 }
  )
}

export function forbidden() {
  return Response.json(
    { error: 'Forbidden. You do not have permission to perform this action.' },
    { status: 403 }
  )
}
