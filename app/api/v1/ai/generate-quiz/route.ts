import { NextRequest, NextResponse } from 'next/server'
import type { QuestionType, QuizOption } from '@/types/training.types'

// Use crypto.randomUUID() instead of uuid package
const uuidv4 = () => crypto.randomUUID()

// AI-powered quiz generation from SOP content
// In production, this would use an LLM like Claude or GPT
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

    // In production, this would call an AI service to generate questions
    // For now, generate mock questions based on content structure
    const questions = generateMockQuestions(
      sopTitle,
      textContent,
      numQuestions,
      difficulty,
      questionTypes || ['multiple_choice', 'true_false']
    )

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Quiz generation error:', error)
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

function generateMockQuestions(
  title: string,
  textContent: string[],
  numQuestions: number,
  difficulty: string,
  questionTypes: QuestionType[]
): any[] {
  const questions: any[] = []
  const usedTypes = questionTypes.length > 0 ? questionTypes : ['multiple_choice', 'true_false']

  // Generate questions based on content
  for (let i = 0; i < numQuestions; i++) {
    const type = usedTypes[i % usedTypes.length] as QuestionType
    const questionId = uuidv4()

    if (type === 'multiple_choice') {
      const options: QuizOption[] = [
        { id: uuidv4(), text: `Correct answer for question ${i + 1}`, isCorrect: true },
        { id: uuidv4(), text: 'Incorrect option A', isCorrect: false },
        { id: uuidv4(), text: 'Incorrect option B', isCorrect: false },
        { id: uuidv4(), text: 'Incorrect option C', isCorrect: false },
      ]
      // Shuffle options
      for (let j = options.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[options[j], options[k]] = [options[k], options[j]]
      }

      questions.push({
        id: questionId,
        type: 'multiple_choice',
        question: `Based on "${title}", what is the correct answer for scenario ${i + 1}?`,
        options,
        correct_answer: null,
        points: difficulty === 'hard' ? 2 : 1,
      })
    } else if (type === 'true_false') {
      const isTrue = Math.random() > 0.5
      questions.push({
        id: questionId,
        type: 'true_false',
        question: `True or False: Statement ${i + 1} about "${title}" is accurate.`,
        options: null,
        correct_answer: isTrue ? 'true' : 'false',
        points: 1,
      })
    } else if (type === 'fill_blank') {
      questions.push({
        id: questionId,
        type: 'fill_blank',
        question: `Complete the following: The key concept in "${title}" is _______.`,
        options: null,
        correct_answer: 'expected answer',
        points: difficulty === 'hard' ? 2 : 1,
      })
    }
  }

  return questions
}
