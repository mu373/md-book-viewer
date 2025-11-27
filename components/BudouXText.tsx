'use client'

import { useMemo } from 'react'
import { loadDefaultJapaneseParser } from 'budoux'

const parser = loadDefaultJapaneseParser()

interface BudouXTextProps {
  children: string
  language?: string
  className?: string
}

export default function BudouXText({ children, language, className }: BudouXTextProps) {
  const segments = useMemo(() => {
    if (language === 'ja') {
      return parser.parse(children)
    }
    return null
  }, [children, language])

  if (language === 'ja' && segments) {
    return (
      <span className={className} style={{ wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
        {segments.map((seg, i) => (
          <span key={i}>
            {seg}
            {i < segments.length - 1 && <wbr />}
          </span>
        ))}
      </span>
    )
  }

  return <span className={className}>{children}</span>
}
