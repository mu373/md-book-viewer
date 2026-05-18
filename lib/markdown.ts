import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeShiki from '@shikijs/rehype'
import rehypeStringify from 'rehype-stringify'
import matter from 'gray-matter'
import { remarkJapaneseIndent } from './remark-japanese-indent'
import { remarkSingleLineBreaks } from './remark-single-line-breaks'
import { rehypeWrapTables } from './rehype-wrap-tables'
import { remarkExtractTOC } from './toc'
import type { ProcessedMarkdown, TOCHeading } from '@/types'

/**
 * Processes markdown content and returns HTML with TOC and frontmatter
 */
export async function processMarkdown(content: string): Promise<ProcessedMarkdown> {
  // Extract frontmatter
  const { content: markdownContent, data: frontmatter } = matter(content)

  // Array to collect TOC headings
  const toc: TOCHeading[] = []

  // Process markdown through the unified pipeline
  const result = await unified()
    .use(remarkParse) // Parse markdown
    .use(remarkSingleLineBreaks) // Convert single line breaks to hard breaks
    .use(remarkMath) // Support math notation ($...$ and $$...$$)
    .use(remarkGfm) // GitHub Flavored Markdown (tables, strikethrough, etc.)
    .use(remarkJapaneseIndent) // Handle Japanese full-width space indentation
    .use(remarkExtractTOC, { toc }) // Extract TOC and add IDs to headings
    .use(remarkRehype, { allowDangerousHtml: true }) // Convert to HTML AST
    .use(rehypeRaw) // Support raw HTML in markdown
    .use(rehypeWrapTables) // Keep tables scrollable without changing table layout
    // Note: Math will be rendered client-side by KaTeX
    .use(rehypeShiki, {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    })
    .use(rehypeStringify) // Convert to HTML string
    .process(markdownContent)

  return {
    html: String(result),
    toc,
    frontmatter: Object.keys(frontmatter).length > 0 ? frontmatter : undefined,
  }
}
