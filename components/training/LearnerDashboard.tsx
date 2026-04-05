'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { FileText, BookOpen, Award, Clock, CheckCircle, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAssignmentStore } from '@/lib/store/assignment-store'
import { cn } from '@/lib/utils'
import type { AssignmentStatus } from '@/types/training.types'

interface LearnerDashboardProps {
  workspaceId: string
  userId: string
}

const statusConfig: Record<AssignmentStatus | 'not_started', { label: string; icon: typeof Clock; color: string }> = {
  pending: {
    label: 'Not Started',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
  not_started: {
    label: 'Not Started',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  completed: {
    label: 'Complete',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  overdue: {
    label: 'Overdue',
    icon: Clock,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
}

export function LearnerDashboard({ workspaceId, userId }: LearnerDashboardProps) {
  const {
    userAssignments,
    certificates,
    isLoading,
    loadLearnerDashboard
  } = useAssignmentStore()

  useEffect(() => {
    loadLearnerDashboard(userId)
  }, [userId, loadLearnerDashboard])

  // Calculate stats
  const totalAssignments = userAssignments.length
  const completedCount = userAssignments.filter(a => a.status === 'completed').length
  const inProgressCount = userAssignments.filter(a => a.status === 'in_progress').length
  const overdueCount = userAssignments.filter(a => a.status === 'overdue').length
  const overallProgress = totalAssignments > 0
    ? Math.round((completedCount / totalAssignments) * 100)
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalAssignments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{completedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{certificates.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned SOPs */}
      <Card>
        <CardHeader>
          <CardTitle>My Training</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {userAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No training assignments yet.
              </div>
            ) : (
              <div className="space-y-4">
                {userAssignments.map((assignment) => {
                  const config = statusConfig[assignment.status] || statusConfig.pending
                  const StatusIcon = config.icon
                  const progress = assignment.progress_percent

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {assignment.sop?.title || 'Untitled SOP'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge
                              variant="secondary"
                              className={cn('text-xs', config.color)}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {assignment.due_date && (
                              <span className="text-xs text-muted-foreground">
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {assignment.status !== 'pending' && (
                            <div className="mt-2 flex items-center gap-2">
                              <Progress value={progress} className="h-1.5 flex-1 max-w-[200px]" />
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Link href={`/${workspaceId}/sop/${assignment.sop_id}`}>
                        <Button variant="outline" size="sm">
                          {assignment.status === 'completed' ? 'Review' : assignment.status === 'in_progress' ? 'Continue' : 'Start'}
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Certificates */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Award className="h-10 w-10 text-yellow-500" />
                      <div>
                        <h4 className="font-medium">{cert.sop?.title || `Certificate #${cert.certificate_number}`}</h4>
                        <p className="text-xs text-muted-foreground">
                          Issued: {new Date(cert.issued_at).toLocaleDateString()}
                        </p>
                        {cert.expires_at && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(cert.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
