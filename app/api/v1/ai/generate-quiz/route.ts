import { NextRequest, NextResponse } from 'next/server'
import { generateJSON } from '@/lib/ai/anthropic'
import type { QuestionType, QuizOption } from '@/types/training.types'

const uuidv4 = () => crypto.randomUUID()

interface AIGeneratedQuestion {
  question: string
  type: 'multiple_choice' | 'true_false' | 'fill_blank'
  options?: string[]
  correctAnswer: string | number
  explanation?: string
}

// AI-powered quiz generation from SOP content
export async function POST(request: NextRequest) {
  try {
    const { sopId, sopTitle, content, numQuestions = 5, difficulty = 'medium', questionTypes } = await request.json()

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

    const types = questionTypes || ['multiple_choice', 'true_false']
    const typesList = types.join(', ')

    const prompt = `Generate ${numQuestions} quiz questions based on this training document.

Document Title: ${sopTitle || 'Training Document'}

Document Content:
${fullContent.slice(0, 8000)}

Requirements:
- Difficulty level: ${difficulty}
- Question types to include: ${typesList}
- Questions should test understanding of key concepts, procedures, and compliance requirements
- Make questions specific to the actual content provided
- For multiple_choice: provide exactly 4 options, correctAnswer is the 0-based index of correct option
- For true_false: correctAnswer should be "true" or "false"
- For fill_blank: correctAnswer is the expected word/phrase

Return a JSON array in this exact format:
[
  {
    "question": "What is the first step in the procedure?",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation"
  },
  {
    "question": "True or false: The procedure requires manager approval.",
    "type": "true_false",
    "correctAnswer": "true",
    "explanation": "Brief explanation"
  }
]`

    const aiQuestions = await generateJSON<AIGeneratedQuestion[]>(prompt, {
      systemPrompt: 'You are an expert instructional designer creating assessment questions for corporate training. Generate clear, relevant questions that directly test comprehension of the provided material. Questions must be based on the actual content given.',
      maxTokens: 4096,
    })

    // Transform AI response to match expected format
    const questions = aiQuestions.map((q, index) => {
      const questionId = uuidv4()

      if (q.type === 'multiple_choice' && q.options) {
        const options: QuizOption[] = q.options.map((text, i) => ({
          id: uuidv4(),
          text,
          isCorrect: i === q.correctAnswer,
        }))

        return {
          id: questionId,
          type: 'multiple_choice' as QuestionType,
          question: q.question,
          options,
          correct_answer: null,
          points: difficulty === 'hard' ? 2 : 1,
          explanation: q.explanation,
        }
      } else if (q.type === 'true_false') {
        return {
          id: questionId,
          type: 'true_false' as QuestionType,
          question: q.question,
          options: null,
          correct_answer: String(q.correctAnswer).toLowerCase(),
          points: 1,
          explanation: q.explanation,
        }
      } else {
        // fill_blank
        return {
          id: questionId,
          type: 'fill_blank' as QuestionType,
          question: q.question,
          options: null,
          correct_answer: String(q.correctAnswer),
          points: difficulty === 'hard' ? 2 : 1,
          explanation: q.explanation,
        }
      }
    })

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Quiz generation error:', error)

    // Check for API key error
    if (error.message?.includes('API key') || error.status === 401) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add OPENROUTER_API_KEY to environment.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Quiz generation failed' },
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
