'use client'

import { use } from 'react'
import { QuizTaker } from '@/components/quiz'

interface QuizTakePageProps {
  params: Promise<{
    workspaceId: string
    quizId: string
  }>
  searchParams: Promise<{
    userId?: string
    sopId?: string
  }>
}

export default function QuizTakePage({ params, searchParams }: QuizTakePageProps) {
  const { workspaceId, quizId } = use(params)
  const { userId, sopId } = use(searchParams)

  return (
    <QuizTaker
      quizId={quizId}
      workspaceId={workspaceId}
      userId={userId}
      sopId={sopId}
    />
  )
}
