import Anthropic from '@anthropic-ai/sdk'

// Initialize the Anthropic client
// Requires ANTHROPIC_API_KEY environment variable
const anthropic = new Anthropic()

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chat(
  systemPrompt: string,
  messages: ChatMessage[],
  options?: {
    maxTokens?: number
    temperature?: number
  }
): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options?.maxTokens || 1024,
    temperature: options?.temperature || 0.7,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  return textBlock ? textBlock.text : ''
}

export async function generateText(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  }
): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature || 0.7,
    system: options?.systemPrompt || 'You are a helpful assistant.',
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  return textBlock ? textBlock.text : ''
}

export async function generateJSON<T>(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
  }
): Promise<T> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options?.maxTokens || 4096,
    temperature: 0.3, // Lower temperature for structured output
    system: (options?.systemPrompt || '') + '\n\nRespond only with valid JSON, no other text.',
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock) throw new Error('No response from AI')

  // Parse JSON from response, handling potential markdown code blocks
  let jsonStr = textBlock.text.trim()
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }

  return JSON.parse(jsonStr.trim()) as T
}

export { anthropic }
