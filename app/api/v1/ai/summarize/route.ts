import { NextRequest, NextResponse } from 'next/server'

// AI-powered summarization of SOP content
// In production, this would use an LLM like Claude or GPT
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

    // In production, this would call an AI service to generate summary
    // For now, generate a mock summary
    const summary = generateMockSummary(sopTitle, textContent, length, format)

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Summarization error:', error)
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

function generateMockSummary(
  title: string,
  textContent: string[],
  length: string,
  format: string
): string {
  const contentPreview = textContent.slice(0, 5).join(' ').slice(0, 300)

  if (format === 'bullets') {
    const bullets = [
      `This SOP covers "${title}"`,
      'Key procedures and guidelines are outlined',
      'Step-by-step instructions are provided',
      'Safety considerations are addressed',
      'Compliance requirements are documented',
    ]

    if (length === 'brief') {
      return bullets.slice(0, 2).map(b => `• ${b}`).join('\n')
    } else if (length === 'detailed') {
      return [
        ...bullets,
        'Best practices are recommended',
        'Common issues and solutions are covered',
        'Review and approval process is included',
      ].map(b => `• ${b}`).join('\n')
    }
    return bullets.map(b => `• ${b}`).join('\n')
  }

  if (format === 'outline') {
    const outline = `I. Overview
   A. Purpose of ${title}
   B. Scope and applicability

II. Key Procedures
   A. Initial steps
   B. Main process
   C. Completion criteria

III. Requirements
   A. Prerequisites
   B. Compliance standards

IV. Conclusion
   A. Review process
   B. Updates and revisions`

    if (length === 'brief') {
      return outline.split('\n').slice(0, 5).join('\n')
    } else if (length === 'detailed') {
      return outline + `

V. Additional Resources
   A. Related documents
   B. Training materials
   C. Contact information`
    }
    return outline
  }

  // Paragraph format
  if (length === 'brief') {
    return `This SOP provides essential guidance on "${title}". It outlines the key procedures and requirements for compliance.`
  } else if (length === 'detailed') {
    return `This Standard Operating Procedure document titled "${title}" provides comprehensive guidance for the associated processes and procedures.

The document outlines key responsibilities, step-by-step procedures, and compliance requirements that must be followed. It covers initial preparation, execution of the main process, and proper documentation of completion.

Safety considerations and best practices are integrated throughout to ensure proper execution. The SOP also addresses common issues that may arise and provides solutions for handling them effectively.

Regular review and updates are recommended to maintain alignment with current standards and regulatory requirements.${contentPreview ? `\n\nContent preview: "${contentPreview}..."` : ''}`
  }

  return `This SOP titled "${title}" outlines the essential procedures and guidelines for the covered process. It includes step-by-step instructions, safety considerations, and compliance requirements. The document serves as a comprehensive reference for proper execution and documentation of the associated activities.`
}
