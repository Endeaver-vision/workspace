import { SOPLibrary } from '@/components/sop'

interface SOPsPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function SOPsPage({ params }: SOPsPageProps) {
  const { workspaceId } = await params

  return (
    <div className="h-[calc(100vh-0px)]">
      <SOPLibrary workspaceId={workspaceId} />
    </div>
  )
}
