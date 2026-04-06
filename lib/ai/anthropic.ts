import OpenAI from 'openai'

// Initialize OpenRouter client (OpenAI-compatible API)
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'TrainHub',
  },
})

// Using Gemini Flash 2.5 via OpenRouter
export const AI_MODEL = 'google/gemini-2.5-flash'

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
  const response = await openrouter.chat.completions.create({
    model: AI_MODEL,
    max_tokens: options?.maxTokens || 1024,
    temperature: options?.temperature || 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  })

  return response.choices[0]?.message?.content || ''
}

export async function generateText(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  }
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: AI_MODEL,
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature || 0.7,
    messages: [
      { role: 'system', content: options?.systemPrompt || 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ],
  })

  return response.choices[0]?.message?.content || ''
}

export async function generateJSON<T>(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
  }
): Promise<T> {
  const response = await openrouter.chat.completions.create({
    model: AI_MODEL,
    max_tokens: options?.maxTokens || 4096,
    temperature: 0.3, // Lower temperature for structured output
    messages: [
      {
        role: 'system',
        content: (options?.systemPrompt || '') + '\n\nRespond only with valid JSON, no other text or markdown formatting.',
      },
      { role: 'user', content: prompt },
    ],
  })

  const content = response.choices[0]?.message?.content || ''
  if (!content) throw new Error('No response from AI')

  // Parse JSON from response, handling potential markdown code blocks
  let jsonStr = content.trim()
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

export { openrouter }
