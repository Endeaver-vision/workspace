'use client'

import { useState } from 'react'
import { Trash2, GripVertical, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import type { QuizQuestion, QuizQuestionUpdate, QuizOption } from '@/types/training.types'

interface QuestionEditorProps {
  question: QuizQuestion
  index: number
  onUpdate: (updates: QuizQuestionUpdate) => void
  onDelete: () => void
}

const typeLabels = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
}

export function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: QuestionEditorProps) {
  const handleQuestionChange = (value: string) => {
    onUpdate({ question: value })
  }

  const handlePointsChange = (value: string) => {
    const points = parseInt(value) || 1
    onUpdate({ points: Math.max(1, points) })
  }

  // Multiple choice handlers
  const handleOptionTextChange = (optionId: string, text: string) => {
    const options = (question.options || []).map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt
    )
    onUpdate({ options })
  }

  const handleCorrectOptionChange = (optionId: string) => {
    const options = (question.options || []).map((opt) => ({
      ...opt,
      isCorrect: opt.id === optionId,
    }))
    onUpdate({ options })
  }

  const handleAddOption = () => {
    const options = [
      ...(question.options || []),
      { id: crypto.randomUUID(), text: '', isCorrect: false },
    ]
    onUpdate({ options })
  }

  const handleRemoveOption = (optionId: string) => {
    const options = (question.options || []).filter((opt) => opt.id !== optionId)
    onUpdate({ options })
  }

  // True/False handler
  const handleTrueFalseChange = (value: string) => {
    onUpdate({ correct_answer: value })
  }

  // Fill blank handler
  const handleCorrectAnswerChange = (value: string) => {
    onUpdate({ correct_answer: value })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <span className="text-sm font-medium">Question {index + 1}</span>
            <Badge variant="secondary" className="text-xs">
              {typeLabels[question.type]}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`points-${question.id}`} className="text-sm">
                Points:
              </Label>
              <Input
                id={`points-${question.id}`}
                type="number"
                min={1}
                value={question.points}
                onChange={(e) => handlePointsChange(e.target.value)}
                className="w-16 h-8"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor={`question-${question.id}`}>Question</Label>
          <Textarea
            id={`question-${question.id}`}
            value={question.question}
            onChange={(e) => handleQuestionChange(e.target.value)}
            placeholder="Enter your question"
            rows={2}
          />
        </div>

        {/* Multiple Choice Options */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
            <Label>Options (select the correct answer)</Label>
            {(question.options || []).map((option, optIndex) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={option.isCorrect}
                  onChange={() => handleCorrectOptionChange(option.id)}
                  className="h-4 w-4"
                />
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                  placeholder={`Option ${optIndex + 1}`}
                  className="flex-1"
                />
                {(question.options || []).length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(option.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {(question.options || []).length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            )}
          </div>
        )}

        {/* True/False */}
        {question.type === 'true_false' && (
          <div className="space-y-3">
            <Label>Correct Answer</Label>
            <RadioGroup
              value={question.correct_answer || 'true'}
              onValueChange={handleTrueFalseChange}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="true" id={`true-${question.id}`} />
                <Label htmlFor={`true-${question.id}`}>True</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="false" id={`false-${question.id}`} />
                <Label htmlFor={`false-${question.id}`}>False</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Fill in the Blank */}
        {question.type === 'fill_blank' && (
          <div className="space-y-2">
            <Label htmlFor={`answer-${question.id}`}>Correct Answer</Label>
            <Input
              id={`answer-${question.id}`}
              value={question.correct_answer || ''}
              onChange={(e) => handleCorrectAnswerChange(e.target.value)}
              placeholder="Enter the correct answer"
            />
            <p className="text-xs text-muted-foreground">
              User's answer will be matched exactly (case-insensitive)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
