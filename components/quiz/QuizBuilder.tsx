'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Save, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QuestionEditor } from './QuestionEditor'
import { useQuizStore } from '@/lib/store/quiz-store'
import type { QuizQuestionInsert, QuestionType } from '@/types/training.types'

interface QuizBuilderProps {
  quizId: string
  workspaceId: string
  sopId?: string
}

// Test user ID for development
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function QuizBuilder({ quizId, workspaceId, sopId }: QuizBuilderProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [passThreshold, setPassThreshold] = useState(70)
  const [isGraded, setIsGraded] = useState(true)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const {
    currentQuiz,
    questions,
    isLoading,
    isSaving,
    loadQuiz,
    createQuiz,
    updateQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
  } = useQuizStore()

  const isNew = quizId === 'new'

  // Load quiz
  useEffect(() => {
    if (!isNew) {
      loadQuiz(quizId)
    }
  }, [quizId, isNew, loadQuiz])

  // Initialize form
  useEffect(() => {
    if (currentQuiz) {
      setTitle(currentQuiz.title)
      setDescription(currentQuiz.description || '')
      setPassThreshold(currentQuiz.pass_threshold)
      setIsGraded(currentQuiz.is_graded)
      setTimeLimitMinutes(currentQuiz.time_limit_minutes)
      setHasChanges(false)
    }
  }, [currentQuiz])

  const handleSave = async () => {
    if (isNew) {
      if (!sopId) {
        alert('SOP ID is required to create a quiz')
        return
      }
      const quiz = await createQuiz({
        sop_id: sopId,
        title: title || 'Untitled Quiz',
        description: description || null,
        pass_threshold: passThreshold,
        is_graded: isGraded,
        time_limit_minutes: timeLimitMinutes,
        created_by: TEST_USER_ID,
      })
      if (quiz) {
        router.replace(`/${workspaceId}/quiz/builder/${quiz.id}`)
      }
    } else {
      await updateQuiz(quizId, {
        title,
        description: description || null,
        pass_threshold: passThreshold,
        is_graded: isGraded,
        time_limit_minutes: timeLimitMinutes,
      })
    }
    setHasChanges(false)
  }

  const handleAddQuestion = async (type: QuestionType) => {
    if (isNew) {
      alert('Please save the quiz first')
      return
    }

    const defaultQuestion: QuizQuestionInsert = {
      quiz_id: quizId,
      type,
      question: '',
      options: type === 'multiple_choice' ? [
        { id: crypto.randomUUID(), text: 'Option 1', isCorrect: false },
        { id: crypto.randomUUID(), text: 'Option 2', isCorrect: false },
      ] : null,
      correct_answer: type === 'true_false' ? 'true' : '',
      points: 1,
    }

    await addQuestion(defaultQuestion)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      await deleteQuestion(questionId)
    }
  }

  const handleBack = () => {
    if (sopId) {
      router.push(`/${workspaceId}/sop/${sopId}`)
    } else {
      router.push(`/${workspaceId}/sops`)
    }
  }

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {isNew ? 'New Quiz' : 'Edit Quiz'}
            </h1>
            {!isNew && currentQuiz?.sop && (
              <p className="text-sm text-muted-foreground">
                For: {currentQuiz.sop.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-muted-foreground">Unsaved changes</span>
          )}
          <Button onClick={handleSave} disabled={isSaving || (!title && isNew)}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Questions List */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Quiz Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setHasChanges(true)
                    }}
                    placeholder="Enter quiz title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      setHasChanges(true)
                    }}
                    placeholder="Enter quiz description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            {!isNew && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Questions ({questions.length})
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion('multiple_choice')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Multiple Choice
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion('true_false')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      True/False
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion('fill_blank')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Fill Blank
                    </Button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <p className="text-muted-foreground mb-4">
                        No questions yet. Add your first question!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <QuestionEditor
                        key={question.id}
                        question={question}
                        index={index}
                        onUpdate={(updates) => updateQuestion(question.id, updates)}
                        onDelete={() => handleDeleteQuestion(question.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Settings Sidebar */}
        <div className="w-80 border-l bg-muted/30 p-6">
          <h3 className="font-semibold mb-6">Quiz Settings</h3>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pass Threshold</Label>
                <span className="text-sm font-medium">{passThreshold}%</span>
              </div>
              <Slider
                value={[passThreshold]}
                onValueChange={([value]) => {
                  setPassThreshold(value)
                  setHasChanges(true)
                }}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Graded Quiz</Label>
                <p className="text-xs text-muted-foreground">
                  Show score and pass/fail
                </p>
              </div>
              <Switch
                checked={isGraded}
                onCheckedChange={(checked) => {
                  setIsGraded(checked)
                  setHasChanges(true)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={0}
                value={timeLimitMinutes || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null
                  setTimeLimitMinutes(value)
                  setHasChanges(true)
                }}
                placeholder="No limit"
              />
            </div>

            {!isNew && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total Points: {questions.reduce((sum, q) => sum + q.points, 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Questions: {questions.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
