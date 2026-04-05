'use client'

import { use } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserList } from '@/components/users'
import Link from 'next/link'

interface UsersPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default function UsersPage({ params }: UsersPageProps) {
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
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">User Management</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <UserList workspaceId={workspaceId} />
      </div>
    </div>
  )
}
