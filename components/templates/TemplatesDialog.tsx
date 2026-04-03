'use client'

import { useRouter } from 'next/navigation'
import { useUIStore } from '@/lib/store/ui-store'
import { useWorkspaceStore } from '@/lib/store/workspace-store'
import { useTemplateStore, Template } from '@/lib/store/template-store'
import { TemplateGallery } from './TemplateGallery'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export function TemplatesDialog() {
  const router = useRouter()
  const { templatesOpen, setTemplatesOpen } = useUIStore()
  const { currentWorkspace } = useWorkspaceStore()
  const { useTemplate } = useTemplateStore()
  const supabase = createClient() as any

  if (!currentWorkspace) return null

  const handleSelectTemplate = async (template: Template) => {
    // Create a new page from the template
    const { data: page, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: currentWorkspace.id,
        title: template.name,
        icon: template.icon,
        content: template.content,
        created_by: TEST_USER_ID,
      })
      .select()
      .single()

    if (page && !error) {
      // Track template usage
      await useTemplate(template.id)

      setTemplatesOpen(false)
      router.push(`/${currentWorkspace.id}/${page.id}`)
    }
  }

  const handleCreateNew = () => {
    setTemplatesOpen(false)
    // Navigate to template creator or open a modal
  }

  return (
    <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Templates</DialogTitle>
        </DialogHeader>
        <TemplateGallery
          workspaceId={currentWorkspace.id}
          onSelect={handleSelectTemplate}
          onCreateNew={handleCreateNew}
          showCreateButton={true}
        />
      </DialogContent>
    </Dialog>
  )
}
