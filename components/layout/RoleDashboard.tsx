'use client'

import Link from 'next/link'
import {
  BookOpen,
  GraduationCap,
  Award,
  Users,
  BarChart3,
  FileText,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/lib/context/workspace-context'
import type { UserRole } from '@/types/training.types'

interface RoleDashboardProps {
  workspaceId: string
  userRole: UserRole
  userName: string
  stats: {
    totalAssignments?: number
    completedAssignments?: number
    inProgressAssignments?: number
    overdueAssignments?: number
    certificates?: number
    totalUsers?: number
    totalSOPs?: number
    overallComplianceRate?: number
  }
}

export function RoleDashboard({ workspaceId, userRole, userName, stats }: RoleDashboardProps) {
  // Use urlPath (slug) for URLs to work with proxy
  const { urlPath } = useWorkspace()
  const completionRate = stats.totalAssignments && stats.totalAssignments > 0
    ? Math.round((stats.completedAssignments || 0) / stats.totalAssignments * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {userName.split(' ')[0]}!
        </h1>
        <p className="text-slate-600 mt-1">
          {userRole === 'learner' && 'Track your training progress and certifications.'}
          {userRole === 'trainer' && 'Manage training content and monitor learner progress.'}
          {userRole === 'admin' && 'Oversee the entire training platform and team compliance.'}
        </p>
      </div>

      {/* Learner Dashboard */}
      {userRole === 'learner' && (
        <>
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <Progress value={completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assigned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{stats.totalAssignments || 0}</span>
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
                  <span className="text-2xl font-bold">{stats.completedAssignments || 0}</span>
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
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold">{stats.certificates || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href={`/${urlPath}/training`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">Continue Training</h3>
                        <p className="text-sm text-muted-foreground">
                          {stats.inProgressAssignments || 0} in progress
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/${urlPath}/certificates`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Award className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">My Certificates</h3>
                        <p className="text-sm text-muted-foreground">
                          {stats.certificates || 0} earned
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/${urlPath}/sops`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">Browse SOPs</h3>
                        <p className="text-sm text-muted-foreground">
                          Explore training materials
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Trainer/Admin Dashboard */}
      {(userRole === 'trainer' || userRole === 'admin') && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overall Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overallComplianceRate || 0}%</div>
                <Progress value={stats.overallComplianceRate || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total SOPs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{stats.totalSOPs || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{stats.totalUsers || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">{stats.overdueAssignments || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href={`/${urlPath}/sops`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex flex-col items-center gap-2 pt-6">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-center">Create SOP</h3>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/${urlPath}/users`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex flex-col items-center gap-2 pt-6">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-medium text-center">Manage Users</h3>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/${urlPath}/reports`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex flex-col items-center gap-2 pt-6">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-medium text-center">View Reports</h3>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/${urlPath}/search`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex flex-col items-center gap-2 pt-6">
                      <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-amber-600" />
                      </div>
                      <h3 className="font-medium text-center">AI Assistant</h3>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
