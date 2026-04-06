'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Sidebar, TopNav, Breadcrumb } from '@/components/layout'
import { WelcomeModal } from '@/components/layout'
import { AIChatAssistant } from '@/components/ai'
import type { UserRole } from '@/types/training.types'

// Test user data for development
const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin' as UserRole,
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const workspaceId = params?.workspaceId as string || '00000000-0000-0000-0000-000000000002'
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar workspaceId={workspaceId} userRole={TEST_USER.role} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navigation */}
        <TopNav
          workspaceId={workspaceId}
          userName={TEST_USER.name}
          userRole={TEST_USER.role}
          userEmail={TEST_USER.email}
        />

        {/* Breadcrumb */}
        <Breadcrumb workspaceId={workspaceId} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Welcome modal for new users */}
      <WelcomeModal
        userName={TEST_USER.name}
        userRole={TEST_USER.role}
        workspaceId={workspaceId}
        isNewUser={true}
      />

      {/* Floating AI chat assistant */}
      <AIChatAssistant workspaceId={workspaceId} />
    </div>
  )
}
