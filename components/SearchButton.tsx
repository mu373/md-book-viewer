'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchModal from './SearchModal'

interface SearchButtonProps {
  bookId?: string
}

export default function SearchButton({ bookId }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="icon-sm"
        aria-label="Search (⌘K)"
        title="Search (⌘K)"
      >
        <Search className="w-4 h-4" />
      </Button>

      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} currentBookId={bookId} />
    </>
  )
}
