'use client'

import { useState, useEffect } from 'react'
import { useApiStore } from '@/lib/store/api-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Key, Plus, Trash2, Webhook, Check, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiSettingsProps {
  workspaceId: string
  userId: string
}

const WEBHOOK_EVENTS = [
  { id: 'page.created', label: 'Page Created' },
  { id: 'page.updated', label: 'Page Updated' },
  { id: 'page.deleted', label: 'Page Deleted' },
  { id: 'database.created', label: 'Database Created' },
  { id: 'database.updated', label: 'Database Updated' },
  { id: 'database.row.created', label: 'Database Row Created' },
  { id: 'database.row.updated', label: 'Database Row Updated' },
  { id: 'database.row.deleted', label: 'Database Row Deleted' },
]

export function ApiSettings({ workspaceId, userId }: ApiSettingsProps) {
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [showNewWebhookDialog, setShowNewWebhookDialog] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // API Key form state
  const [keyName, setKeyName] = useState('')
  const [keyScopes, setKeyScopes] = useState<string[]>(['read'])

  // Webhook form state
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])

  const {
    apiKeys,
    webhooks,
    isLoadingApiKeys,
    isLoadingWebhooks,
    loadApiKeys,
    loadWebhooks,
    createApiKey,
    revokeApiKey,
    createWebhook,
    deleteWebhook,
    testWebhook,
  } = useApiStore()

  useEffect(() => {
    loadApiKeys(workspaceId)
    loadWebhooks(workspaceId)
  }, [workspaceId, loadApiKeys, loadWebhooks])

  const handleCreateKey = async () => {
    if (!keyName.trim()) return

    const result = await createApiKey(workspaceId, userId, keyName, keyScopes)
    if (result) {
      setNewKey(result.key)
      setShowNewKeyDialog(false)
      setShowKeyDialog(true)
      setKeyName('')
      setKeyScopes(['read'])
    }
  }

  const handleCopyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim() || webhookEvents.length === 0) return

    await createWebhook(workspaceId, webhookUrl, webhookEvents)
    setShowNewWebhookDialog(false)
    setWebhookUrl('')
    setWebhookEvents([])
  }

  const handleTestWebhook = async (webhookId: string) => {
    const success = await testWebhook(webhookId)
    if (success) {
      alert('Webhook test successful!')
    } else {
      alert('Webhook test failed. Check the URL and try again.')
    }
  }

  const toggleWebhookEvent = (eventId: string) => {
    setWebhookEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">API Keys</h3>
              <p className="text-sm text-muted-foreground">
                Manage API keys for programmatic access to your workspace
              </p>
            </div>
            <Button onClick={() => setShowNewKeyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Key
            </Button>
          </div>

          {isLoadingApiKeys ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {key.key_prefix}...
                    </TableCell>
                    <TableCell>
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="mr-1">
                          {scope}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? 'default' : 'destructive'}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {key.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => revokeApiKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications when events happen in your workspace
              </p>
            </div>
            <Button onClick={() => setShowNewWebhookDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          {isLoadingWebhooks ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              No webhooks configured. Add one to receive event notifications.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm max-w-xs truncate">
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {webhook.last_triggered_at
                        ? new Date(webhook.last_triggered_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          webhook.failure_count > 3
                            ? 'destructive'
                            : webhook.is_active
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {webhook.failure_count > 3
                          ? 'Failing'
                          : webhook.is_active
                          ? 'Active'
                          : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTestWebhook(webhook.id)}
                          title="Test webhook"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key to access your workspace programmatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="My API Key"
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={keyScopes.includes('read')}
                    onCheckedChange={(checked) =>
                      setKeyScopes((prev) =>
                        checked
                          ? [...prev, 'read']
                          : prev.filter((s) => s !== 'read')
                      )
                    }
                  />
                  <span className="text-sm">Read</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={keyScopes.includes('write')}
                    onCheckedChange={(checked) =>
                      setKeyScopes((prev) =>
                        checked
                          ? [...prev, 'write']
                          : prev.filter((s) => s !== 'write')
                      )
                    }
                  />
                  <span className="text-sm">Write</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={!keyName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy this key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
            <span className="flex-1">{newKey}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyKey}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={showNewWebhookDialog} onOpenChange={setShowNewWebhookDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook to receive event notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-center gap-2 p-2 rounded border hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={webhookEvents.includes(event.id)}
                      onCheckedChange={() => toggleWebhookEvent(event.id)}
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewWebhookDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={!webhookUrl.trim() || webhookEvents.length === 0}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
