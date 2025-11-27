'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { search, SearchResult } from '@/lib/algolia'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  currentBookId?: string
}

interface Hit {
  url: string
  _snippetResult?: { content?: { value?: string } }
  _highlightResult?: { content?: { value?: string } }
}

const HIGHLIGHT_STORAGE_KEY = 'search-highlight-terms'
const SEARCH_QUERY_KEY = 'search-query'

function extractHighlightTerms(hit: Hit): string[] {
  const highlightedContent = hit._snippetResult?.content?.value || hit._highlightResult?.content?.value || ''
  const matches = highlightedContent.matchAll(/<mark>([^<]+)<\/mark>/g)
  const terms = [...matches].map(m => m[1])
  return [...new Set(terms)] // deduplicate
}

function navigateWithHighlight(hit: Hit, router: ReturnType<typeof useRouter>) {
  const terms = extractHighlightTerms(hit)
  if (terms.length > 0) {
    sessionStorage.setItem(HIGHLIGHT_STORAGE_KEY, JSON.stringify(terms))
  }
  router.push(hit.url)
}

export default function SearchModal({ isOpen, onClose, currentBookId }: SearchModalProps) {
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SEARCH_QUERY_KEY) || ''
    }
    return ''
  })
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchScope, setSearchScope] = useState<'book' | 'all'>(
    currentBookId ? 'book' : 'all'
  )
  const [isComposing, setIsComposing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Persist query to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SEARCH_QUERY_KEY, query)
  }, [query])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const bookId = searchScope === 'book' ? currentBookId : undefined
        const result = await search(query, bookId)
        setResults(result)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, searchScope, currentBookId])

  // Focus input and select text when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      inputRef.current?.select()
      setSelectedIndex(0)
      setSearchScope(currentBookId ? 'book' : 'all')
    }
  }, [isOpen, currentBookId])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape always works
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    // Ignore other key events during IME composition
    if (isComposing || e.nativeEvent.isComposing || e.keyCode === 229) return

    if (!results?.hits.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.hits.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        const hit = results.hits[selectedIndex]
        if (hit) {
          navigateWithHighlight(hit, router)
          onClose()
        }
        break
    }
  }, [results, selectedIndex, router, onClose, isComposing])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center lg:pt-[15vh]"
      onClick={handleBackdropClick}
    >
      <div className="bg-background shadow-2xl w-full h-full flex flex-col lg:border lg:border-border lg:rounded-lg lg:max-w-2xl lg:mx-4 lg:h-auto lg:max-h-[80vh]">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Search scope toggle */}
        {currentBookId && (
          <div className="flex gap-2 px-4 py-2 border-b border-border">
            <button
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                searchScope === 'book'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSearchScope('book')}
            >
              この本
            </button>
            <button
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                searchScope === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSearchScope('all')}
            >
              すべての本
            </button>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto lg:flex-none lg:max-h-[60vh]">
          {results && results.hits.length > 0 ? (
            <ul className="py-2">
              {results.hits.map((hit, index) => (
                <li key={hit.objectID}>
                  <button
                    onClick={() => {
                      navigateWithHighlight(hit, router)
                      onClose()
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                  >
                    {searchScope === 'all' && (
                      <div className="text-xs text-muted-foreground truncate">
                        {hit.bookTitle}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 truncate">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: hit._highlightResult?.chapterTitle?.value || hit.chapterTitle,
                        }}
                      />
                      {hit.heading && (
                        <>
                          <span>›</span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: hit._highlightResult?.heading?.value || hit.heading,
                            }}
                          />
                        </>
                      )}
                    </div>
                    {hit._snippetResult?.content?.value?.includes('<mark>') && (
                      <p
                        className="text-sm text-foreground line-clamp-2 [&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-800"
                        dangerouslySetInnerHTML={{
                          __html: hit._snippetResult.content.value,
                        }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : results && results.hits.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              「{query}」に一致する結果が見つかりませんでした
            </div>
          ) : query.trim() ? null : (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              キーワードを入力して検索
            </div>
          )}
        </div>

        {/* Footer with keyboard hints - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↓</kbd>
            移動
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>
            開く
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
            閉じる
          </span>
        </div>
      </div>
    </div>
  )
}
