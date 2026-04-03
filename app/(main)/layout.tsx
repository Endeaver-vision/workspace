'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { TemplatesDialog } from '@/components/templates/TemplatesDialog'
import { SettingsDialog } from '@/components/settings/SettingsDialog'
import { useUIStore } from '@/lib/store/ui-store'
import { cn } from '@/lib/utils'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen, sidebarWidth, setCommandPaletteOpen } = useUIStore()
  const [hasMounted, setHasMounted] = useState(false)

  // Hydration fix
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen])

  // Use default values during SSR to prevent hydration mismatch
  const effectiveSidebarOpen = hasMounted ? sidebarOpen : true
  const effectiveSidebarWidth = hasMounted ? sidebarWidth : 280

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-200',
          effectiveSidebarOpen ? 'ml-[var(--sidebar-width)]' : 'ml-0'
        )}
        style={{
          '--sidebar-width': `${effectiveSidebarWidth}px`,
        } as React.CSSProperties}
      >
        {children}
      </main>
      {hasMounted && (
        <>
          <TemplatesDialog />
          <SettingsDialog />
        </>
      )}
    </div>
  )
}
