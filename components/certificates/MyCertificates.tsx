'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Award, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssignmentStore } from '@/lib/store/assignment-store'
import { CertificateCard } from './CertificateCard'
import { CertificatePreviewModal } from './CertificatePreviewModal'
import { CertificateTemplate } from './CertificateTemplate'
import type { Certificate } from '@/types/training.types'

interface MyCertificatesProps {
  workspaceId: string
  userId: string
  userName: string
}

type FilterStatus = 'all' | 'valid' | 'expired'

export function MyCertificates({ workspaceId, userId, userName }: MyCertificatesProps) {
  const { certificates, isLoading, loadCertificates } = useAssignmentStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCertificates(userId)
  }, [userId, loadCertificates])

  const filteredCertificates = certificates.filter((cert) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      if (!cert.sop?.title?.toLowerCase().includes(searchLower) &&
          !cert.certificate_number.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Status filter
    const isExpired = cert.expires_at
      ? new Date(cert.expires_at) < new Date()
      : false

    if (statusFilter === 'valid' && isExpired) return false
    if (statusFilter === 'expired' && !isExpired) return false

    return true
  })

  // Stats
  const totalCertificates = certificates.length
  const validCount = certificates.filter(c => !c.expires_at || new Date(c.expires_at) >= new Date()).length
  const expiredCount = certificates.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length

  const handlePreview = useCallback((certificate: Certificate) => {
    setPreviewCertificate(certificate)
  }, [])

  const handleDownload = useCallback((certificate: Certificate) => {
    // Open preview which has download functionality
    setPreviewCertificate(certificate)
  }, [])

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{totalCertificates}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{validCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-gray-400" />
              <span className="text-2xl font-bold">{expiredCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as FilterStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Certificates</SelectItem>
                  <SelectItem value="valid">Valid Only</SelectItem>
                  <SelectItem value="expired">Expired Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {certificates.length === 0 ? (
              <>
                <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No certificates earned yet.</p>
                <p className="text-sm mt-1">Complete training to earn certificates.</p>
              </>
            ) : (
              <p>No certificates match your filters.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onPreview={() => handlePreview(certificate)}
              onDownload={() => handleDownload(certificate)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <CertificatePreviewModal
        open={!!previewCertificate}
        onOpenChange={(open) => !open && setPreviewCertificate(null)}
        certificate={previewCertificate}
        userName={userName}
      />
    </div>
  )
}
