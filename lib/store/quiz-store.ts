import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type {
  Quiz,
  QuizInsert,
  QuizUpdate,
  QuizQuestion,
  QuizQuestionInsert,
  QuizQuestionUpdate,
  QuizSubmission,
  QuizResult,
  QuestionResult,
  QuizOption,
} from '@/types/training.types'

interface QuizState {
  // Quiz data
  quizzes: Quiz[]
  currentQuiz: Quiz | null
  questions: QuizQuestion[]

  // Quiz taking state
  activeSubmission: QuizSubmission | null
  quizResult: QuizResult | null

  // Loading states
  isLoading: boolean
  isSaving: boolean
  isSubmitting: boolean
  error: string | null

  // Quiz CRUD
  loadQuizzes: (sopId?: string) => Promise<void>
  loadQuiz: (quizId: string) => Promise<void>
  createQuiz: (quiz: QuizInsert) => Promise<Quiz | null>
  updateQuiz: (quizId: string, updates: QuizUpdate) => Promise<void>
  deleteQuiz: (quizId: string) => Promise<void>

  // Question CRUD
  loadQuestions: (quizId: string) => Promise<void>
  addQuestion: (question: QuizQuestionInsert) => Promise<QuizQuestion | null>
  updateQuestion: (questionId: string, updates: QuizQuestionUpdate) => Promise<void>
  deleteQuestion: (questionId: string) => Promise<void>
  reorderQuestions: (questionIds: string[]) => Promise<void>

  // Quiz Taking
  startQuiz: (quizId: string) => void
  submitAnswer: (questionId: string, answer: string) => void
  submitQuiz: (userId: string, sopId: string) => Promise<QuizResult | null>
  clearSubmission: () => void

  // Reset
  reset: () => void
}

const initialState = {
  quizzes: [],
  currentQuiz: null,
  questions: [],
  activeSubmission: null,
  quizResult: null,
  isLoading: false,
  isSaving: false,
  isSubmitting: false,
  error: null,
}

