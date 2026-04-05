'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save, Upload, MoreHorizontal, Eye, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSOPStore } from '@/lib/store/sop-store'
import type { SOPStatus } from '@/types/training.types'
import { cn } from '@/lib/utils'

// Dynamically import Editor to avoid SSR issues
const Editor = dynamic(
  () => import('@/components/editor/Editor').then((mod) => mod.Editor),
  { ssr: false, loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" /> }
)

interface SOPEditorProps {
  sopId: string
  workspaceId: string
}

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export function SOPEditor({ sopId, workspaceId }: SOPEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<any>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const {
    currentSOP,
    categories,
    isLoading,
    isSaving,
    loadSOP,
    loadCategories,
    updateSOP,
    publishSOP,
    archiveSOP,
    deleteSOP,
  } = useSOPStore()

  // Load SOP and categories
  useEffect(() => {
    loadSOP(sopId)
    loadCategories(workspaceId)
  }, [sopId, workspaceId, loadSOP, loadCategories])

  // Initialize form when SOP loads
  useEffect(() => {
    if (currentSOP) {
      setTitle(currentSOP.title)
      setContent(currentSOP.content)
      setCategoryId(currentSOP.category_id)
      setHasChanges(false)
    }
  }, [currentSOP])

  const handleSave = useCallback(async () => {
    if (!currentSOP) return

    await updateSOP(sopId, {
      title,
      content,
      category_id: categoryId,
    })
    setHasChanges(false)
  }, [currentSOP, sopId, title, content, categoryId, updateSOP])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    setHasChanges(true)
  }

  const handleContentChange = (newContent: any) => {
    setContent(newContent)
    setHasChanges(true)
  }

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value === 'none' ? null : value)
    setHasChanges(true)
  }

  const handlePublish = async () => {
    if (hasChanges) await handleSave()
    await publishSOP(sopId)
  }

  const handleArchive = async () => {
    await archiveSOP(sopId)
    router.push(`/${workspaceId}/sops`)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this SOP?')) {
      await deleteSOP(sopId)
      router.push(`/${workspaceId}/sops`)
    }
  }

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!currentSOP) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-medium mb-2">SOP not found</h2>
        <Button variant="outline" onClick={() => router.push(`/${workspaceId}/sops`)}>
          Back to Library
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${workspaceId}/sops`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Select value={categoryId || 'none'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge
            variant="secondary"
            className={cn('text-xs', statusColors[currentSOP.status])}
          >
            {currentSOP.status}
          </Badge>

          <span className="text-sm text-muted-foreground">v{currentSOP.version}</span>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-muted-foreground">Unsaved changes</span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          {currentSOP.status === 'draft' && (
            <Button size="sm" onClick={handlePublish}>
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {currentSOP.status !== 'archived' && (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled SOP"
            className="text-3xl font-bold border-none px-0 mb-6 focus-visible:ring-0 bg-transparent"
          />

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Editor
              initialContent={content}
              onChange={handleContentChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
