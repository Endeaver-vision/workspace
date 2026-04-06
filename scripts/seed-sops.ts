import * as fs from 'fs'
import * as path from 'path'
import mammoth from 'mammoth'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://arflfrnwnbpnhpghwilk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZmxmcm53bmJwbmhwZ2h3aWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTA1NTAsImV4cCI6MjA4MTA2NjU1MH0.3e4xBOpdvJzEE7Ofsm9n3sdSDKmQzOVTepN_oMZ7Rbg'

const WORKSPACE_ID = '00000000-0000-0000-0000-000000000002'
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface SOPData {
  title: string
  content: any[]
  category: string
  filePath: string
}

// Convert text content to BlockNote format
function textToBlockNote(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim())
  const blocks: any[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Detect headers (lines that are all caps or short bold-looking lines)
    const isHeader = trimmed.length < 100 && (
      trimmed === trimmed.toUpperCase() ||
      trimmed.startsWith('SOP:') ||
      trimmed.startsWith('Purpose') ||
      trimmed.startsWith('Scope') ||
      trimmed.startsWith('Procedure') ||
      trimmed.startsWith('Step') ||
      /^[IVX]+\./.test(trimmed) ||
      /^\d+\./.test(trimmed)
    )

    if (isHeader && trimmed.length < 80) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'heading',
        props: {
          level: trimmed === trimmed.toUpperCase() && trimmed.length < 50 ? 1 : 2,
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [{ type: 'text', text: trimmed, styles: {} }],
        children: []
      })
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'bulletListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [{ type: 'text', text: trimmed.slice(1).trim(), styles: {} }],
        children: []
      })
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'numberedListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [{ type: 'text', text: trimmed.replace(/^\d+\.\s*/, ''), styles: {} }],
        children: []
      })
    } else {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [{ type: 'text', text: trimmed, styles: {} }],
        children: []
      })
    }
  }

  return blocks
}

// Extract title from filename
function extractTitle(filename: string): string {
  let title = path.basename(filename, path.extname(filename))
  // Remove "SOP_" or "SOP:" prefix
  title = title.replace(/^SOP[_:\s]+/i, '').trim()
  // Clean up underscores
  title = title.replace(/_/g, ' ').trim()
  return title || 'Untitled SOP'
}

// Determine category from content or filename
function determineCategory(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase()

  if (text.includes('insurance') || text.includes('verification') || text.includes('billing')) {
    return 'Insurance & Billing'
  }
  if (text.includes('check-in') || text.includes('checkout') || text.includes('appointment') || text.includes('confirmation')) {
    return 'Front Desk'
  }
  if (text.includes('phone') || text.includes('call')) {
    return 'Communication'
  }
  if (text.includes('exam') || text.includes('eye') || text.includes('comprehensive')) {
    return 'Clinical Procedures'
  }
  if (text.includes('contact lens') || text.includes('fitting')) {
    return 'Contact Lenses'
  }
  if (text.includes('optical') || text.includes('glasses') || text.includes('repair') || text.includes('order')) {
    return 'Optical Services'
  }
  if (text.includes('ortho') || text.includes('dreamlens')) {
    return 'Specialty Services'
  }
  if (text.includes('emr') || text.includes('documentation') || text.includes('workflow')) {
    return 'Documentation'
  }

  return 'General'
}

async function parseDocxFile(filePath: string): Promise<SOPData | null> {
  try {
    const buffer = fs.readFileSync(filePath)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value

    if (!text.trim()) {
      console.log(`  Skipping empty file: ${filePath}`)
      return null
    }

    const title = extractTitle(filePath)
    const category = determineCategory(title, text)
    const content = textToBlockNote(text)

    return {
      title,
      content,
      category,
      filePath
    }
  } catch (error) {
    console.error(`  Error parsing ${filePath}:`, error)
    return null
  }
}

async function createCategory(name: string): Promise<string> {
  // Check if category exists
  const { data: existing } = await supabase
    .from('sop_categories')
    .select('id')
    .eq('workspace_id', WORKSPACE_ID)
    .eq('name', name)
    .single()

  if (existing) {
    return existing.id
  }

  // Create new category
  const { data: newCat, error } = await supabase
    .from('sop_categories')
    .insert({
      workspace_id: WORKSPACE_ID,
      name,
      icon: getIconForCategory(name)
    })
    .select('id')
    .single()

  if (error) {
    console.error(`Error creating category ${name}:`, error)
    throw error
  }

  return newCat.id
}

function getIconForCategory(name: string): string {
  const icons: Record<string, string> = {
    'Insurance & Billing': '💳',
    'Front Desk': '🏥',
    'Communication': '📞',
    'Clinical Procedures': '👁️',
    'Contact Lenses': '👁️',
    'Optical Services': '👓',
    'Specialty Services': '⭐',
    'Documentation': '📄',
    'General': '📋'
  }
  return icons[name] || '📋'
}

async function seedSOPs() {
  console.log('Starting SOP seed process...\n')

  const sopFolders = [
    '/Users/cmac/Downloads/SOP',
    '/Users/cmac/Downloads/SOP_S'
  ]

  const allFiles: string[] = []

  for (const folder of sopFolders) {
    if (fs.existsSync(folder)) {
      const files = fs.readdirSync(folder)
        .filter(f => f.endsWith('.docx'))
        .map(f => path.join(folder, f))
      allFiles.push(...files)
    }
  }

  console.log(`Found ${allFiles.length} .docx files\n`)

  // Track categories to avoid duplicates
  const categoryIds: Record<string, string> = {}
  const seenTitles = new Set<string>()

  let successCount = 0
  let skipCount = 0

  for (const filePath of allFiles) {
    console.log(`Processing: ${path.basename(filePath)}`)

    const sopData = await parseDocxFile(filePath)
    if (!sopData) {
      skipCount++
      continue
    }

    // Skip duplicates (SOP_S folder has updated versions)
    const normalizedTitle = sopData.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seenTitles.has(normalizedTitle)) {
      console.log(`  Skipping duplicate: ${sopData.title}`)
      skipCount++
      continue
    }
    seenTitles.add(normalizedTitle)

    // Get or create category
    if (!categoryIds[sopData.category]) {
      categoryIds[sopData.category] = await createCategory(sopData.category)
      console.log(`  Created category: ${sopData.category}`)
    }

    // Insert SOP
    const { error } = await supabase
      .from('sops')
      .insert({
        workspace_id: WORKSPACE_ID,
        title: sopData.title,
        content: sopData.content,
        category_id: categoryIds[sopData.category],
        status: 'published',
        version: 1,
        created_by: TEST_USER_ID
      })

    if (error) {
      console.error(`  Error inserting SOP:`, error.message)
      skipCount++
    } else {
      console.log(`  ✓ Added: ${sopData.title} (${sopData.category})`)
      successCount++
    }
  }

  console.log(`\n========================================`)
  console.log(`Seed complete!`)
  console.log(`  Successfully added: ${successCount} SOPs`)
  console.log(`  Skipped: ${skipCount} files`)
  console.log(`  Categories created: ${Object.keys(categoryIds).length}`)
  console.log(`========================================\n`)
}

seedSOPs().catch(console.error)
