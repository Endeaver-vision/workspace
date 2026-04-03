'use client'

import { useState } from 'react'
import { useTemplateStore, Template } from '@/lib/store/template-store'
import { X, FileText, Database, Rows3, Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateCreatorProps {
  workspaceId: string
  initialType?: 'page' | 'database' | 'database_row'
  initialContent?: any
  editTemplate?: Template
  onClose: () => void
  onSave?: (template: Template) => void
}

export function TemplateCreator({
  workspaceId,
  initialType = 'page',
  initialContent,
  editTemplate,
  onClose,
  onSave,
}: TemplateCreatorProps) {
  const { createTemplate, updateTemplate, categories } = useTemplateStore()

  const [name, setName] = useState(editTemplate?.name || '')
  const [description, setDescription] = useState(editTemplate?.description || '')
  const [type, setType] = useState<'page' | 'database' | 'database_row'>(
    editTemplate?.type || initialType
  )
  const [content, setContent] = useState(
    editTemplate?.content || initialContent || {}
  )
  const [icon, setIcon] = useState(editTemplate?.icon || '')
  const [category, setCategory] = useState(editTemplate?.category || '')
  const [tags, setTags] = useState<string[]>(editTemplate?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [isPublic, setIsPublic] = useState(editTemplate?.is_public || false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeOptions = [
    { value: 'page', label: 'Page Template', icon: FileText, description: 'Create pages from this template' },
    { value: 'database', label: 'Database Template', icon: Database, description: 'Create databases from this template' },
    { value: 'database_row', label: 'Row Template', icon: Rows3, description: 'Add rows to databases from this template' },
  ]

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a template name')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (editTemplate) {
        await updateTemplate(editTemplate.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          content,
          icon: icon || undefined,
          category: category || undefined,
          tags,
          is_public: isPublic,
        })
        onSave?.({ ...editTemplate, name, description, type, content, icon, category, tags, is_public: isPublic })
      } else {
        const newTemplate = await createTemplate({
          workspace_id: workspaceId,
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          content,
          icon: icon || undefined,
          category: category || undefined,
          tags,
          is_public: isPublic,
        })
        if (newTemplate) {
          onSave?.(newTemplate)
        }
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">
            {editTemplate ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Template"
              className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description <span className="text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
              rows={2}
              className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Type */}
          {!editTemplate && (
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {typeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => setType(option.value as any)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors',
                        type === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          type === option.value
                            ? 'text-blue-600'
                            : 'text-neutral-500'
                        )}
                      />
                      <span className="text-xs font-medium text-center">
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Icon <span className="text-neutral-400">(emoji)</span>
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              placeholder="📄"
              className="w-20 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl"
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="flex-1 px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Public */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                isPublic ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-neutral-700'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                  isPublic && 'translate-x-4'
                )}
              />
            </button>
            <div>
              <div className="text-sm font-medium">Public template</div>
              <div className="text-xs text-neutral-500">
                Visible to all workspace members
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : editTemplate ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
