'use client'

import { use } from 'react'
import { ArrowLeft, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MyCertificates } from '@/components/certificates'
import Link from 'next/link'

// Test user for development
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
const TEST_USER_NAME = 'Test User'

interface CertificatesPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default function CertificatesPage({ params }: CertificatesPageProps) {
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
          <Award className="h-5 w-5 text-amber-500" />
          <h1 className="text-lg font-semibold">My Certificates</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <MyCertificates
          workspaceId={workspaceId}
          userId={TEST_USER_ID}
          userName={TEST_USER_NAME}
        />
      </div>
    </div>
  )
}
