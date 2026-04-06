import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai/anthropic'

interface SearchKeywords {
  keywords: string[]
  intent: string
}

// AI-powered semantic search for SOPs
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

    // Use AI to extract and expand search keywords
    let keywords: string[] = []
    let searchIntent = ''

    try {
      const aiResult = await generateJSON<SearchKeywords>(
        `Extract search keywords from this query and identify the user's intent.

Query: "${query}"

Return JSON with:
- keywords: array of 5-10 relevant search terms (include synonyms and related terms)
- intent: brief description of what the user is looking for

Example: {"keywords": ["safety", "equipment", "ppe", "protective", "gear", "hazard"], "intent": "User wants to find safety equipment procedures"}`,
        { maxTokens: 256 }
      )
      keywords = aiResult.keywords || []
      searchIntent = aiResult.intent || ''
    } catch {
      // Fallback to simple keyword extraction if AI fails
      keywords = query.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 2)
    }

    // Also include original query words
    const originalKeywords = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)

    const allKeywords = [...new Set([...keywords, ...originalKeywords])]

    // Search SOPs by title and content
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

    // Keyword-based relevance scoring
    const results = (sops || [])
      .map((sop: any) => {
        const titleLower = sop.title.toLowerCase()
        const contentText = JSON.stringify(sop.content || {}).toLowerCase()

        let relevanceScore = 0
        const matchedKeywords: string[] = []

        allKeywords.forEach((keyword: string) => {
          const keywordLower = keyword.toLowerCase()
          if (titleLower.includes(keywordLower)) {
            relevanceScore += 0.3
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword)
            }
          }
          if (contentText.includes(keywordLower)) {
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

    return NextResponse.json({
      results,
      searchIntent,
      expandedKeywords: allKeywords,
    })
  } catch (error: any) {
    console.error('AI Search error:', error)

    // Check for API key error
    if (error.message?.includes('API key') || error.status === 401) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add ANTHROPIC_API_KEY to environment.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    )
  }
}
