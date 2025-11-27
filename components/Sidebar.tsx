'use client'

import { useState } from 'react'
import { TOCHeading, Book, Chapter } from '@/types'
import TableOfContents from './TableOfContents'
import Navigation from './Navigation'
import ThemeToggle from './ThemeToggle'
import { Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchButton from './SearchButton'

interface SidebarProps {
  book: Book
  currentChapter: Chapter
  toc: TOCHeading[]
  previousChapter?: Chapter | null
  nextChapter?: Chapter | null
}

export default function Sidebar({
  book,
  currentChapter,
  toc,
  previousChapter,
  nextChapter,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile Search Button */}
      <SearchButton
        bookId={book.id}
        className="fixed top-4 right-16 z-50 lg:hidden size-9"
      />

      {/* Mobile Menu Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Desktop Toggle Buttons - floats and changes icon based on state */}
      <div className="hidden lg:flex fixed bottom-4 left-4 z-50 gap-2">
<SearchButton bookId={book.id} />
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="outline"
          size="icon-sm"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft /> : <PanelLeftClose />}
        </Button>
        <ThemeToggle />
      </div>

      {/* Left Sidebar - Navigation only */}
      <aside
        className={`
          fixed top-0 left-0 h-full
          bg-sidebar border-r border-sidebar-border
          overflow-hidden z-40 flex flex-col
          w-full lg:w-80
          lg:bg-transparent lg:border-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full invisible lg:visible'}
          ${isCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}
        `}
      >
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-16 lg:pt-4 text-base lg:text-xs">
          {/* Navigation (Chapter List) */}
          <Navigation
            book={book}
            currentChapter={currentChapter}
            previousChapter={previousChapter}
            nextChapter={nextChapter}
          />
        </div>

      </aside>

      {/* Right Sidebar for TOC on Desktop */}
      <aside className="hidden xl:block fixed top-0 right-0 h-full w-70 overflow-y-auto">
        <div className="p-4 sticky top-0">
          <TableOfContents toc={toc} />
        </div>
      </aside>
    </>
  )
}