export const useQuizStore = create<QuizState>((set, get) => ({
  ...initialState,

  loadQuizzes: async (sopId?: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      let query = (supabase
        .from('quizzes') as any)
        .select(`
          *,
          sop:sops(id, title, status)
        `)
        .order('created_at', { ascending: false })

      if (sopId) {
        query = query.eq('sop_id', sopId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ quizzes: data || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  loadQuiz: async (quizId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('quizzes') as any)
        .select(`
          *,
          sop:sops(id, title, status),
          questions:quiz_questions(*)
        `)
        .eq('id', quizId)
        .single()

      if (error) throw error

      // Sort questions by order_index
      const questions = (data.questions || []).sort(
        (a: QuizQuestion, b: QuizQuestion) => a.order_index - b.order_index
      )

      set({
        currentQuiz: data,
        questions,
        isLoading: false,
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createQuiz: async (quiz: QuizInsert) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('quizzes') as any)
        .insert({
          ...quiz,
          pass_threshold: quiz.pass_threshold ?? 70,
          is_graded: quiz.is_graded ?? true,
        })
        .select(`
          *,
          sop:sops(id, title, status)
        `)
        .single()

      if (error) throw error

      const { quizzes } = get()
      set({ quizzes: [data, ...quizzes], currentQuiz: data, isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  updateQuiz: async (quizId: string, updates: QuizUpdate) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('quizzes') as any)
        .update(updates)
        .eq('id', quizId)
        .select(`
          *,
          sop:sops(id, title, status)
        `)
        .single()

      if (error) throw error

      const { quizzes, currentQuiz } = get()
      set({
        quizzes: quizzes.map(q => (q.id === quizId ? data : q)),
        currentQuiz: currentQuiz?.id === quizId ? data : currentQuiz,
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  deleteQuiz: async (quizId: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('quizzes') as any)
        .delete()
        .eq('id', quizId)

      if (error) throw error

      const { quizzes, currentQuiz } = get()
      set({
        quizzes: quizzes.filter(q => q.id !== quizId),
        currentQuiz: currentQuiz?.id === quizId ? null : currentQuiz,
        questions: currentQuiz?.id === quizId ? [] : get().questions,
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  // Question CRUD
  loadQuestions: async (quizId: string) => {
    set({ isLoading: true, error: null })
    const supabase = createClient()

    try {
      const { data, error } = await (supabase
        .from('quiz_questions') as any)
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index')

      if (error) throw error

      set({ questions: data || [], isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  addQuestion: async (question: QuizQuestionInsert) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()
    const { questions } = get()

    try {
      const { data, error } = await (supabase
        .from('quiz_questions') as any)
        .insert({
          ...question,
          order_index: question.order_index ?? questions.length,
          points: question.points ?? 1,
        })
        .select()
        .single()

      if (error) throw error

      set({ questions: [...questions, data], isSaving: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
      return null
    }
  },

  updateQuestion: async (questionId: string, updates: QuizQuestionUpdate) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('quiz_questions') as any)
        .update(updates)
        .eq('id', questionId)

      if (error) throw error

      const { questions } = get()
      set({
        questions: questions.map(q =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  deleteQuestion: async (questionId: string) => {
    set({ isSaving: true, error: null })
    const supabase = createClient()

    try {
      const { error } = await (supabase
        .from('quiz_questions') as any)
        .delete()
        .eq('id', questionId)

      if (error) throw error

      const { questions } = get()
      set({
        questions: questions.filter(q => q.id !== questionId),
        isSaving: false,
      })
    } catch (error: any) {
      set({ error: error.message, isSaving: false })
    }
  },

  reorderQuestions: async (questionIds: string[]) => {
    const { questions } = get()
    const supabase = createClient()

    // Optimistic update
    const reordered = questionIds.map((id, index) => {
      const q = questions.find(q => q.id === id)!
      return { ...q, order_index: index }
    })
    set({ questions: reordered })

    try {
      for (let i = 0; i < questionIds.length; i++) {
        await (supabase
          .from('quiz_questions') as any)
          .update({ order_index: i })
          .eq('id', questionIds[i])
      }
    } catch (error: any) {
      // Revert on error
      set({ questions, error: error.message })
    }
  },

  // Quiz Taking
  startQuiz: (quizId: string) => {
    set({
      activeSubmission: {
        quiz_id: quizId,
        answers: [],
        time_spent_seconds: 0,
      },
      quizResult: null,
    })
  },

  submitAnswer: (questionId: string, answer: string) => {
    const { activeSubmission } = get()
    if (!activeSubmission) return

    const existingIndex = activeSubmission.answers.findIndex(
      a => a.question_id === questionId
    )

    let newAnswers = [...activeSubmission.answers]
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { question_id: questionId, answer }
    } else {
      newAnswers.push({ question_id: questionId, answer })
    }

    set({
      activeSubmission: {
        ...activeSubmission,
        answers: newAnswers,
      },
    })
  },

  submitQuiz: async (userId: string, sopId: string) => {
    const { activeSubmission, questions, currentQuiz } = get()
    if (!activeSubmission || !currentQuiz) return null

    set({ isSubmitting: true, error: null })
    const supabase = createClient()

    try {
      // Grade the quiz
      let totalPoints = 0
      let earnedPoints = 0
      const questionResults: QuestionResult[] = []

      for (const question of questions) {
        const userAnswer = activeSubmission.answers.find(
          a => a.question_id === question.id
        )
        const userAnswerValue = userAnswer?.answer || ''

        let isCorrect = false
        let correctAnswer = ''

        if (question.type === 'multiple_choice' && question.options) {
          const correctOption = question.options.find((o: QuizOption) => o.isCorrect)
          correctAnswer = correctOption?.id || ''
          isCorrect = userAnswerValue === correctAnswer
        } else if (question.type === 'true_false') {
          correctAnswer = question.correct_answer || ''
          isCorrect = userAnswerValue.toLowerCase() === correctAnswer.toLowerCase()
        } else if (question.type === 'fill_blank') {
          correctAnswer = question.correct_answer || ''
          isCorrect = userAnswerValue.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
        }

        totalPoints += question.points
        if (isCorrect) {
          earnedPoints += question.points
        }

        questionResults.push({
          question_id: question.id,
          correct: isCorrect,
          user_answer: userAnswerValue,
          correct_answer: correctAnswer,
          points_earned: isCorrect ? question.points : 0,
          points_possible: question.points,
        })
      }

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
      const passed = score >= (currentQuiz.pass_threshold || 70)

      // Save completion
      const { data: completion, error: completionError } = await (supabase
        .from('completions') as any)
        .insert({
          user_id: userId,
          sop_id: sopId,
          quiz_id: currentQuiz.id,
          score,
          passed,
          time_spent_seconds: activeSubmission.time_spent_seconds,
          answers: activeSubmission.answers,
        })
        .select()
        .single()

      if (completionError) throw completionError

      // If passed and graded, create certificate
      let certificate = undefined
      if (passed && currentQuiz.is_graded) {
        const { data: cert, error: certError } = await (supabase
          .from('certificates') as any)
          .insert({
            user_id: userId,
            sop_id: sopId,
            completion_id: completion.id,
          })
          .select()
          .single()

        if (!certError) {
          certificate = cert
        }
      }

      const result: QuizResult = {
        quiz_id: currentQuiz.id,
        score,
        passed,
        total_points: totalPoints,
        earned_points: earnedPoints,
        question_results: questionResults,
        completion,
        certificate,
      }

      set({
        quizResult: result,
        activeSubmission: null,
        isSubmitting: false,
      })

      return result
    } catch (error: any) {
      set({ error: error.message, isSubmitting: false })
      return null
    }
  },

  clearSubmission: () => {
    set({
      activeSubmission: null,
      quizResult: null,
    })
  },

  reset: () => set(initialState),
}))
