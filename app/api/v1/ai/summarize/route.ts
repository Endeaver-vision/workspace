import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/anthropic'

// AI-powered summarization of SOP content
export async function POST(request: NextRequest) {
  try {
    const { sopId, sopTitle, content, length = 'standard', format = 'paragraph' } = await request.json()

    if (!sopId || !content) {
      return NextResponse.json(
        { error: 'SOP ID and content are required' },
        { status: 400 }
      )
    }

    // Extract text content from BlockNote format
    const textContent = extractTextContent(content)
    const fullContent = textContent.join('\n\n')

    if (!fullContent.trim()) {
      return NextResponse.json(
        { error: 'No text content found in SOP' },
        { status: 400 }
      )
    }

    // Build length instruction
    const lengthInstructions: Record<string, string> = {
      brief: 'Write a very brief summary in 2-3 sentences.',
      standard: 'Write a standard summary in one paragraph (4-6 sentences).',
      detailed: 'Write a detailed summary covering all major sections and key points (2-3 paragraphs).',
    }

    // Build format instruction
    const formatInstructions: Record<string, string> = {
      paragraph: 'Write in paragraph form with proper prose.',
      bullets: 'Use bullet points (•) to list key points.',
      outline: 'Use a hierarchical outline format with Roman numerals (I, II, III) and letters (A, B, C).',
    }

    const prompt = `Summarize the following training document.

Document Title: ${sopTitle || 'Training Document'}

Document Content:
${fullContent.slice(0, 10000)}

Instructions:
- ${lengthInstructions[length] || lengthInstructions.standard}
- ${formatInstructions[format] || formatInstructions.paragraph}
- Focus on key procedures, requirements, and actionable information
- Maintain professional tone appropriate for corporate training`

    const summary = await generateText(prompt, {
      systemPrompt: 'You are a technical writer specializing in creating clear, concise summaries of corporate training materials and Standard Operating Procedures. Your summaries help employees quickly understand key points and requirements.',
      maxTokens: 1500,
      temperature: 0.5,
    })

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Summarization error:', error)

    // Check for API key error
    if (error.message?.includes('API key') || error.status === 401) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add ANTHROPIC_API_KEY to environment.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Summarization failed' },
      { status: 500 }
    )
  }
}

function extractTextContent(content: any): string[] {
  if (!content || !Array.isArray(content)) return []

  const texts: string[] = []

  function extractFromBlock(block: any) {
    if (block.content && Array.isArray(block.content)) {
      const text = block.content
        .map((c: any) => c.text || '')
        .join('')
        .trim()
      if (text) texts.push(text)
    }
    if (block.children && Array.isArray(block.children)) {
      block.children.forEach(extractFromBlock)
    }
  }

  content.forEach(extractFromBlock)
  return texts
}
