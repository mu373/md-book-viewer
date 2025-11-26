import matter from 'gray-matter'

/**
 * Strips markdown syntax and returns plain text
 */
export function stripMarkdown(content: string): string {
  return content
    // Remove frontmatter
    .replace(/^---[\s\S]*?---\n?/m, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove emphasis markers
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove blockquotes marker
    .replace(/^>\s?/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove math blocks (keep content for searchability)
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$]+\$/g, '')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Generates a URL-safe ID from heading text
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface ContentChunk {
  heading?: string
  headingId?: string
  headingLevel?: number
  content: string
}

/**
 * Splits markdown content into chunks by headings
 * Each chunk contains the heading and its following content
 */
export function chunkByHeadings(markdownContent: string, maxChunkSize = 500): ContentChunk[] {
  // Remove frontmatter first
  const { content } = matter(markdownContent)

  const chunks: ContentChunk[] = []
  const lines = content.split('\n')

  let currentHeading: string | undefined
  let currentHeadingId: string | undefined
  let currentHeadingLevel: number | undefined
  let currentContent: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/)

    if (headingMatch) {
      // Save previous chunk if it has content
      if (currentContent.length > 0) {
        const text = stripMarkdown(currentContent.join('\n')).trim()
        if (text.length > 0) {
          // Split into smaller chunks if too large
          const subChunks = splitIntoChunks(text, maxChunkSize)
          for (let i = 0; i < subChunks.length; i++) {
            chunks.push({
              heading: currentHeading,
              headingId: currentHeadingId,
              headingLevel: currentHeadingLevel,
              content: subChunks[i],
            })
          }
        }
      }

      // Start new section
      currentHeading = headingMatch[2].trim()
      currentHeadingId = generateHeadingId(currentHeading)
      currentHeadingLevel = headingMatch[1].length
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  // Don't forget the last chunk
  if (currentContent.length > 0) {
    const text = stripMarkdown(currentContent.join('\n')).trim()
    if (text.length > 0) {
      const subChunks = splitIntoChunks(text, maxChunkSize)
      for (let i = 0; i < subChunks.length; i++) {
        chunks.push({
          heading: currentHeading,
          headingId: currentHeadingId,
          headingLevel: currentHeadingLevel,
          content: subChunks[i],
        })
      }
    }
  }

  // If no headings found, create chunks from the whole content
  if (chunks.length === 0) {
    const text = stripMarkdown(content).trim()
    if (text.length > 0) {
      const subChunks = splitIntoChunks(text, maxChunkSize)
      for (const chunk of subChunks) {
        chunks.push({ content: chunk })
      }
    }
  }

  return chunks
}

/**
 * Splits text into chunks of approximately maxSize characters
 * Tries to split at paragraph or sentence boundaries
 */
function splitIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) {
    return [text]
  }

  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  let currentChunk = ''

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 <= maxSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    } else {
      if (currentChunk) {
        chunks.push(currentChunk)
      }

      // If single paragraph is too large, split by sentences
      if (para.length > maxSize) {
        const sentences = para.split(/(?<=[。．.!?！？])\s*/)
        currentChunk = ''

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= maxSize) {
            currentChunk += (currentChunk ? ' ' : '') + sentence
          } else {
            if (currentChunk) {
              chunks.push(currentChunk)
            }
            // If single sentence is still too large, just add it
            currentChunk = sentence
          }
        }
      } else {
        currentChunk = para
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}
