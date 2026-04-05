'use client'

import { useRef, useCallback } from 'react'
import { Download, X, Printer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CertificateTemplate } from './CertificateTemplate'
import type { Certificate } from '@/types/training.types'

interface CertificatePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: Certificate | null
  userName: string
}

export function CertificatePreviewModal({
  open,
  onOpenChange,
  certificate,
  userName,
}: CertificatePreviewModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null)

  const handlePrint = useCallback(() => {
    if (!certificateRef.current) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = certificateRef.current.innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${certificate?.sop?.title || 'Training'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .certificate-template {
              width: 800px;
              height: 600px;
              position: relative;
              overflow: hidden;
              font-family: Georgia, serif;
            }
            @media print {
              @page {
                size: landscape;
                margin: 0;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"><\/script>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [certificate])

  const handleDownload = useCallback(async () => {
    handlePrint() // Use print dialog which allows saving as PDF
  }, [handlePrint])

  if (!certificate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Certificate Preview</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto">
          <div className="transform scale-[0.85] origin-top">
            <CertificateTemplate
              ref={certificateRef}
              certificate={certificate}
              userName={userName}
              sopTitle={certificate.sop?.title || 'Training Completion'}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
