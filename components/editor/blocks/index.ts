// Custom block registry
export { CalloutBlock, calloutBlockConfig } from './CalloutBlock'
export { ToggleBlock, toggleBlockConfig } from './ToggleBlock'
export { DividerBlock, dividerBlockConfig } from './DividerBlock'

// Synced blocks and embeds
export { SyncedBlock, CreateSyncedBlock, SyncedBlockPicker } from './SyncedBlock'
export { EmbedBlock } from './EmbedBlock'

// Block types for type safety
export type CustomBlockType = 'callout' | 'toggle' | 'divider'

// Slash menu items for custom blocks
export const customSlashMenuItems = [
  {
    title: 'Callout',
    subtext: 'Add a callout box for important information',
    aliases: ['callout', 'note', 'info', 'warning', 'alert'],
    group: 'Basic blocks',
    badge: undefined,
  },
  {
    title: 'Toggle',
    subtext: 'Add collapsible content',
    aliases: ['toggle', 'collapse', 'dropdown', 'accordion'],
    group: 'Basic blocks',
    badge: undefined,
  },
  {
    title: 'Divider',
    subtext: 'Add a horizontal divider',
    aliases: ['divider', 'hr', 'line', 'separator'],
    group: 'Basic blocks',
    badge: undefined,
  },
]
