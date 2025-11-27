/**
 * Text highlighting utilities for search result navigation
 */

const HIGHLIGHT_CLASS = 'search-highlight'

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Check if an element is inside a KaTeX block or code block (should skip highlighting)
 */
function shouldSkipNode(node: Node): boolean {
  let parent = node.parentElement
  while (parent) {
    // Skip any element with katex in class name
    if (parent.className && typeof parent.className === 'string' &&
        parent.className.includes('katex')) {
      return true
    }
    // Skip code elements (including math code blocks)
    if (parent.tagName === 'CODE' || parent.tagName === 'PRE') {
      return true
    }
    // Skip any element with language-math class
    if (parent.classList?.contains('language-math')) {
      return true
    }
    parent = parent.parentElement
  }
  return false
}

export interface HighlightResult {
  found: boolean
  firstMatch: HTMLElement | null
}

/**
 * Find and highlight matching text in the DOM
 * Returns the first matched element for scrolling
 */
export function highlightTextInDOM(
  container: HTMLElement,
  searchTerms: string[]
): HighlightResult {
  const validTerms = searchTerms.filter(t => t.trim())
  if (validTerms.length === 0) {
    return { found: false, firstMatch: null }
  }

  const pattern = new RegExp(`(${validTerms.map(escapeRegExp).join('|')})`, 'gi')
  const allMarks: HTMLElement[] = []

  // Use TreeWalker to iterate through text nodes
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip empty text nodes
        if (!node.textContent?.trim()) {
          return NodeFilter.FILTER_REJECT
        }
        // Skip KaTeX elements and code blocks
        if (shouldSkipNode(node)) {
          return NodeFilter.FILTER_REJECT
        }
        // Skip script and style
        const parent = node.parentElement
        if (parent?.tagName === 'SCRIPT' || parent?.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  const textNodes: Text[] = []
  let currentNode: Node | null
  while ((currentNode = walker.nextNode())) {
    textNodes.push(currentNode as Text)
  }

  // Process text nodes (iterate in reverse to avoid index issues when modifying DOM)
  for (let i = textNodes.length - 1; i >= 0; i--) {
    const textNode = textNodes[i]
    const text = textNode.textContent || ''

    if (!pattern.test(text)) {
      pattern.lastIndex = 0 // Reset regex
      continue
    }
    pattern.lastIndex = 0 // Reset regex

    // Create a document fragment with highlighted text
    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
      }

      // Add highlighted match
      const mark = document.createElement('mark')
      mark.className = HIGHLIGHT_CLASS
      mark.textContent = match[1]
      fragment.appendChild(mark)
      allMarks.push(mark)

      lastIndex = pattern.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    // Replace original text node with fragment
    textNode.parentNode?.replaceChild(fragment, textNode)
  }

  // Since we iterated in reverse, the first mark in document order is the last one added
  const firstMatch = allMarks.length > 0 ? allMarks[allMarks.length - 1] : null

  return { found: firstMatch !== null, firstMatch }
}

