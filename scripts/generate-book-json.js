#!/usr/bin/env node

/**
 * Book JSON Generator
 *
 * This script scans a book directory and generates a book.json template
 * based on the markdown files found in the chapters directory.
 *
 * Usage:
 *   node scripts/generate-book-json.js <path-to-book-directory>
 *
 * Example:
 *   node scripts/generate-book-json.js ~/Developer/my-book
 */

const fs = require('fs')
const path = require('path')

function expandPath(filepath) {
  if (filepath.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE
    return path.join(homeDir, filepath.slice(2))
  }
  return filepath
}

function extractTitleFromFilename(filename) {
  // Remove extension and number prefix
  const withoutExt = filename.replace(/\.md$/, '')
  const withoutPrefix = withoutExt.replace(/^\d+-/, '')

  // Convert kebab-case or snake_case to Title Case
  return withoutPrefix
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function generateChapterId(filename) {
  const withoutExt = filename.replace(/\.md$/, '')
  const withoutPrefix = withoutExt.replace(/^\d+-/, '')
  return withoutPrefix
}

function scanBookDirectory(bookPath) {
  const expandedPath = expandPath(bookPath)

  if (!fs.existsSync(expandedPath)) {
    console.error(`Error: Directory not found: ${expandedPath}`)
    process.exit(1)
  }

  const chaptersPath = path.join(expandedPath, 'chapters')

  if (!fs.existsSync(chaptersPath)) {
    console.error(`Error: No 'chapters' directory found in ${expandedPath}`)
    console.log(`\nPlease create a 'chapters' directory and add your markdown files there.`)
    process.exit(1)
  }

  // Find all markdown files
  const files = fs.readdirSync(chaptersPath)
    .filter(file => file.endsWith('.md'))
    .sort()

  if (files.length === 0) {
    console.error(`Error: No markdown files found in ${chaptersPath}`)
    process.exit(1)
  }

  // Generate chapters array
  const chapters = files.map((file, index) => ({
    id: generateChapterId(file),
    title: extractTitleFromFilename(file),
    file: `chapters/${file}`,
    order: index + 1
  }))

  // Get book directory name for default ID
  const bookDirName = path.basename(expandedPath)
  const defaultId = bookDirName.toLowerCase().replace(/^book-/, '').replace(/[^a-z0-9-]/g, '-')

  // Generate book.json template
  const bookJson = {
    id: defaultId,
    title: "Your Book Title",
    subtitle: "Optional Subtitle",
    author: "Author Name",
    description: "Brief description of the book",
    language: "en",
    chapters
  }

  return bookJson
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: node scripts/generate-book-json.js <path-to-book-directory>')
    console.log('\nExample:')
    console.log('  node scripts/generate-book-json.js ~/Developer/my-book')
    process.exit(1)
  }

  const bookPath = args[0]

  console.log(`Scanning book directory: ${bookPath}\n`)

  const bookJson = scanBookDirectory(bookPath)
  const expandedPath = expandPath(bookPath)
  const outputPath = path.join(expandedPath, 'book.json')

  // Check if book.json already exists
  if (fs.existsSync(outputPath)) {
    console.log(`⚠️  Warning: book.json already exists at ${outputPath}`)
    console.log('\nGenerated JSON (not saved):')
    console.log(JSON.stringify(bookJson, null, 2))
    console.log('\nTo overwrite, delete the existing book.json file first.')
    process.exit(0)
  }

  // Write book.json
  fs.writeFileSync(outputPath, JSON.stringify(bookJson, null, 2) + '\n')

  console.log(`✓ Generated book.json at ${outputPath}`)
  console.log(`\nFound ${bookJson.chapters.length} chapters:\n`)

  bookJson.chapters.forEach(chapter => {
    console.log(`  ${chapter.order}. ${chapter.title} (${chapter.id})`)
  })

  console.log(`\n⚠️  Please edit ${outputPath} to customize:`)
  console.log('  - Book title, subtitle, and author')
  console.log('  - Chapter titles (currently auto-generated from filenames)')
  console.log('  - Language and description')
  console.log('\nThen add the book path to config/books.config.ts')
}

main()
