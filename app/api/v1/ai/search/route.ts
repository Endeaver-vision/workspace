import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// AI-powered semantic search for SOPs
// In production, this would use embeddings and vector search
export async function POST(request: NextRequest) {
  try {
    const { query, workspaceId } = await request.json()

    if (!query || !workspaceId) {
      return NextResponse.json(
        { error: 'Query and workspaceId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Extract keywords from query
    const keywords = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)

    // Search SOPs by title and content
    // In production, this would use AI embeddings for semantic search
    const { data: sops, error } = await (supabase
      .from('sops') as any)
      .select(`
        id,
        title,
        content,
        status,
        category:sop_categories(id, name)
      `)
      .eq('workspace_id', workspaceId)
      .eq('status', 'published')

    if (error) throw error

    // Simple keyword-based relevance scoring
    // In production, this would use vector similarity
    const results = (sops || [])
      .map((sop: any) => {
        const titleLower = sop.title.toLowerCase()
        const contentText = JSON.stringify(sop.content || {}).toLowerCase()

        let relevanceScore = 0
        const matchedKeywords: string[] = []

        keywords.forEach((keyword: string) => {
          if (titleLower.includes(keyword)) {
            relevanceScore += 0.3
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword)
            }
          }
          if (contentText.includes(keyword)) {
            relevanceScore += 0.1
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword)
            }
          }
        })

        // Normalize score
        relevanceScore = Math.min(relevanceScore, 1)

        // Generate snippet
        let snippet = sop.title
        if (sop.content && Array.isArray(sop.content)) {
          const textBlocks = sop.content
            .filter((b: any) => b.type === 'paragraph' && b.content)
            .slice(0, 2)
          if (textBlocks.length > 0) {
            snippet = textBlocks
              .map((b: any) => b.content?.map((c: any) => c.text || '').join(''))
              .join(' ')
              .slice(0, 200)
            if (snippet.length === 200) snippet += '...'
          }
        }

        return {
          sop,
          relevance: relevanceScore,
          snippet,
          matchedKeywords,
        }
      })
      .filter((r: any) => r.relevance > 0)
      .sort((a: any, b: any) => b.relevance - a.relevance)
      .slice(0, 10)

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('AI Search error:', error)
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
