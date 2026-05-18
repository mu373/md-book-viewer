export interface Chapter {
  id: string
  title: string
  file: string
  order: number
  description?: string
  hidden?: boolean
}

export interface BookMetadata {
  id: string
  title: string
  subtitle?: string
  author?: string
  publisher?: string
  year?: string
  description?: string
  language?: string
  cover?: string
  chapters: Chapter[]
}

export interface Book extends BookMetadata {
  path: string
}

export interface TOCHeading {
  id: string
  text: string
  level: number
  children?: TOCHeading[]
}

export interface ProcessedMarkdown {
  html: string
  toc: TOCHeading[]
  mathMacros?: Record<string, string>
  frontmatter?: Record<string, unknown>
}
