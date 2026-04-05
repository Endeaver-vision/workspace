'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuizStore } from '@/lib/store/quiz-store'
import type { QuizQuestion } from '@/types/training.types'

interface QuizTakerProps {
  quizId: string
  workspaceId: string
  userId?: string
  sopId?: string
}

// Test user ID for development
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function QuizTaker({ quizId, workspaceId, userId, sopId }: QuizTakerProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState(Date.now())
  const [timeElapsed, setTimeElapsed] = useState(0)

  const {
    currentQuiz,
    questions,
    quizResult,
    isLoading,
    isSubmitting,
    loadQuiz,
    startQuiz,
    submitAnswer,
    submitQuiz,
    clearSubmission,
  } = useQuizStore()

  // Load quiz
  useEffect(() => {
    loadQuiz(quizId)
    return () => clearSubmission()
  }, [quizId, loadQuiz, clearSubmission])

  // Start quiz when loaded
  useEffect(() => {
    if (currentQuiz && !quizResult) {
      startQuiz(quizId)
    }
  }, [currentQuiz, quizResult, quizId, startQuiz])

  // Timer
  useEffect(() => {
    if (quizResult) return

    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, quizResult])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
    submitAnswer(questionId, answer)
  }

  const handleSubmit = async () => {
    if (!currentQuiz) return

    const effectiveUserId = userId || TEST_USER_ID
    const effectiveSopId = sopId || currentQuiz.sop_id

    await submitQuiz(effectiveUserId, effectiveSopId)
  }

  const handleRetry = () => {
    clearSubmission()
    setAnswers({})
    setCurrentQuestionIndex(0)
    startQuiz(quizId)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0
    ? ((Object.keys(answers).length / questions.length) * 100)
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!currentQuiz) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-medium mb-2">Quiz not found</h2>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  // Results View
  if (quizResult) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-background px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Quiz Results</h1>
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-6">
          {/* Score Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                {quizResult.passed ? (
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                )}
                <h2 className="text-3xl font-bold mb-2">
                  {quizResult.score}%
                </h2>
                <Badge
                  variant={quizResult.passed ? 'default' : 'destructive'}
                  className="text-lg px-4 py-1"
                >
                  {quizResult.passed ? 'PASSED' : 'FAILED'}
                </Badge>
                <p className="text-muted-foreground mt-4">
                  You scored {quizResult.earned_points} out of {quizResult.total_points} points
                </p>
                <p className="text-sm text-muted-foreground">
                  Pass threshold: {currentQuiz.pass_threshold}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <h3 className="font-semibold mb-4">Question Review</h3>
          <div className="space-y-4">
            {quizResult.question_results.map((result, index) => {
              const question = questions.find((q) => q.id === result.question_id)
              if (!question) return null

              return (
                <Card key={result.question_id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className={result.correct ? 'text-green-600' : 'text-red-600'}>
                            Your answer: {result.user_answer || '(No answer)'}
                          </p>
                          {!result.correct && (
                            <p className="text-muted-foreground">
                              Correct answer: {result.correct_answer}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {result.points_earned}/{result.points_possible}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 mt-8">
            {!quizResult.passed && (
              <Button onClick={handleRetry}>
                Retry Quiz
              </Button>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              Back to SOP
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Taking View
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-semibold">{currentQuiz.title}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
              <Badge variant="secondary">
                {Object.keys(answers).length} / {questions.length}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Questions */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className={answers[question.id] ? 'border-green-200' : ''}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Question {index + 1}</span>
                  <Badge variant="outline">{question.points} pts</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{question.question}</p>

                {/* Multiple Choice */}
                {question.type === 'multiple_choice' && question.options && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-2 p-3 rounded-md border hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleAnswerChange(question.id, option.id)}
                        >
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {/* True/False */}
                {question.type === 'true_false' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <div className="flex gap-4">
                      <div
                        className="flex items-center gap-2 p-3 rounded-md border hover:bg-muted/50 cursor-pointer flex-1"
                        onClick={() => handleAnswerChange(question.id, 'true')}
                      >
                        <RadioGroupItem value="true" id={`true-${question.id}`} />
                        <Label htmlFor={`true-${question.id}`} className="cursor-pointer">
                          True
                        </Label>
                      </div>
                      <div
                        className="flex items-center gap-2 p-3 rounded-md border hover:bg-muted/50 cursor-pointer flex-1"
                        onClick={() => handleAnswerChange(question.id, 'false')}
                      >
                        <RadioGroupItem value="false" id={`false-${question.id}`} />
                        <Label htmlFor={`false-${question.id}`} className="cursor-pointer">
                          False
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                )}

                {/* Fill in the Blank */}
                {question.type === 'fill_blank' && (
                  <Input
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer"
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
