#!/usr/bin/env tsx
/**
 * Algolia Indexing Script
 *
 * Reads all books from BOOKS_CONFIG, extracts text from markdown files,
 * and pushes searchable records to Algolia.
 *
 * Usage:
 *   pnpm index:algolia
 *
 * Required environment variables:
 *   ALGOLIA_APP_ID - Your Algolia application ID
 *   ALGOLIA_ADMIN_KEY - Your Algolia admin API key (write access)
 *   ALGOLIA_INDEX_NAME - Index name (default: md-book-viewer)
 */

import { algoliasearch } from 'algoliasearch'
import fs from 'fs'
import path from 'path'
import { chunkByHeadings } from '../lib/search-utils'

// Load .env if it exists
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      if (key && value && !process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

// Load environment variables
const appId = process.env.ALGOLIA_APP_ID
const adminKey = process.env.ALGOLIA_ADMIN_KEY
const indexName = process.env.ALGOLIA_INDEX_NAME || 'md-book-viewer'

if (!appId || !adminKey) {
  console.error('Error: ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY environment variables are required')
  console.error('')
  console.error('Set them in .env.local or pass them directly:')
  console.error('  ALGOLIA_APP_ID=xxx ALGOLIA_ADMIN_KEY=xxx pnpm index:algolia')
  process.exit(1)
}

const client = algoliasearch(appId, adminKey)

interface Chapter {
  id: string
  title: string
  file: string
  order: number
  hidden?: boolean
}

interface BookMetadata {
  id: string
  title: string
  chapters: Chapter[]
}

interface SearchRecord {
  objectID: string
  bookId: string
  bookTitle: string
  chapterId: string
  chapterTitle: string
  chapterOrder: number
  heading?: string
  headingId?: string
  content: string
  url: string
}

// Import books config
const BOOKS_CONFIG: string[] = [
  './books/book-hara-bayesian',
  './books/book-mlp-graph-neural-network',
  './books/book-diffusion',
]

function expandPath(filepath: string): string {
  if (filepath.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    return path.join(homeDir, filepath.slice(2))
  }
  if (filepath.startsWith('./')) {
    return path.resolve(process.cwd(), filepath)
  }
  return filepath
}

function loadBookMetadata(bookPath: string): { metadata: BookMetadata; basePath: string } | null {
  const expandedPath = expandPath(bookPath)
  const metadataPath = path.join(expandedPath, 'book.json')

  if (!fs.existsSync(metadataPath)) {
    console.warn(`Warning: book.json not found at ${metadataPath}`)
    return null
  }

  try {
    const content = fs.readFileSync(metadataPath, 'utf-8')
    const metadata = JSON.parse(content) as BookMetadata
    return { metadata, basePath: expandedPath }
  } catch (error) {
    console.error(`Error loading ${metadataPath}:`, error)
    return null
  }
}

async function indexBooks() {
  console.log(`Indexing books to Algolia index: ${indexName}`)
  console.log('')

  const records: SearchRecord[] = []

  for (const bookPath of BOOKS_CONFIG) {
    const result = loadBookMetadata(bookPath)
    if (!result) continue

    const { metadata, basePath } = result
    console.log(`Processing book: ${metadata.title} (${metadata.id})`)

    for (const chapter of metadata.chapters) {
      if (chapter.hidden) {
        console.log(`  Skipping hidden chapter: ${chapter.title}`)
        continue
      }

      const chapterPath = path.join(basePath, chapter.file)
      if (!fs.existsSync(chapterPath)) {
        console.warn(`  Warning: Chapter file not found: ${chapterPath}`)
        continue
      }

      const content = fs.readFileSync(chapterPath, 'utf-8')
      const chunks = chunkByHeadings(content)

      console.log(`  Chapter: ${chapter.title} - ${chunks.length} chunks`)

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const baseUrl = `/${metadata.id}/${chapter.id}`
        const url = chunk.headingId ? `${baseUrl}#${chunk.headingId}` : baseUrl

        records.push({
          objectID: `${metadata.id}-${chapter.id}-${i}`,
          bookId: metadata.id,
          bookTitle: metadata.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          heading: chunk.heading,
          headingId: chunk.headingId,
          content: chunk.content,
          url,
        })
      }
    }
  }

  console.log('')
  console.log(`Total records: ${records.length}`)

  if (records.length === 0) {
    console.log('No records to index')
    return
  }

  // Configure index settings for Japanese
  console.log('Configuring index settings for Japanese...')
  await client.setSettings({
    indexName,
    indexSettings: {
      indexLanguages: ['ja'],
      queryLanguages: ['ja'],
      searchableAttributes: [
        'heading',
        'content',
        'chapterTitle',
        'bookTitle',
      ],
      attributesToHighlight: ['content', 'heading', 'chapterTitle'],
      attributesToSnippet: ['content:60'],
      attributesForFaceting: ['bookId', 'chapterId'],
      ranking: [
        'typo',
        'geo',
        'words',
        'filters',
        'proximity',
        'attribute',
        'exact',
        'custom',
      ],
    },
  })

  // Load and save synonyms
  const synonymsPath = path.resolve(process.cwd(), 'config/synonyms.json')
  if (fs.existsSync(synonymsPath)) {
    console.log('Loading synonyms...')
    const synonymsConfig = JSON.parse(fs.readFileSync(synonymsPath, 'utf-8'))
    if (synonymsConfig.synonyms?.length > 0) {
      await client.clearSynonyms({ indexName })
      await client.saveSynonyms({
        indexName,
        synonymHit: synonymsConfig.synonyms.map((s: Record<string, unknown>, i: number) => ({
          ...s,
          objectID: `synonym-${i}`,
        })),
      })
      console.log(`Saved ${synonymsConfig.synonyms.length} synonyms`)
    }
  }

  // Clear existing records and save new ones
  console.log('Uploading records to Algolia...')
  await client.clearObjects({ indexName })
  const response = await client.saveObjects({
    indexName,
    objects: records,
  })

  console.log('')
  console.log(`Successfully indexed ${records.length} records`)
  console.log(`Task IDs: ${response.map(r => r.taskID).join(', ')}`)
}

indexBooks().catch((error) => {
  console.error('Indexing failed:', error)
  process.exit(1)
})
