'use client'

import { useEffect, useRef } from 'react'
import { highlightTextInDOM } from '@/lib/highlight'

const HIGHLIGHT_STORAGE_KEY = 'search-highlight-terms'

/**
 * Client component that handles search term highlighting.
 * Reads highlight terms from sessionStorage (set by SearchModal).
 */
export default function SearchHighlighter() {
  const hasHighlighted = useRef(false)

  useEffect(() => {
    if (hasHighlighted.current) return

    const stored = sessionStorage.getItem(HIGHLIGHT_STORAGE_KEY)
    if (!stored) return

    // Clear immediately to prevent re-highlighting on page refresh
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

      hasHighlighted.current = true
      highlightTextInDOM(article, terms)
    }

    setTimeout(() => applyHighlight(0), 800)
  }, [])

  return null
}
