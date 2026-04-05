import { SOPEditor } from '@/components/sop'

interface SOPEditorPageProps {
  params: Promise<{ workspaceId: string; sopId: string }>
}

export default async function SOPEditorPage({ params }: SOPEditorPageProps) {
  const { workspaceId, sopId } = await params

  return <SOPEditor sopId={sopId} workspaceId={workspaceId} />
}
