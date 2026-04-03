'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ExternalLink,
  Link2,
  Loader2,
  Play,
  RefreshCw,
  X,
} from 'lucide-react'

interface Embed {
  id: string
  page_id: string
  block_id: string
  service: string
  original_url: string
  embed_url?: string
  embed_data: Record<string, any>
  thumbnail_url?: string
  title?: string
  description?: string
}

interface EmbedBlockProps {
  pageId: string
  blockId: string
  embed?: Embed
  onEmbedCreated?: (embed: Embed) => void
  onRemove?: () => void
}

// Supported embed services with their patterns
const EMBED_SERVICES = {
  youtube: {
    patterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ],
    getEmbedUrl: (id: string) => `https://www.youtube.com/embed/${id}`,
    aspectRatio: '16/9',
  },
  vimeo: {
    patterns: [/vimeo\.com\/(\d+)/],
    getEmbedUrl: (id: string) => `https://player.vimeo.com/video/${id}`,
    aspectRatio: '16/9',
  },
  twitter: {
    patterns: [/(?:twitter|x)\.com\/\w+\/status\/(\d+)/],
    getEmbedUrl: (id: string) => `https://platform.twitter.com/embed/Tweet.html?id=${id}`,
    aspectRatio: undefined,
  },
  spotify: {
    patterns: [
      /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
    ],
    getEmbedUrl: (type: string, id: string) =>
      `https://open.spotify.com/embed/${type}/${id}`,
    aspectRatio: undefined,
  },
  figma: {
    patterns: [/figma\.com\/(file|proto)\/([a-zA-Z0-9]+)/],
    getEmbedUrl: (url: string) =>
      `https://www.figma.com/embed?embed_host=notion&url=${encodeURIComponent(url)}`,
    aspectRatio: '4/3',
  },
  loom: {
    patterns: [/loom\.com\/share\/([a-zA-Z0-9]+)/],
    getEmbedUrl: (id: string) => `https://www.loom.com/embed/${id}`,
    aspectRatio: '16/9',
  },
  codepen: {
    patterns: [/codepen\.io\/([^\/]+)\/pen\/([a-zA-Z0-9]+)/],
    getEmbedUrl: (user: string, id: string) =>
      `https://codepen.io/${user}/embed/${id}?default-tab=result`,
    aspectRatio: '4/3',
  },
  codesandbox: {
    patterns: [/codesandbox\.io\/s\/([a-zA-Z0-9-]+)/],
    getEmbedUrl: (id: string) =>
      `https://codesandbox.io/embed/${id}?fontsize=14&hidenavigation=1&theme=dark`,
    aspectRatio: '16/9',
  },
  miro: {
    patterns: [/miro\.com\/app\/board\/([a-zA-Z0-9_=-]+)/],
    getEmbedUrl: (id: string) =>
      `https://miro.com/app/embed/${id}/?autoplay=yep`,
    aspectRatio: '4/3',
  },
  github: {
    patterns: [/github\.com\/([^\/]+\/[^\/]+)/],
    getEmbedUrl: (repo: string) => null, // GitHub doesn't have embeds, we'll show a card
    aspectRatio: undefined,
  },
  generic: {
    patterns: [],
    getEmbedUrl: (url: string) => url,
    aspectRatio: '16/9',
  },
} as const

type ServiceName = keyof typeof EMBED_SERVICES

function detectService(url: string): { service: ServiceName; matches: string[] } | null {
  for (const [serviceName, config] of Object.entries(EMBED_SERVICES)) {
    if (serviceName === 'generic') continue

    for (const pattern of config.patterns) {
      const match = url.match(pattern)
      if (match) {
        return { service: serviceName as ServiceName, matches: match.slice(1) }
      }
    }
  }
  return null
}

export function EmbedBlock({
  pageId,
  blockId,
  embed: initialEmbed,
  onEmbedCreated,
  onRemove,
}: EmbedBlockProps) {
  const [embed, setEmbed] = useState<Embed | null>(initialEmbed || null)
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient() as any

  useEffect(() => {
    if (initialEmbed) {
      setEmbed(initialEmbed)
    }
  }, [initialEmbed])

  const handleEmbed = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const detected = detectService(url)
      const service = detected?.service || 'generic'
      let embedUrl: string | null = null
      let embedData: Record<string, any> = {}

      if (detected && service !== 'generic') {
        const config = EMBED_SERVICES[service]
        if (service === 'spotify' && detected.matches.length === 2) {
          embedUrl = (config as any).getEmbedUrl(detected.matches[0], detected.matches[1])
        } else if (service === 'codepen' && detected.matches.length === 2) {
          embedUrl = (config as any).getEmbedUrl(detected.matches[0], detected.matches[1])
        } else if (service === 'figma') {
          embedUrl = (config as any).getEmbedUrl(url)
        } else if (detected.matches[0]) {
          embedUrl = (config as any).getEmbedUrl(detected.matches[0])
        }
        embedData = { aspectRatio: config.aspectRatio }
      }

      const newEmbed: Omit<Embed, 'id'> = {
        page_id: pageId,
        block_id: blockId,
        service,
        original_url: url,
        embed_url: embedUrl || url,
        embed_data: embedData,
      }

      const { data, error: dbError } = await supabase
        .from('embeds')
        .upsert(newEmbed, { onConflict: 'page_id,block_id' })
        .select()
        .single()

      if (dbError) throw dbError

      setEmbed(data)
      onEmbedCreated?.(data)
    } catch (err) {
      setError('Failed to create embed')
      console.error('Embed error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (embed) {
      await supabase.from('embeds').delete().eq('id', embed.id)
    }
    setEmbed(null)
    setUrl('')
    onRemove?.()
  }

  // Show embed input if no embed exists
  if (!embed) {
    return (
      <div className="rounded-lg border-2 border-dashed p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Embed</span>
        </div>

        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a link (YouTube, Figma, Spotify, etc.)"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleEmbed()}
          />
          <Button onClick={handleEmbed} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Embed'
            )}
          </Button>
        </div>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <p className="mt-2 text-xs text-muted-foreground">
          Supported: YouTube, Vimeo, Spotify, Figma, Loom, CodePen, CodeSandbox, Miro, and more
        </p>
      </div>
    )
  }

  // Show embedded content
  const aspectRatio = embed.embed_data?.aspectRatio || '16/9'

  return (
    <div className="group relative rounded-lg border overflow-hidden">
      {/* Controls */}
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={() => window.open(embed.original_url, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Embed iframe */}
      {embed.embed_url && embed.service !== 'github' ? (
        <div
          className="relative w-full"
          style={{ aspectRatio }}
        >
          <iframe
            src={embed.embed_url}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        // Fallback link card
        <a
          href={embed.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
        >
          {embed.thumbnail_url && (
            <img
              src={embed.thumbnail_url}
              alt=""
              className="w-16 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {embed.title || embed.original_url}
            </p>
            {embed.description && (
              <p className="text-sm text-muted-foreground truncate">
                {embed.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {new URL(embed.original_url).hostname}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        </a>
      )}

      {/* Service badge */}
      <div className="absolute left-2 bottom-2 z-10">
        <span className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white capitalize">
          {embed.service}
        </span>
      </div>
    </div>
  )
}
