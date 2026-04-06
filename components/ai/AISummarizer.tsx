'use client'

import { useState, useCallback } from 'react'
import { FileText, Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AISummarizerProps {
  sopId: string
  sopTitle: string
  sopContent: any // BlockNote content
  disabled?: boolean
}

type SummaryLength = 'brief' | 'standard' | 'detailed'
type SummaryFormat = 'paragraph' | 'bullets' | 'outline'

export function AISummarizer({
  sopId,
  sopTitle,
  sopContent,
  disabled,
}: AISummarizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [length, setLength] = useState<SummaryLength>('standard')
  const [format, setFormat] = useState<SummaryFormat>('paragraph')

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setSummary('')

    try {
      const response = await fetch('/api/v1/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopId,
          sopTitle,
          content: sopContent,
          length,
          format,
        }),
      })

      if (!response.ok) throw new Error('Summarization failed')

      const data = await response.json()
      setSummary(data.summary || '')
    } catch (error) {
      console.error('Summarization error:', error)
      setSummary('Failed to generate summary. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [sopId, sopTitle, sopContent, length, format])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [summary])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" disabled={disabled} />}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Summarize
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Summary
          </DialogTitle>
          <DialogDescription>
            Generate a summary of "{sopTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as SummaryLength)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief (1-2 sentences)</SelectItem>
                  <SelectItem value="standard">Standard (paragraph)</SelectItem>
                  <SelectItem value="detailed">Detailed (comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as SummaryFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraph">Paragraph</SelectItem>
                  <SelectItem value="bullets">Bullet Points</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Output */}
          {summary && (
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Summary
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleGenerate}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {summary}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing content and generating summary...</p>
            </div>
          )}

          {/* Initial State */}
          {!summary && !isGenerating && (
            <Card className="flex-1">
              <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>Configure your summary options and click Generate.</p>
                <p className="text-sm mt-1">The AI will analyze the SOP content and create a summary.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
