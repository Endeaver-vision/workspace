import crypto from 'crypto'

export interface WebhookPayload {
  event: string
  data: Record<string, any>
  timestamp: string
  workspace_id: string
}

export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

export async function dispatchWebhook(
  url: string,
  payload: WebhookPayload,
  secret?: string
): Promise<{
  success: boolean
  status?: number
  body?: string
  error?: string
}> {
  try {
    const payloadString = JSON.stringify(payload)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
    }

    if (secret) {
      headers['X-Webhook-Signature'] = generateWebhookSignature(payloadString, secret)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payloadString,
    })

    const body = await response.text()

    return {
      success: response.ok,
      status: response.status,
      body,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Supported webhook events
export const WEBHOOK_EVENTS = [
  'page.created',
  'page.updated',
  'page.deleted',
  'database.created',
  'database.updated',
  'database.deleted',
  'database.row.created',
  'database.row.updated',
  'database.row.deleted',
  'comment.created',
  'comment.resolved',
  'member.added',
  'member.removed',
] as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]

export function isValidWebhookEvent(event: string): event is WebhookEvent {
  return WEBHOOK_EVENTS.includes(event as WebhookEvent)
}
