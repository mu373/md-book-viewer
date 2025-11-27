'use client'

import { useEffect } from 'react'
import { highlightTextInDOM, clearHighlights } from '@/lib/highlight'

const HIGHLIGHT_STORAGE_KEY = 'search-highlight-terms'

/**
 * Client component that handles search term highlighting.
 * Reads highlight terms from sessionStorage (set by SearchModal).
 */
export default function SearchHighlighter() {
  useEffect(() => {
    const checkAndHighlight = () => {
      const stored = sessionStorage.getItem(HIGHLIGHT_STORAGE_KEY)
      if (!stored) return

      sessionStorage.removeItem(HIGHLIGHT_STORAGE_KEY)

      let terms: string[]
      try {
        terms = JSON.parse(stored)
        if (!Array.isArray(terms) || terms.length === 0) return
      } catch {
        return
      }

      const article = document.querySelector('article.markdown-content') as HTMLElement
      if (!article) return

      // Clear previous highlights
      clearHighlights(article)

      const applyHighlight = (attempts = 0) => {
        // Wait for KaTeX to finish rendering
        const allMath = article.querySelectorAll('code.language-math')
        const renderedMath = article.querySelectorAll('code.language-math.katex-rendered')
        const katexElements = article.querySelectorAll('.katex')

        const katexNotReady = allMath.length > 0 && (
          renderedMath.length < allMath.length ||
          katexElements.length < renderedMath.length ||
          attempts < 15
        )

        if (katexNotReady && attempts < 100) {
          setTimeout(() => applyHighlight(attempts + 1), 100)
          return
        }

        highlightTextInDOM(article, terms)
      }

      setTimeout(() => applyHighlight(0), 800)
    }

    // Check on mount
    checkAndHighlight()

    // Poll for new terms (handles same-page navigation)
    const interval = setInterval(() => {
      if (sessionStorage.getItem(HIGHLIGHT_STORAGE_KEY)) {
        checkAndHighlight()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return null
}
