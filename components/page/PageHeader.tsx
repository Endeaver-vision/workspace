'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Image, Smile, X, Upload, Link, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Extended emoji categories
const EMOJI_CATEGORIES = {
  'Recent': ['📄', '📝', '✅', '🎯', '💡', '🚀', '💪', '⭐'],
  'Objects': ['📄', '📝', '📋', '📌', '📍', '📎', '✂️', '📐', '📏', '🔧', '🔨', '⚙️', '🔩', '💡', '🔦', '🔋', '💾', '💿', '📀', '🎥', '📷', '📹', '📺', '📻', '📱', '💻', '⌨️', '🖥️', '🖨️', '📞'],
  'Symbols': ['✅', '❌', '⭐', '🌟', '💫', '✨', '⚡', '🔥', '💥', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '💢', '💬', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🔶', '🔷'],
  'Nature': ['🌱', '🌿', '🍀', '🌳', '🌲', '🌴', '🌵', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🌹', '🥀', '💐', '🍁', '🍂', '🍃', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌩️', '❄️', '🌊'],
  'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷'],
  'Travel': ['✈️', '🚀', '🛸', '🚁', '🛩️', '🪂', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒'],
  'People': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭'],
  'Work': ['💼', '📊', '📈', '📉', '📋', '📁', '📂', '🗂️', '🗃️', '🗄️', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '💵', '💴', '💶', '💷', '💳', '🧾', '💹', '📧', '📨', '📩', '📤', '📥', '📦', '📫'],
}

// Cover image categories
const COVER_IMAGES = {
  'Gradients': [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
    'https://images.unsplash.com/photo-1558470598-a5dda9640f68?w=1200',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200',
    'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=1200',
  ],
  'Nature': [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200',
    'https://images.unsplash.com/photo-1518173946687-a4c036bc6c9f?w=1200',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
  ],
  'Abstract': [
    'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1200',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
    'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200',
    'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=1200',
    'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=1200',
    'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200',
  ],
  'Minimal': [
    'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
    'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=1200',
    'https://images.unsplash.com/photo-1517816428104-797678c7cf0c?w=1200',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200',
  ],
  'Patterns': [
    'https://images.unsplash.com/photo-1558244661-d248897f7bc4?w=1200',
    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200',
    'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200',
    'https://images.unsplash.com/photo-1557682260-96773eb01377?w=1200',
    'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=1200',
    'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1200',
  ],
}

interface PageHeaderProps {
  title: string
  icon: string | null
  coverImage: string | null
  onTitleChange: (title: string) => void
  onIconChange: (icon: string | null) => void
  onCoverChange: (cover: string | null) => void
}

export function PageHeader({
  title,
  icon,
  coverImage,
  onTitleChange,
  onIconChange,
  onCoverChange,
}: PageHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(title)
  const [showActions, setShowActions] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const titleInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setTitleValue(title)
  }, [title])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
    if (titleValue !== title) {
      onTitleChange(titleValue || 'Untitled')
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleBlur()
    }
  }

  const handleRandomCover = () => {
    const allCovers = Object.values(COVER_IMAGES).flat()
    const randomCover = allCovers[Math.floor(Math.random() * allCovers.length)]
    onCoverChange(randomCover)
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onCoverChange(urlInput.trim())
      setUrlInput('')
    }
  }

  // Icon picker component (reusable)
  const IconPicker = ({ showRemove = false }: { showRemove?: boolean }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Choose an icon</p>
        {showRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onIconChange(null)}
            className="text-red-500 hover:text-red-600 cursor-pointer"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
      <Tabs defaultValue="Recent" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0">
          {Object.keys(EMOJI_CATEGORIES).slice(0, 5).map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="text-xs px-2 py-1 cursor-pointer"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
          <TabsContent key={category} value={category} className="mt-2">
            <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
              {emojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  className="h-8 w-8 flex items-center justify-center text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer transition-colors"
                  onClick={() => onIconChange(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <div className="flex gap-2">
        <Input
          placeholder="Or paste an emoji..."
          className="flex-1"
          maxLength={2}
          onChange={(e) => {
            if (e.target.value) {
              onIconChange(e.target.value)
            }
          }}
        />
      </div>
    </div>
  )

  // Cover picker component (reusable)
  const CoverPicker = ({ showRemove = false }: { showRemove?: boolean }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Cover image</p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRandomCover}
            className="cursor-pointer"
          >
            <Shuffle className="h-4 w-4 mr-1" />
            Random
          </Button>
          {showRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCoverChange(null)}
              className="text-red-500 hover:text-red-600 cursor-pointer"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="Gallery" className="w-full">
        <TabsList className="w-full bg-transparent p-0 gap-1">
          <TabsTrigger value="Gallery" className="text-xs cursor-pointer">
            <Image className="h-3 w-3 mr-1" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="Link" className="text-xs cursor-pointer">
            <Link className="h-3 w-3 mr-1" />
            Link
          </TabsTrigger>
          <TabsTrigger value="Upload" className="text-xs cursor-pointer">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Gallery" className="mt-2 space-y-3">
          {Object.entries(COVER_IMAGES).map(([category, images]) => (
            <div key={category}>
              <p className="text-xs text-muted-foreground mb-1">{category}</p>
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, idx) => (
                  <button
                    key={`${category}-${idx}`}
                    className="h-14 rounded-md bg-cover bg-center hover:ring-2 ring-primary cursor-pointer transition-all hover:scale-105"
                    style={{ backgroundImage: `url(${url})` }}
                    onClick={() => onCoverChange(url)}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="Link" className="mt-2">
          <div className="space-y-2">
            <Input
              placeholder="Paste an image URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUrlSubmit()
                }
              }}
            />
            <Button
              onClick={handleUrlSubmit}
              className="w-full cursor-pointer"
              disabled={!urlInput.trim()}
            >
              Add cover
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="Upload" className="mt-2">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop an image, or click to upload
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="cover-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Convert to data URL for now (in production, upload to storage)
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    onCoverChange(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            <label
              htmlFor="cover-upload"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer"
            >
              Choose file
            </label>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <div
      className="group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Action buttons */}
      <div
        className={cn(
          'flex items-center gap-1 mb-2 transition-opacity',
          showActions || !icon || !coverImage ? 'opacity-100' : 'opacity-0'
        )}
      >
        {!icon && mounted && (
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-7 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
              <Smile className="h-4 w-4 mr-1" />
              Add icon
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
              <IconPicker />
            </PopoverContent>
          </Popover>
        )}

        {!coverImage && mounted && (
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-7 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
              <Image className="h-4 w-4 mr-1" />
              Add cover
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
              <CoverPicker />
            </PopoverContent>
          </Popover>
        )}

        {coverImage && mounted && (
          <Popover>
            <PopoverTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-7 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
              <Image className="h-4 w-4 mr-1" />
              Change cover
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
              <CoverPicker showRemove />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Icon */}
      {icon && (
        <div className="relative inline-block mb-4 group/icon">
          {mounted ? (
            <Popover>
              <PopoverTrigger className="text-6xl hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg p-2 transition-colors cursor-pointer">
                {icon}
              </PopoverTrigger>
              <PopoverContent className="w-96" align="start">
                <IconPicker showRemove />
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-6xl p-2">{icon}</span>
          )}
        </div>
      )}

      {/* Title */}
      {isEditingTitle ? (
        <textarea
          ref={titleInputRef}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
          rows={1}
          style={{ height: 'auto' }}
        />
      ) : (
        <h1
          onClick={() => setIsEditingTitle(true)}
          className="text-4xl font-bold cursor-text hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-md px-1 -mx-1 min-h-[48px]"
        >
          {title || (
            <span className="text-neutral-300 dark:text-neutral-700">
              Untitled
            </span>
          )}
        </h1>
      )}
    </div>
  )
}
