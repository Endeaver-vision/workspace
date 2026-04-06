'use client'

import { useState, useCallback } from 'react'
import { Search, Sparkles, FileText, ArrowRight, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import type { SOP } from '@/types/training.types'

interface AISearchProps {
  workspaceId: string
}

interface SearchResult {
  sop: SOP
  relevance: number
  snippet: string
  matchedKeywords: string[]
}

export function AISearch({ workspaceId }: AISearchProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      const response = await fetch('/api/v1/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          workspaceId,
        }),
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('AI Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [query, workspaceId])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <Input
          placeholder="Ask a question or describe what you're looking for..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-24 h-12 text-lg"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          size="sm"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Example Queries */}
      {!hasSearched && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Try:</span>
          {[
            'How do I handle a safety incident?',
            'What are the steps for onboarding?',
            'Find training about equipment',
          ].map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example)
                setTimeout(handleSearch, 100)
              }}
              className="text-sm text-primary hover:underline"
            >
              "{example}"
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <ScrollArea className="h-[400px]">
          {isSearching ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No SOPs found matching your query. Try rephrasing your question.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={result.sop.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <h3 className="font-medium truncate">{result.sop.title}</h3>
                          <Badge variant="secondary" className="flex-shrink-0">
                            {Math.round(result.relevance * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </p>
                        {result.matchedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.matchedKeywords.map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link href={`/${workspaceId}/sop/${result.sop.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  )
}
