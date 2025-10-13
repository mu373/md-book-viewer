import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Heading, Text, PhrasingContent } from 'mdast'
import { TOCHeading } from '@/types'

/**
 * Generates a slug from heading text
 * Converts text to lowercase, replaces spaces with hyphens, and removes special characters
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extracts text content from heading node
 */
function extractTextFromNode(node: PhrasingContent): string {
  if (node.type === 'text') {
    return (node as Text).value
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join('')
  }

  return ''
}

/**
 * Extracts text from heading children
 */
function extractHeadingText(heading: Heading): string {
  return heading.children.map(extractTextFromNode).join('')
}

/**
 * Remark plugin to extract table of contents from headings
 * Adds heading IDs for anchor links
 */
export const remarkExtractTOC: Plugin<
  [{ toc: TOCHeading[] }],
  Root
> = ({ toc }) => {
  return (tree) => {
    const headings: TOCHeading[] = []

    visit(tree, 'heading', (node: Heading) => {
      // Only extract h2, h3, h4 for TOC (skip h1 as it's usually the page title)
      if (node.depth >= 2 && node.depth <= 4) {
        const text = extractHeadingText(node)
        const id = generateSlug(text)

        // Add ID to heading for anchor links
        if (!node.data) {
          node.data = {}
        }
        if (!node.data.hProperties) {
          node.data.hProperties = {}
        }

        const hProps = node.data.hProperties as Record<string, unknown>
        hProps.id = id

        headings.push({
          id,
          text,
          level: node.depth,
        })
      }
    })

    // Build hierarchical structure
    const hierarchicalTOC = buildHierarchy(headings)
    toc.push(...hierarchicalTOC)
  }
}

/**
 * Builds a hierarchical TOC structure from flat headings list
 */
function buildHierarchy(flatHeadings: TOCHeading[]): TOCHeading[] {
  const root: TOCHeading[] = []
  const stack: { level: number; heading: TOCHeading }[] = []

  for (const heading of flatHeadings) {
    // Pop stack until we find a parent with lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    // Clone heading to avoid mutation
    const newHeading: TOCHeading = {
      ...heading,
      children: [],
    }

    if (stack.length === 0) {
      // Top-level heading
      root.push(newHeading)
    } else {
      // Add as child of the last item in stack
      const parent = stack[stack.length - 1].heading
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(newHeading)
    }

    // Push current heading to stack
    stack.push({ level: heading.level, heading: newHeading })
  }

  return root
}

/**
 * Extracts TOC from markdown content without full processing
 * Useful for quick TOC generation
 */
export function extractTOCFromMarkdown(content: string): TOCHeading[] {
  const headings: TOCHeading[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const id = generateSlug(text)

      headings.push({ id, text, level })
    }
  }

  return buildHierarchy(headings)
}
