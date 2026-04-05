'use client'

import { useState } from 'react'
import { ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
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
}

interface CategoryNodeProps {
  category: SOPCategory
  level: number
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  onEdit: (category: SOPCategory) => void
  onDelete: (categoryId: string) => void
}

function CategoryNode({
  category,
  level,
  selectedCategory,
  onSelectCategory,
  onEdit,
  onDelete,
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedCategory === category.id

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted',
          isSelected && 'bg-primary/10 text-primary'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
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

        <div
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={() => onSelectCategory(isSelected ? null : category.id)}
        >
          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          )}
          <span className="text-sm truncate">{category.name}</span>
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
}: CategoryTreeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SOPCategory | null>(null)
  const [categoryName, setCategoryName] = useState('')

  const { categoryTree, createCategory, updateCategory, deleteCategory } = useSOPStore()

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
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted',
          selectedCategory === null && 'bg-primary/10 text-primary'
        )}
        onClick={() => onSelectCategory(null)}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">All SOPs</span>
      </div>

      {categoryTree.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}

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
