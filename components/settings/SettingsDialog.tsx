'use client'

import { useUIStore } from '@/lib/store/ui-store'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { ApiSettings } from './ApiSettings'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Key, User } from 'lucide-react'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useUIStore()
  const { currentWorkspace } = useWorkspaceStore()

  if (!currentWorkspace) return null

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="api" className="mt-4">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <User className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API & Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  {currentWorkspace.name}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Workspace ID</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {currentWorkspace.id}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <ApiSettings
              workspaceId={currentWorkspace.id}
              userId={TEST_USER_ID}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
