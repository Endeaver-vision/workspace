'use client'

import { useState } from 'react'
import { ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Edit, Trash2, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useSOPStore } from '@/lib/store/sop-store'
import type { SOPCategory } from '@/types/training.types'
import { cn } from '@/lib/utils'

interface CategoryTreeProps {
  categories: SOPCategory[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  workspaceId: string
  sopCounts?: Record<string, number>
}

interface CategoryNodeProps {
  category: SOPCategory
  level: number
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  onEdit: (category: SOPCategory) => void
  onDelete: (categoryId: string) => void
  sopCount?: number
}

function CategoryNode({
  category,
  level,
  selectedCategory,
  onSelectCategory,
  onEdit,
  onDelete,
  sopCount = 0,
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedCategory === category.id

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-2 px-3 rounded-lg cursor-pointer hover:bg-muted transition-colors',
          isSelected && 'bg-primary/10 text-primary border border-primary/20'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelectCategory(isSelected ? null : category.id)}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </Button>
        ) : (
          <div className="w-5" />
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Display custom icon if available, otherwise use folder icon */}
          {category.icon ? (
            <span className="text-lg flex-shrink-0">{category.icon}</span>
          ) : isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium truncate">{category.name}</span>
          {sopCount > 0 && (
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {sopCount}
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-6 w-6 opacity-0 group-hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-accent"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({
  categories,
  selectedCategory,
  onSelectCategory,
  workspaceId,
  sopCounts = {},
}: CategoryTreeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SOPCategory | null>(null)
  const [categoryName, setCategoryName] = useState('')

  const { categoryTree, createCategory, updateCategory, deleteCategory } = useSOPStore()

  const totalSops = Object.values(sopCounts).reduce((a, b) => a + b, 0)

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return

    if (editingCategory) {
      await updateCategory(editingCategory.id, { name: categoryName })
    } else {
      await createCategory({
        name: categoryName,
        workspace_id: workspaceId,
      })
    }

    setIsDialogOpen(false)
    setCategoryName('')
    setEditingCategory(null)
  }

  const handleEdit = (category: SOPCategory) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setIsDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(categoryId)
      if (selectedCategory === categoryId) {
        onSelectCategory(null)
      }
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setCategoryName('')
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-muted transition-colors',
          selectedCategory === null && 'bg-primary/10 text-primary border border-primary/20'
        )}
        onClick={() => onSelectCategory(null)}
      >
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">All SOPs</span>
        {totalSops > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalSops}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {categoryTree.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            level={0}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            onEdit={handleEdit}
            onDelete={handleDelete}
            sopCount={sopCounts[category.id] || 0}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={handleAddNew}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Category
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCategory()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
