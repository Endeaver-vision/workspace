'use client'

import { use } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LearnerDashboard } from '@/components/training'
import Link from 'next/link'

// Test user ID for development
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

interface TrainingPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default function TrainingPage({ params }: TrainingPageProps) {
  const { workspaceId } = use(params)

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href={`/${workspaceId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">My Training</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <LearnerDashboard workspaceId={workspaceId} userId={TEST_USER_ID} />
      </div>
    </div>
  )
}
