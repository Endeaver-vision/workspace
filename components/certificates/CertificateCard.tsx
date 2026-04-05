'use client'

import { Award, Calendar, Eye, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Certificate } from '@/types/training.types'
import { cn } from '@/lib/utils'

interface CertificateCardProps {
  certificate: Certificate
  onPreview: () => void
  onDownload: () => void
}

export function CertificateCard({ certificate, onPreview, onDownload }: CertificateCardProps) {
  const issuedDate = new Date(certificate.issued_at).toLocaleDateString()
  const expiresDate = certificate.expires_at
    ? new Date(certificate.expires_at).toLocaleDateString()
    : null

  const isExpired = certificate.expires_at
    ? new Date(certificate.expires_at) < new Date()
    : false

  return (
    <Card className={cn(
      'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:shadow-lg transition-shadow',
      isExpired && 'opacity-60'
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              isExpired ? 'bg-gray-200 dark:bg-gray-700' : 'bg-amber-100 dark:bg-amber-900/50'
            )}>
              <Award className={cn(
                'w-8 h-8',
                isExpired ? 'text-gray-500' : 'text-amber-600'
              )} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg truncate">
                {certificate.sop?.title || 'Training Certificate'}
              </h3>
              {isExpired && (
                <Badge variant="destructive" className="flex-shrink-0">
                  Expired
                </Badge>
              )}
            </div>

            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Issued: {issuedDate}
              </p>
              {expiresDate && (
                <p className={cn(
                  'text-sm flex items-center gap-2',
                  isExpired ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  <Calendar className="w-4 h-4" />
                  {isExpired ? 'Expired' : 'Expires'}: {expiresDate}
                </p>
              )}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Certificate #{certificate.certificate_number}
            </p>

            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
