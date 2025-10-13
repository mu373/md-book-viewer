import fs from 'fs'
import path from 'path'
import { Book, BookMetadata, Chapter } from '@/types'
import { BOOKS_CONFIG } from '@/config/books.config'

/**
 * Expands ~ to the user's home directory
 */
function expandPath(filepath: string): string {
  if (filepath.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    return path.join(homeDir, filepath.slice(2))
  }
  return filepath
}

/**
 * Validates book metadata against the schema
 */
function validateBookMetadata(metadata: unknown, bookPath: string): BookMetadata {
  if (!metadata || typeof metadata !== 'object') {
    throw new Error(`Invalid book.json format in ${bookPath}`)
  }

  const book = metadata as Partial<BookMetadata>

  if (!book.id || typeof book.id !== 'string') {
    throw new Error(`Missing or invalid 'id' in book.json at ${bookPath}`)
  }

  if (!book.title || typeof book.title !== 'string') {
    throw new Error(`Missing or invalid 'title' in book.json at ${bookPath}`)
  }

  if (!book.chapters || !Array.isArray(book.chapters)) {
    throw new Error(`Missing or invalid 'chapters' array in book.json at ${bookPath}`)
  }

  // Validate each chapter
  book.chapters.forEach((chapter, index) => {
    if (!chapter.id || !chapter.title || !chapter.file || typeof chapter.order !== 'number') {
      throw new Error(
        `Invalid chapter at index ${index} in book.json at ${bookPath}. ` +
        `Each chapter must have: id, title, file, and order.`
      )
    }
  })

  return book as BookMetadata
}

/**
 * Loads a single book's metadata from its book.json file
 */
function loadBookMetadata(bookPath: string): Book | null {
  const expandedPath = expandPath(bookPath)
  const metadataPath = path.join(expandedPath, 'book.json')

  if (!fs.existsSync(expandedPath)) {
    console.warn(`Book directory not found: ${expandedPath}`)
    return null
  }

  if (!fs.existsSync(metadataPath)) {
    console.warn(`book.json not found in: ${expandedPath}`)
    return null
  }

  try {
    const fileContent = fs.readFileSync(metadataPath, 'utf-8')
    const metadata = JSON.parse(fileContent)
    const validatedMetadata = validateBookMetadata(metadata, bookPath)

    return {
      ...validatedMetadata,
      path: expandedPath,
    }
  } catch (error) {
    console.error(`Error loading book metadata from ${metadataPath}:`, error)
    return null
  }
}

/**
 * Loads all books from the configured paths
 */
export function getAllBooks(): Book[] {
  const books: Book[] = []

  for (const bookPath of BOOKS_CONFIG) {
    const book = loadBookMetadata(bookPath)
    if (book) {
      books.push(book)
    }
  }

  return books
}

/**
 * Gets a specific book by its ID
 */
export function getBookById(bookId: string): Book | null {
  const books = getAllBooks()
  return books.find(book => book.id === bookId) || null
}

/**
 * Gets a specific chapter from a book
 */
export function getChapter(bookId: string, chapterId: string): { book: Book; chapter: Chapter } | null {
  const book = getBookById(bookId)
  if (!book) {
    return null
  }

  const chapter = book.chapters.find(ch => ch.id === chapterId)
  if (!chapter) {
    return null
  }

  return { book, chapter }
}

/**
 * Reads the markdown content of a chapter
 */
export function getChapterContent(book: Book, chapter: Chapter): string {
  const chapterPath = path.join(book.path, chapter.file)

  if (!fs.existsSync(chapterPath)) {
    throw new Error(`Chapter file not found: ${chapterPath}`)
  }

  return fs.readFileSync(chapterPath, 'utf-8')
}

/**
 * Gets all chapter IDs for a book (for static generation)
 */
export function getAllChapterIds(bookId: string): string[] {
  const book = getBookById(bookId)
  if (!book) {
    return []
  }

  return book.chapters
    .filter(chapter => !chapter.hidden)
    .sort((a, b) => a.order - b.order)
    .map(chapter => chapter.id)
}

/**
 * Gets all book and chapter combinations (for static generation)
 */
export function getAllBookChapterPairs(): Array<{ bookId: string; chapterId: string }> {
  const books = getAllBooks()
  const pairs: Array<{ bookId: string; chapterId: string }> = []

  for (const book of books) {
    const chapterIds = getAllChapterIds(book.id)
    for (const chapterId of chapterIds) {
      pairs.push({ bookId: book.id, chapterId })
    }
  }

  return pairs
}

/**
 * Gets the next chapter in the book
 */
export function getNextChapter(bookId: string, currentChapterId: string): Chapter | null {
  const book = getBookById(bookId)
  if (!book) {
    return null
  }

  const visibleChapters = book.chapters
    .filter(ch => !ch.hidden)
    .sort((a, b) => a.order - b.order)

  const currentIndex = visibleChapters.findIndex(ch => ch.id === currentChapterId)
  if (currentIndex === -1 || currentIndex === visibleChapters.length - 1) {
    return null
  }

  return visibleChapters[currentIndex + 1]
}

/**
 * Gets the previous chapter in the book
 */
export function getPreviousChapter(bookId: string, currentChapterId: string): Chapter | null {
  const book = getBookById(bookId)
  if (!book) {
    return null
  }

  const visibleChapters = book.chapters
    .filter(ch => !ch.hidden)
    .sort((a, b) => a.order - b.order)

  const currentIndex = visibleChapters.findIndex(ch => ch.id === currentChapterId)
  if (currentIndex <= 0) {
    return null
  }

  return visibleChapters[currentIndex - 1]
}
