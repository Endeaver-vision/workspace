'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { PartialBlock } from '@blocknote/core'

// Dynamically import the editor client to avoid SSR issues
const EditorClient = dynamic(
  () => import('./EditorClient').then((mod) => mod.EditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] animate-pulse bg-neutral-100 dark:bg-neutral-900 rounded-lg" />
    ),
  }
)

interface EditorProps {
  initialContent?: PartialBlock[]
  onChange?: (content: PartialBlock[]) => void
  editable?: boolean
}

export function Editor({
  initialContent,
  onChange,
  editable = true,
}: EditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-[200px] animate-pulse bg-neutral-100 dark:bg-neutral-900 rounded-lg" />
    )
  }

  return (
    <EditorClient
      initialContent={initialContent}
      onChange={onChange}
      editable={editable}
    />
  )
}
