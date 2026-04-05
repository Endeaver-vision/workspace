'use client'

import { useState, useEffect } from 'react'
import { FileText, Users, Calendar, Check, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/lib/store/user-store'
import { useAssignmentStore } from '@/lib/store/assignment-store'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/training.types'

interface AssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sopId: string
  sopTitle: string
  assignedBy: string
}

export function AssignmentModal({
  open,
  onOpenChange,
  sopId,
  sopTitle,
  assignedBy,
}: AssignmentModalProps) {
  const { users, isLoading: usersLoading, loadUsers } = useUserStore()
  const { createBulkAssignments, isSaving, error, assignments } = useAssignmentStore()

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open, loadUsers])

  // Filter out already assigned users
  const alreadyAssigned = new Set(
    assignments
      .filter(a => a.sop_id === sopId)
      .map(a => a.user_id)
  )

  const filteredUsers = users.filter(user => {
    // Exclude already assigned users
    if (alreadyAssigned.has(user.id)) return false

    // Search filter
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const toggleAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const handleSubmit = async () => {
    setLocalError(null)

    if (selectedUsers.size === 0) {
      setLocalError('Please select at least one user')
      return
    }

    const result = await createBulkAssignments(
      sopId,
      Array.from(selectedUsers),
      assignedBy,
      dueDate || undefined
    )

    if (result.length > 0) {
      setSelectedUsers(new Set())
      setSearch('')
      setDueDate('')
      onOpenChange(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedUsers(new Set())
      setSearch('')
      setDueDate('')
      setLocalError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Training
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{sopTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date (Optional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Users
              </Label>
              {selectedUsers.size > 0 && (
                <Badge variant="secondary">
                  {selectedUsers.size} selected
                </Badge>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                disabled={isSaving}
              />
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[250px] border rounded-md">
                <div className="p-2 space-y-1">
                  {/* Select All */}
                  {filteredUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left border-b mb-2"
                      disabled={isSaving}
                    >
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleAll}
                        disabled={isSaving}
                      />
                      <span className="font-medium text-sm">
                        Select All ({filteredUsers.length})
                      </span>
                    </button>
                  )}

                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {users.length === 0
                        ? 'No users found'
                        : search
                        ? 'No users match your search'
                        : 'All users already assigned'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <UserSelectItem
                        key={user.id}
                        user={user}
                        selected={selectedUsers.has(user.id)}
                        onToggle={() => toggleUser(user.id)}
                        disabled={isSaving}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          {(localError || error) && (
            <p className="text-sm text-destructive">{localError || error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || selectedUsers.size === 0}>
            {isSaving
              ? 'Assigning...'
              : `Assign to ${selectedUsers.size} user${selectedUsers.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface UserSelectItemProps {
  user: Profile
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

function UserSelectItem({ user, selected, onToggle, disabled }: UserSelectItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left',
        selected && 'bg-primary/5'
      )}
      disabled={disabled}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} disabled={disabled} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{user.full_name || 'Unknown'}</div>
        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
      </div>
      <Badge variant="outline" className="text-xs capitalize">
        {user.role}
      </Badge>
    </button>
  )
}
