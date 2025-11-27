'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchModal from './SearchModal'
import { isSearchEnabled } from '@/lib/algolia'

interface SearchButtonProps {
  bookId?: string
  className?: string
  /** If true, only render the button (no modal or keyboard handler) */
  buttonOnly?: boolean
}

export default function SearchButton({ bookId, className, buttonOnly = false }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchEnabled = isSearchEnabled()

  const openSearch = useCallback(() => setIsOpen(true), [])

  // Global keyboard shortcut (Cmd/Ctrl + K) - only on the primary instance
  useEffect(() => {
    if (!searchEnabled || buttonOnly) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchEnabled, buttonOnly])

  // Listen for custom event from buttonOnly instances
  useEffect(() => {
    if (!searchEnabled || buttonOnly) return

    const handleOpenSearch = () => setIsOpen(true)
    window.addEventListener('open-search-modal', handleOpenSearch)
    return () => window.removeEventListener('open-search-modal', handleOpenSearch)
  }, [searchEnabled, buttonOnly])

  if (!searchEnabled) return null

  // Button-only mode: just render the button that dispatches an event
  if (buttonOnly) {
    return (
      <Button
        onClick={() => window.dispatchEvent(new CustomEvent('open-search-modal'))}
        variant="outline"
        size="icon-sm"
        className={className}
        aria-label="Search (⌘K)"
        title="Search (⌘K)"
      >
        <Search className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={openSearch}
        variant="outline"
        size="icon-sm"
        className={className}
        aria-label="Search (⌘K)"
        title="Search (⌘K)"
      >
        <Search className="w-4 h-4" />
      </Button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentBookId={bookId} />
    </>
  )
}
