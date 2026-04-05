'use client'

import { useEffect, useState, useMemo } from 'react'
import { Download, Filter, Search, Users, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAssignmentStore } from '@/lib/store/assignment-store'
import { cn } from '@/lib/utils'
import type { ComplianceRow } from '@/types/training.types'

interface ComplianceReportProps {
  workspaceId: string
}

interface FilterState {
  search: string
  status: 'all' | 'compliant' | 'non_compliant' | 'in_progress'
  sopId: string | null
  dateFrom: string
  dateTo: string
}

interface UserReport {
  user_id: string
  user_name: string | null
  user_email: string | null
  total_assignments: number
  completed_count: number
  compliance_rate: number
}

const statusConfig = {
  compliant: {
    label: 'Compliant',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  non_compliant: {
    label: 'Non-Compliant',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
}

export function ComplianceReport({ workspaceId }: ComplianceReportProps) {
  const {
    complianceReport,
    isLoading,
    generateComplianceReport,
  } = useAssignmentStore()

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    sopId: null,
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    generateComplianceReport({
      workspace_id: workspaceId,
      sop_ids: filters.sopId ? [filters.sopId] : undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
    })
  }, [workspaceId, filters.sopId, filters.dateFrom, filters.dateTo, generateComplianceReport])

  // Transform raw data into user-based reports
  const userReports = useMemo(() => {
    if (!complianceReport?.data) return []

    const userMap = new Map<string, UserReport>()

    complianceReport.data.forEach((row: ComplianceRow) => {
      const userId = row.user?.id || 'unknown'

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: userId,
          user_name: row.user?.full_name || null,
          user_email: row.user?.email || null,
          total_assignments: 0,
          completed_count: 0,
          compliance_rate: 0,
        })
      }

      const report = userMap.get(userId)!
      report.total_assignments++
      if (row.assignment.status === 'completed') {
        report.completed_count++
      }
    })

    // Calculate compliance rates
    userMap.forEach(report => {
      report.compliance_rate = report.total_assignments > 0
        ? Math.round((report.completed_count / report.total_assignments) * 100)
        : 0
    })

    return Array.from(userMap.values())
  }, [complianceReport])

  // Get unique SOPs for filter dropdown
  const uniqueSOPs = useMemo(() => {
    if (!complianceReport?.data) return []

    const sopMap = new Map<string, { id: string; title: string }>()
    complianceReport.data.forEach((row: ComplianceRow) => {
      if (row.sop && !sopMap.has(row.sop.id)) {
        sopMap.set(row.sop.id, { id: row.sop.id, title: row.sop.title })
      }
    })
    return Array.from(sopMap.values())
  }, [complianceReport])

  // Filter user reports
  const filteredReports = useMemo(() => {
    return userReports.filter(user => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (!user.user_name?.toLowerCase().includes(searchLower) &&
            !user.user_email?.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        const isCompliant = user.compliance_rate === 100
        const isInProgress = user.compliance_rate > 0 && user.compliance_rate < 100

        if (filters.status === 'compliant' && !isCompliant) return false
        if (filters.status === 'non_compliant' && (isCompliant || isInProgress)) return false
        if (filters.status === 'in_progress' && !isInProgress) return false
      }

      return true
    })
  }, [userReports, filters.search, filters.status])

  // Calculate totals
  const totalUsers = userReports.length
  const totalAssignments = complianceReport?.summary?.total_assignments || 0
  const completedCount = complianceReport?.summary?.completed || 0
  const overallComplianceRate = complianceReport?.summary?.completion_rate || 0

  const handleExportCSV = () => {
    const headers = ['User', 'Email', 'Total Assignments', 'Completed', 'Compliance Rate']
    const rows = filteredReports.map(user => [
      user.user_name || 'Unknown',
      user.user_email || '',
      user.total_assignments,
      user.completed_count,
      `${user.compliance_rate}%`
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    URL.revokeObjectURL(url)
  }

  const getUserStatus = (complianceRate: number) => {
    if (complianceRate === 100) return 'compliant'
    if (complianceRate > 0) return 'in_progress'
    return 'non_compliant'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallComplianceRate}%</div>
            <Progress value={overallComplianceRate} className="mt-2" />
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
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
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
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(f => ({ ...f, status: value as FilterState['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>SOP</Label>
              <Select
                value={filters.sopId || 'all'}
                onValueChange={(value) => setFilters(f => ({ ...f, sopId: value === 'all' ? null : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All SOPs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SOPs</SelectItem>
                  {uniqueSOPs.map(sop => (
                    <SelectItem key={sop.id} value={sop.id}>{sop.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((user) => {
                  const status = getUserStatus(user.compliance_rate)
                  const config = statusConfig[status]

                  return (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.user_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-xs', config.color)}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.total_assignments}</TableCell>
                      <TableCell>{user.completed_count}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'font-medium',
                          user.compliance_rate === 100 ? 'text-green-600' :
                          user.compliance_rate > 0 ? 'text-blue-600' : 'text-red-600'
                        )}>
                          {user.compliance_rate}%
                        </span>
                      </TableCell>
                      <TableCell className="w-[150px]">
                        <Progress value={user.compliance_rate} className="h-2" />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
