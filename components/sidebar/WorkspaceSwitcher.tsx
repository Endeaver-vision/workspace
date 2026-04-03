'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ChevronsUpDown, Plus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Workspace } from '@/types/database.types'

// Test user ID for development (bypasses auth)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function WorkspaceSwitcher() {
  const router = useRouter()
  const supabase = createClient()
  const { workspaces, currentWorkspace, setCurrentWorkspace, addWorkspace, removeWorkspace } =
    useWorkspaceStore()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return

    setCreating(true)

    const { data, error } = await (supabase
      .from('workspaces') as any)
      .insert({
        name: newWorkspaceName.trim(),
        owner_id: TEST_USER_ID,
      })
      .select()
      .single()

    if (data && !error) {
      addWorkspace(data)
      setCurrentWorkspace(data)
      setNewWorkspaceName('')
      setCreateOpen(false)
      router.push(`/${data.id}`)
    }

    setCreating(false)
  }

  const handleSelectWorkspace = (workspace: typeof currentWorkspace) => {
    if (workspace) {
      setCurrentWorkspace(workspace)
      router.push(`/${workspace.id}`)
    }
    setOpen(false)
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return

    setDeleting(true)

    // Delete all pages in the workspace first
    await (supabase.from('pages') as any)
      .delete()
      .eq('workspace_id', workspaceToDelete.id)

    // Delete the workspace
    const { error } = await (supabase.from('workspaces') as any)
      .delete()
      .eq('id', workspaceToDelete.id)

    if (!error) {
      removeWorkspace(workspaceToDelete.id)

      // If we deleted the current workspace, switch to another one
      if (currentWorkspace?.id === workspaceToDelete.id) {
        const remaining = workspaces.filter(w => w.id !== workspaceToDelete.id)
        if (remaining.length > 0) {
          setCurrentWorkspace(remaining[0])
          router.push(`/${remaining[0].id}`)
        } else {
          setCurrentWorkspace(null)
          router.push('/')
        }
      }
    }

    setDeleting(false)
    setDeleteOpen(false)
    setWorkspaceToDelete(null)
  }

  const openDeleteDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation()
    setWorkspaceToDelete(workspace)
    setDeleteOpen(true)
    setOpen(false)
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="w-full flex items-center justify-between px-2 h-8 font-medium rounded-md hover:bg-accent">
          <div className="flex items-center gap-2 truncate">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {currentWorkspace?.icon || currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
            </div>
            <span className="truncate">
              {currentWorkspace?.name || 'Select workspace'}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Workspaces</div>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSelectWorkspace(workspace)}
              className="cursor-pointer group"
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="h-5 w-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{workspace.name}</span>
              </div>
              {currentWorkspace?.id === workspace.id && (
                <Check className="h-4 w-4" />
              )}
              <button
                onClick={(e) => openDeleteDialog(e, workspace)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded ml-1"
                title="Delete workspace"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setOpen(false)
              setCreateOpen(true)
            }}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your pages and collaborate with
              others.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                placeholder="My Workspace"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateWorkspace()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{workspaceToDelete?.name}"? This will permanently delete all pages in this workspace. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkspace}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
