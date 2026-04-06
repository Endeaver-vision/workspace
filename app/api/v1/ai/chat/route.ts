import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// AI-powered chat assistant for answering questions about SOPs
// In production, this would use an LLM like Claude or GPT
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
      // Search for relevant SOPs based on message
      const { data: sops } = await (supabase
        .from('sops') as any)
        .select('id, title, content')
        .eq('workspace_id', workspaceId)
        .eq('status', 'published')
        .limit(5)

      contextSops = sops || []
    }

    // In production, this would send the context and message to an AI service
    // For now, generate a helpful mock response
    const response = generateMockResponse(message, contextSops, conversationHistory)

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800))

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    )
  }
}

function generateMockResponse(
  message: string,
  contextSops: any[],
  conversationHistory: any[]
): string {
  const messageLower = message.toLowerCase()

  // Check for common question patterns
  if (messageLower.includes('what is') || messageLower.includes("what's")) {
    if (contextSops.length > 0) {
      return `Based on the available training materials, "${contextSops[0].title}" covers this topic. The SOP provides detailed procedures and guidelines for handling related tasks. Would you like me to summarize the key points?`
    }
    return "I don't have specific information about that in the current training materials. Could you rephrase your question or ask about a specific SOP topic?"
  }

  if (messageLower.includes('how do i') || messageLower.includes('how to')) {
    if (contextSops.length > 0) {
      return `To accomplish this, you should follow the procedures outlined in "${contextSops[0].title}". The key steps typically include:\n\n1. Review the prerequisites and requirements\n2. Follow the step-by-step procedure\n3. Document your completion\n4. Verify compliance with standards\n\nWould you like more specific details about any of these steps?`
    }
    return "I'd be happy to help with that! Could you specify which SOP or training topic you're asking about? I can then provide the relevant procedures."
  }

  if (messageLower.includes('where') || messageLower.includes('find')) {
    if (contextSops.length > 0) {
      const sopTitles = contextSops.map(s => `"${s.title}"`).join(', ')
      return `You can find information on this topic in the following SOPs: ${sopTitles}. You can access these through the SOP Library or search for specific topics.`
    }
    return "You can find training materials in the SOP Library. Use the search feature to find specific topics, or browse by category. Is there a particular topic you're looking for?"
  }

  if (messageLower.includes('help') || messageLower.includes('assist')) {
    return `I'm here to help you with training-related questions! I can:

• Answer questions about SOP content and procedures
• Help you find relevant training materials
• Explain compliance requirements
• Provide summaries of lengthy documents

What would you like to know?`
  }

  if (messageLower.includes('thank')) {
    return "You're welcome! Let me know if you have any other questions about your training materials."
  }

  // Default response
  if (contextSops.length > 0) {
    return `I've reviewed "${contextSops[0].title}" for relevant information. Based on the training materials, this SOP contains procedures and guidelines that may address your question. Would you like me to provide more specific details or explain any particular section?`
  }

  return "I'd be happy to help answer your question about the training materials. Could you provide more details about what you're looking for? You can ask about specific procedures, requirements, or topics covered in your SOPs."
}
