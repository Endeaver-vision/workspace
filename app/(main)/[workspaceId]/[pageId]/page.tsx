import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageEditor } from '@/components/page/PageEditor'

interface PageProps {
  params: Promise<{ workspaceId: string; pageId: string }>
}

export default async function Page({ params }: PageProps) {
  const { workspaceId, pageId } = await params
  const supabase = await createClient()

  // Get the page (no auth required for testing)
  const { data: page, error } = await (supabase
    .from('pages') as any)
    .select('*')
    .eq('id', pageId)
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !page) {
    notFound()
  }

  return <PageEditor page={page} />
}
