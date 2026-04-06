'use client'

import { useState, useCallback } from 'react'
import { Sparkles, Loader2, Check, Edit2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { QuizQuestion, QuestionType, QuizOption } from '@/types/training.types'

interface AIQuizGeneratorProps {
  sopId: string
  sopTitle: string
  sopContent: any // BlockNote content
  onGenerate: (questions: Partial<QuizQuestion>[]) => void
  disabled?: boolean
}

interface GeneratedQuestion {
  id: string
  type: QuestionType
  question: string
  options: QuizOption[] | null
  correct_answer: string | null
  points: number
}

export function AIQuizGenerator({
  sopId,
  sopTitle,
  sopContent,
  onGenerate,
  disabled,
}: AIQuizGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [numQuestions, setNumQuestions] = useState('5')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['multiple_choice', 'true_false'])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGeneratedQuestions([])

    try {
      const response = await fetch('/api/v1/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopId,
          sopTitle,
          content: sopContent,
          numQuestions: parseInt(numQuestions),
          difficulty,
          questionTypes,
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      setGeneratedQuestions(data.questions || [])
    } catch (error) {
      console.error('Quiz generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [sopId, sopTitle, sopContent, numQuestions, difficulty, questionTypes])

  const handleEditQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
    setGeneratedQuestions(prev =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    )
  }

  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const handleAccept = () => {
    onGenerate(generatedQuestions.map((q, index) => ({
      type: q.type,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points,
      order_index: index,
    })))
    setIsOpen(false)
    setGeneratedQuestions([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={<Button variant="outline" disabled={disabled} />}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate Quiz
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Quiz Generator
          </DialogTitle>
          <DialogDescription>
            Generate quiz questions from "{sopTitle}" using AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Generation Options */}
          {generatedQuestions.length === 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Select value={numQuestions} onValueChange={(v) => v && setNumQuestions(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 questions</SelectItem>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => v && setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Question Types</Label>
                <Select
                  value={questionTypes.join(',')}
                  onValueChange={(v) => v && setQuestionTypes(v.split(',') as QuestionType[])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice,true_false">Mixed</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice Only</SelectItem>
                    <SelectItem value="true_false">True/False Only</SelectItem>
                    <SelectItem value="fill_blank">Fill in Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Generated Questions */}
          {generatedQuestions.length > 0 && (
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {generatedQuestions.map((question, index) => (
                  <Card key={question.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Q{index + 1}</Badge>
                          <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={question.question}
                        onChange={(e) => handleEditQuestion(index, { question: e.target.value })}
                        className="min-h-[60px]"
                      />

                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                          <Label className="text-xs">Options (mark correct)</Label>
                          {question.options.map((option, optIndex) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={option.isCorrect}
                                onChange={() => {
                                  const newOptions = question.options!.map((o, i) => ({
                                    ...o,
                                    isCorrect: i === optIndex,
                                  }))
                                  handleEditQuestion(index, { options: newOptions })
                                }}
                              />
                              <Input
                                value={option.text}
                                onChange={(e) => {
                                  const newOptions = [...question.options!]
                                  newOptions[optIndex] = { ...option, text: e.target.value }
                                  handleEditQuestion(index, { options: newOptions })
                                }}
                                className="flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === 'true_false' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Correct Answer</Label>
                          <Select
                            value={question.correct_answer || 'true'}
                            onValueChange={(value) => handleEditQuestion(index, { correct_answer: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {question.type === 'fill_blank' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Correct Answer</Label>
                          <Input
                            value={question.correct_answer || ''}
                            onChange={(e) => handleEditQuestion(index, { correct_answer: e.target.value })}
                            placeholder="Enter the correct answer"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing SOP content and generating questions...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {generatedQuestions.length === 0 ? (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setGeneratedQuestions([])}>
                Regenerate
              </Button>
              <Button onClick={handleAccept}>
                <Check className="h-4 w-4 mr-2" />
                Add {generatedQuestions.length} Questions
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
