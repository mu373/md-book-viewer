'use client'

import { useEffect, useState } from 'react'
import { TOCHeading } from '@/types'

interface TableOfContentsProps {
  toc: TOCHeading[]
}

export default function TableOfContents({ toc }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    )

    // Observe all headings
    const headings = document.querySelectorAll('h2[id], h3[id], h4[id]')
    headings.forEach((heading) => observer.observe(heading))

    return () => {
      headings.forEach((heading) => observer.unobserve(heading))
    }
  }, [toc])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'auto',
      })

      // Update URL without scrolling
      window.history.pushState(null, '', `#${id}`)
      setActiveId(id)
    }
  }

  if (!toc || toc.length === 0) {
    return null
  }

  const renderHeading = (heading: TOCHeading) => {
    const isActive = activeId === heading.id
    const paddingLeft = `${(heading.level - 2) * 0.75}rem`

    return (
      <li key={heading.id}>
        <a
          href={`#${heading.id}`}
          onClick={(e) => handleClick(e, heading.id)}
          className={`
            block py-1 text-xs transition-colors rounded-sm px-2
            hover:text-foreground
            ${
              isActive
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            }
          `}
          style={{ paddingLeft }}
        >
          {heading.text}
        </a>
        {heading.children && heading.children.length > 0 && (
          <ul className="space-y-0.5">
            {heading.children.map((child) => renderHeading(child))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <nav className="space-y-1" aria-label="Table of contents">
      <ul className="space-y-0.5">
        {toc.map((heading) => renderHeading(heading))}
      </ul>
    </nav>
  )
}
