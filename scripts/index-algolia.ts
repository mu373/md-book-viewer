#!/usr/bin/env tsx
/**
 * Algolia Indexing Script
 *
 * Reads all books from BOOKS_CONFIG, extracts text from markdown files,
 * and pushes searchable records to Algolia.
 *
 * Usage:
 *   pnpm index
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
import { BOOKS_CONFIG } from '../config/books.config'

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
  console.error('Set them in .env or pass them directly:')
  console.error('  ALGOLIA_APP_ID=xxx ALGOLIA_ADMIN_KEY=xxx pnpm index')
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
  language?: string
  chapters: Chapter[]
}

interface SearchRecord extends Record<string, unknown> {
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
  language: string
}

// Books config imported from config/books.config.ts

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

function loadBookMetadata(bookPath: string): { metadata: BookMetadata; basePath: string } {
  const expandedPath = expandPath(bookPath)
  const metadataPath = path.join(expandedPath, 'book.json')
  const metadata: BookMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
  return { metadata, basePath: expandedPath }
}

async function indexBooks() {
  console.log(`Indexing books to Algolia index: ${indexName}`)
  console.log('')

  const records: SearchRecord[] = []

  for (const bookPath of BOOKS_CONFIG) {
    const result = loadBookMetadata(bookPath)

    const { metadata, basePath } = result
    console.log(`Processing book: ${metadata.title} (${metadata.id})`)

    for (const chapter of metadata.chapters) {
      if (chapter.hidden) {
        console.log(`  Skipping hidden chapter: ${chapter.title}`)
        continue
      }

      const chapterPath = path.join(basePath, chapter.file)
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
          language: metadata.language || 'ja',
        })
      }
    }
  }

  console.log('')
  console.log(`Total records: ${records.length}`)

  if (records.length === 0) {
    throw new Error('No records to index; keeping the existing index')
  }

  // Configure index settings
  console.log('Configuring index settings...')
  const settingsTask = await client.setSettings({
    indexName,
    indexSettings: {
      indexLanguages: ['ja', 'en'],
      queryLanguages: ['ja', 'en'],
      searchableAttributes: [
        'content',
        'heading',
        'chapterTitle',
        'bookTitle',
      ],
      attributesToHighlight: ['content', 'heading', 'chapterTitle'],
      attributesToSnippet: ['content:60'],
      attributesForFaceting: ['bookId', 'chapterId', 'language'],
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

  await client.waitForTask({ indexName, taskID: settingsTask.taskID })

  // Load and save synonyms
  const synonymsPath = path.resolve(process.cwd(), 'config/synonyms.json')
  if (fs.existsSync(synonymsPath)) {
    console.log('Loading synonyms...')
    const synonymsConfig = JSON.parse(fs.readFileSync(synonymsPath, 'utf-8'))
    if (synonymsConfig.synonyms?.length > 0) {
      const synonymsTask = await client.saveSynonyms({
        indexName,
        replaceExistingSynonyms: true,
        synonymHit: synonymsConfig.synonyms.map((s: Record<string, unknown>, i: number) => ({
          ...s,
          objectID: `synonym-${i}`,
        })),
      })
      await client.waitForTask({ indexName, taskID: synonymsTask.taskID })
      console.log(`Saved ${synonymsConfig.synonyms.length} synonyms`)
    }
  }

  // Keep the live index until the temporary index is fully uploaded.
  console.log('Uploading records to Algolia...')
  const response = await client.replaceAllObjects({
    indexName,
    objects: records,
  })

  console.log('')
  console.log(`Successfully indexed ${records.length} records`)
  console.log(`Completed replacement task: ${response.moveOperationResponse.taskID}`)
}

indexBooks().catch((error) => {
  console.error('Indexing failed:', error)
  process.exit(1)
})
