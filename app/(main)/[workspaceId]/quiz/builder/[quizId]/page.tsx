'use client'

import { use } from 'react'
import { QuizBuilder } from '@/components/quiz'

interface QuizBuilderPageProps {
  params: Promise<{
    workspaceId: string
    quizId: string
  }>
  searchParams: Promise<{
    sopId?: string
  }>
}

export default function QuizBuilderPage({ params, searchParams }: QuizBuilderPageProps) {
  const { workspaceId, quizId } = use(params)
  const { sopId } = use(searchParams)

  return (
    <QuizBuilder
      quizId={quizId}
      workspaceId={workspaceId}
      sopId={sopId}
    />
  )
}
