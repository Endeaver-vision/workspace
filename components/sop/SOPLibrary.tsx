'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid, List, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SOPCard } from './SOPCard'
import { CategoryTree } from './CategoryTree'
import { useSOPStore } from '@/lib/store/sop-store'
import { useWorkspace } from '@/lib/context/workspace-context'
import type { SOPStatus } from '@/types/training.types'

// Test user ID for development
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

interface SOPLibraryProps {
  workspaceId: string // This is the UUID for database queries
}

export function SOPLibrary({ workspaceId }: SOPLibraryProps) {
  const router = useRouter()
  const { urlPath } = useWorkspace() // Use slug for URLs
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SOPStatus | 'all'>('all')

  const {
    sops,
    categories,
    isLoading,
    loadSOPs,
    loadCategories,
    createSOP,
    archiveSOP,
    deleteSOP,
    searchSOPs,
    searchResults,
  } = useSOPStore()

  useEffect(() => {
    loadSOPs(workspaceId)
    loadCategories(workspaceId)
  }, [workspaceId, loadSOPs, loadCategories])

  useEffect(() => {
    if (searchQuery.trim()) {
      const debounce = setTimeout(() => {
        searchSOPs(workspaceId, searchQuery)
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [searchQuery, workspaceId, searchSOPs])

  const handleCreateSOP = async () => {
    const sop = await createSOP({
      title: 'Untitled SOP',
      workspace_id: workspaceId,
      created_by: TEST_USER_ID,
      category_id: selectedCategory,
    })
    if (sop) {
      router.push(`/${urlPath}/sop/${sop.id}`)
    }
  }

  // Calculate SOP counts per category
  const sopCounts = sops.reduce((acc, sop) => {
    if (sop.category_id) {
      acc[sop.category_id] = (acc[sop.category_id] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Filter SOPs
  let displaySOPs = searchQuery.trim()
    ? searchResults.map((r) => r.sop)
    : sops

  if (selectedCategory) {
    displaySOPs = displaySOPs.filter((sop) => sop.category_id === selectedCategory)
  }

  if (statusFilter !== 'all') {
    displaySOPs = displaySOPs.filter((sop) => sop.status === statusFilter)
  }

  return (
    <div className="flex h-full">
      {/* Categories Sidebar */}
      <div className="w-72 border-r bg-muted/30 p-4">
        <h3 className="font-semibold mb-4 text-lg">Categories</h3>
        <CategoryTree
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          workspaceId={urlPath}
          sopCounts={sopCounts}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">SOP Library</h1>
            <Button onClick={handleCreateSOP}>
              <Plus className="h-4 w-4 mr-2" />
              New SOP
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SOPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as SOPStatus | 'all')}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : displaySOPs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No SOPs found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first SOP to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateSOP}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create SOP
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displaySOPs.map((sop) => (
                <SOPCard
                  key={sop.id}
                  sop={sop}
                  workspaceId={urlPath}
                  onArchive={archiveSOP}
                  onDelete={deleteSOP}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displaySOPs.map((sop) => (
                <SOPCard
                  key={sop.id}
                  sop={sop}
                  workspaceId={urlPath}
                  onArchive={archiveSOP}
                  onDelete={deleteSOP}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
