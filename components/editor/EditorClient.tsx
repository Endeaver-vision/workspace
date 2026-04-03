'use client'

import { useMemo } from 'react'
import { PartialBlock } from '@blocknote/core'
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
} from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { customSchema } from './schema'
import { AlertCircle, Minus, ToggleRight } from 'lucide-react'

// Simple filter function for suggestion items
function filterSuggestionItems<T extends { title: string; aliases?: string[] }>(
  items: T[],
  query: string
): T[] {
  if (!query) return items
  const lowerQuery = query.toLowerCase()
  return items.filter((item) => {
    if (item.title.toLowerCase().includes(lowerQuery)) return true
    if (item.aliases?.some((alias) => alias.toLowerCase().includes(lowerQuery))) return true
    return false
  })
}

interface EditorClientProps {
  initialContent?: PartialBlock[]
  onChange?: (content: PartialBlock[]) => void
  editable?: boolean
}

export function EditorClient({
  initialContent,
  onChange,
  editable = true,
}: EditorClientProps) {
  // Create editor with custom schema
  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: initialContent && initialContent.length > 0
      ? initialContent as any
      : undefined,
  })

  // Custom slash menu items for our blocks
  const getCustomSlashMenuItems = useMemo(() => {
    return async (query: string): Promise<DefaultReactSuggestionItem[]> => {
      const defaultItems = getDefaultReactSlashMenuItems(editor)

      const customItems: DefaultReactSuggestionItem[] = [
        {
          title: 'Callout',
          subtext: 'Add a callout box for important information',
          onItemClick: () => {
            editor.insertBlocks(
              [{ type: 'callout' as any, props: { variant: 'info' } }],
              editor.getTextCursorPosition().block,
              'after'
            )
          },
          aliases: ['callout', 'note', 'info', 'warning', 'alert'],
          group: 'Custom blocks',
          icon: <AlertCircle className="h-4 w-4" />,
        },
        {
          title: 'Toggle',
          subtext: 'Add collapsible content',
          onItemClick: () => {
            editor.insertBlocks(
              [{ type: 'toggle' as any }],
              editor.getTextCursorPosition().block,
              'after'
            )
          },
          aliases: ['toggle', 'collapse', 'dropdown', 'accordion'],
          group: 'Custom blocks',
          icon: <ToggleRight className="h-4 w-4" />,
        },
        {
          title: 'Divider',
          subtext: 'Add a horizontal divider',
          onItemClick: () => {
            editor.insertBlocks(
              [{ type: 'divider' as any }],
              editor.getTextCursorPosition().block,
              'after'
            )
          },
          aliases: ['divider', 'hr', 'line', 'separator'],
          group: 'Custom blocks',
          icon: <Minus className="h-4 w-4" />,
        },
      ]

      // Get custom item titles for deduplication
      const customTitles = new Set(customItems.map(item => item.title.toLowerCase()))

      // Filter out default items that would conflict with custom items
      const filteredDefaultItems = defaultItems.filter(
        item => !customTitles.has(item.title.toLowerCase())
      )

      return filterSuggestionItems([...customItems, ...filteredDefaultItems], query)
    }
  }, [editor])

  return (
    <div className="-mx-12">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={() => {
          if (onChange) {
            onChange(editor.document as any)
          }
        }}
        theme="light"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getCustomSlashMenuItems}
        />
      </BlockNoteView>
    </div>
  )
}
