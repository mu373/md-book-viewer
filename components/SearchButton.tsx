'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchModal from './SearchModal'
import { isSearchEnabled } from '@/lib/algolia'

interface SearchButtonProps {
  bookId?: string
  className?: string
}

export default function SearchButton({ bookId, className }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchEnabled = isSearchEnabled()

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    if (!searchEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchEnabled])

  if (!searchEnabled) return null

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
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
