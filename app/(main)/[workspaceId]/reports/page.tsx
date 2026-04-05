'use client'

import { use } from 'react'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComplianceReport } from '@/components/training'
import Link from 'next/link'

interface ReportsPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default function ReportsPage({ params }: ReportsPageProps) {
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
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Compliance Reports</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <ComplianceReport workspaceId={workspaceId} />
      </div>
    </div>
  )
}
