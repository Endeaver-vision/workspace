'use client'

import { forwardRef } from 'react'
import { Award } from 'lucide-react'
import type { Certificate } from '@/types/training.types'

interface CertificateTemplateProps {
  certificate: Certificate
  userName: string
  sopTitle: string
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  function CertificateTemplate({ certificate, userName, sopTitle }, ref) {
    const issuedDate = new Date(certificate.issued_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const expiresDate = certificate.expires_at
      ? new Date(certificate.expires_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

    return (
      <div
        ref={ref}
        className="certificate-template w-[800px] h-[600px] bg-white relative overflow-hidden"
        style={{
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Border decoration */}
        <div className="absolute inset-4 border-4 border-double border-amber-600" />
        <div className="absolute inset-8 border-2 border-amber-400" />

        {/* Corner decorations */}
        <div className="absolute top-12 left-12 w-20 h-20 border-t-4 border-l-4 border-amber-500" />
        <div className="absolute top-12 right-12 w-20 h-20 border-t-4 border-r-4 border-amber-500" />
        <div className="absolute bottom-12 left-12 w-20 h-20 border-b-4 border-l-4 border-amber-500" />
        <div className="absolute bottom-12 right-12 w-20 h-20 border-b-4 border-r-4 border-amber-500" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center">
          {/* Header with award icon */}
          <div className="flex items-center justify-center mb-4">
            <Award className="w-16 h-16 text-amber-600" />
          </div>

          <h1
            className="text-4xl font-bold text-amber-800 mb-2 tracking-wider"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            CERTIFICATE
          </h1>
          <p className="text-lg text-amber-700 mb-8 tracking-widest uppercase">
            of Completion
          </p>

          <p className="text-gray-600 mb-2">This is to certify that</p>

          <h2
            className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-amber-400 pb-2 px-8"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {userName}
          </h2>

          <p className="text-gray-600 mb-2">has successfully completed the training</p>

          <h3
            className="text-2xl font-semibold text-amber-800 mb-6"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {sopTitle}
          </h3>

          <p className="text-gray-500 mb-8">
            Issued on <span className="font-medium">{issuedDate}</span>
            {expiresDate && (
              <>
                {' • '}Valid until <span className="font-medium">{expiresDate}</span>
              </>
            )}
          </p>

          {/* Signature area */}
          <div className="flex justify-center gap-24 mt-4">
            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Training Administrator</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Department Head</p>
            </div>
          </div>

          {/* Certificate number */}
          <p className="absolute bottom-16 text-xs text-gray-400">
            Certificate No: {certificate.certificate_number}
          </p>
        </div>
      </div>
    )
  }
)
