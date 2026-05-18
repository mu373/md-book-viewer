'use client'

import { useEffect, useRef } from 'react'
import { loadDefaultJapaneseParser } from 'budoux'

const parser = loadDefaultJapaneseParser()

interface ChapterContentProps {
  html: string
  language?: string
  mathMacros?: Record<string, string>
}

// Type declaration for KaTeX global
declare global {
  interface Window {
    katex?: {
      render: (
        tex: string,
        element: Element,
        options?: {
          displayMode?: boolean
          throwOnError?: boolean
          macros?: Record<string, string>
        }
      ) => void
    }
  }
}

export default function ChapterContent({ html, language, mathMacros }: ChapterContentProps) {
  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!articleRef.current) return

    // Add security attributes to external links
    const links = articleRef.current.querySelectorAll('a[href^="http"]')
    links.forEach((link) => {
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer nofollow')
    })

    // Apply BudouX to headers for Japanese text
    if (language === 'ja') {
      const headers = articleRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headers.forEach((header) => {
        if (header.getAttribute('data-budoux-applied')) return
        parser.applyToElement(header as HTMLElement)
        header.setAttribute('data-budoux-applied', 'true')
      })
    }

    // Render math after hydration
    const renderMath = () => {
      if (typeof window === 'undefined' || !window.katex) {
        // KaTeX not loaded yet, try again
        setTimeout(renderMath, 50)
        return
      }

      const mathElements = articleRef.current?.querySelectorAll('code.language-math')
      if (!mathElements) return

      const macros = { ...mathMacros }

      mathElements.forEach((el) => {
        // Skip if already rendered
        if (el.classList.contains('katex-rendered')) return

        const isDisplay = el.classList.contains('math-display')
        const text = el.textContent || ''

        try {
          window.katex?.render(text, el, {
            displayMode: isDisplay,
            throwOnError: false,
            macros,
          })
          el.classList.add('katex-rendered')
        } catch (e) {
          console.error('KaTeX render error:', e)
        }
      })
    }

    // Small delay to ensure DOM is fully settled after hydration
    setTimeout(renderMath, 0)
  }, [html, language, mathMacros])

  return (
    <article
      ref={articleRef}
      className="markdown-content max-w-none"
      lang={language}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
