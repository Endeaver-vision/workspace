'use client'

import { Shield, GraduationCap, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/types/training.types'

interface RoleSelectorProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
  disabled?: boolean
}

const roles: { value: UserRole; label: string; icon: typeof Shield }[] = [
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'trainer', label: 'Trainer', icon: GraduationCap },
  { value: 'learner', label: 'Learner', icon: User },
]

export function RoleSelector({ currentRole, onRoleChange, disabled }: RoleSelectorProps) {
  return (
    <Select
      value={currentRole}
      onValueChange={(value) => onRoleChange(value as UserRole)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{role.label}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
