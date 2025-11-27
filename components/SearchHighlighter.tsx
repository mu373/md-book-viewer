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
        const allMath = article.querySelectorAll('code.language-math')

        // If no math, highlight immediately
        if (allMath.length === 0) {
          highlightTextInDOM(article, terms)
          return
        }

        // Wait for KaTeX to finish rendering
        const renderedMath = article.querySelectorAll('code.language-math.katex-rendered')
        const katexElements = article.querySelectorAll('.katex')

        const katexReady = renderedMath.length >= allMath.length &&
                          katexElements.length >= renderedMath.length

        if (!katexReady && attempts < 50) {
          setTimeout(() => applyHighlight(attempts + 1), 50)
          return
        }

        // Small buffer after KaTeX renders for DOM stability
        setTimeout(() => highlightTextInDOM(article, terms), 100)
      }

      // Start after a short delay for initial render
      setTimeout(() => applyHighlight(0), 100)
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
