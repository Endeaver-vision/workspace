import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core'
import { CalloutBlock } from './blocks/CalloutBlock'
import { ToggleBlock } from './blocks/ToggleBlock'
import { DividerBlock } from './blocks/DividerBlock'

// Custom schema extending BlockNote's default blocks
// Note: createReactBlockSpec returns a factory function, so we call it to get the block spec
export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    // Include all default blocks
    ...defaultBlockSpecs,
    // Add custom blocks (call factory functions)
    callout: CalloutBlock(),
    toggle: ToggleBlock(),
    divider: DividerBlock(),
  },
})

// Export the block type for use in components
export type CustomBlockSchema = typeof customSchema.blockSchema
export type CustomBlock = typeof customSchema.Block
