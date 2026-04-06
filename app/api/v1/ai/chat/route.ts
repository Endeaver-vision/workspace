import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chat, ChatMessage } from '@/lib/ai/anthropic'

// AI-powered chat assistant for answering questions about SOPs
export async function POST(request: NextRequest) {
  try {
    const { message, workspaceId, sopId, conversationHistory } = await request.json()

    if (!message || !workspaceId) {
      return NextResponse.json(
        { error: 'Message and workspaceId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get relevant context
    let contextSops: any[] = []

    if (sopId) {
      // Get specific SOP content
      const { data: sop } = await (supabase
        .from('sops') as any)
        .select('id, title, content')
        .eq('id', sopId)
        .single()

      if (sop) {
        contextSops = [sop]
      }
    } else {
      // Get published SOPs for context
      const { data: sops } = await (supabase
        .from('sops') as any)
        .select('id, title, content')
        .eq('workspace_id', workspaceId)
        .eq('status', 'published')
        .limit(5)

      contextSops = sops || []
    }

    // Build context from SOPs
    const sopContext = contextSops.map(sop => {
      const content = typeof sop.content === 'string'
        ? sop.content
        : JSON.stringify(sop.content)
      return `## ${sop.title}\n${content.slice(0, 2000)}`
    }).join('\n\n')

    // Build system prompt
    const systemPrompt = `You are a helpful training assistant for a corporate training platform called TrainHub. Your role is to help employees understand Standard Operating Procedures (SOPs) and training materials.

${sopContext ? `Here are the relevant SOPs and training materials:\n\n${sopContext}` : 'No specific SOPs are available in context.'}

Guidelines:
- Be helpful, professional, and concise
- When answering questions, reference specific SOPs when relevant
- If you don't know something or it's not in the training materials, say so
- Provide step-by-step guidance when explaining procedures
- Encourage users to complete their assigned training`

    // Build conversation history
    const messages: ChatMessage[] = []

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }
    }

    messages.push({ role: 'user', content: message })

    // Call Claude
    const response = await chat(systemPrompt, messages, {
      maxTokens: 1024,
      temperature: 0.7,
    })

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat error:', error)

    // Check for API key error
    if (error.message?.includes('API key') || error.status === 401) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add ANTHROPIC_API_KEY to environment.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    )
  }
}
