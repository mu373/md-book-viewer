#!/usr/bin/env node

/**
 * Book Images Copy Script
 *
 * This script copies images from book repositories to the Next.js output directory
 * to maintain relative path structure (../images/) used in markdown files.
 *
 * For each book:
 *   {bookPath}/images/* → out/{bookId}/images/*
 *
 * This allows markdown references like `![alt](../images/fig.png)` to work
 * in the static output where chapters are at `out/{bookId}/{chapterId}/index.html`
 */

const fs = require('fs')
const path = require('path')

// Get books config - use dynamic import since it's TypeScript
const { execSync } = require('child_process')

function expandPath(filepath) {
  if (filepath.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE
    return path.join(homeDir, filepath.slice(2))
  }
  return filepath
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    return 0
  }

  // Create destination directory
  fs.mkdirSync(dest, { recursive: true })

  let copiedCount = 0
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copiedCount += copyDirectory(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      copiedCount++
    }
  }

  return copiedCount
}

function loadBooksConfig() {
  const configPath = path.join(__dirname, '..', 'config', 'books.config.ts')

  if (!fs.existsSync(configPath)) {
    console.error('Error: config/books.config.ts not found')
    console.error('Please create the configuration file first.')
    process.exit(1)
  }

  // Read and parse the TypeScript config file
  const configContent = fs.readFileSync(configPath, 'utf-8')
  const match = configContent.match(/export\s+const\s+BOOKS_CONFIG\s*:\s*string\[\]\s*=\s*(\[[\s\S]*?\])/m)

  if (!match) {
    console.error('Error: Could not parse BOOKS_CONFIG from books.config.ts')
    process.exit(1)
  }

  // Parse the array (this is a simple parser, might need improvement for complex cases)
  const arrayStr = match[1]
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments

  try {
    // Use eval in a safe way since we control the input
    const bookPaths = eval(arrayStr)
    return bookPaths
  } catch (error) {
    console.error('Error: Failed to parse book paths from config:', error.message)
    process.exit(1)
  }
}

function getBookId(bookPath) {
  const expandedPath = expandPath(bookPath)
  const metadataPath = path.join(expandedPath, 'book.json')

  if (!fs.existsSync(metadataPath)) {
    return null
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    return metadata.id
  } catch (error) {
    console.error(`Error reading book.json from ${expandedPath}:`, error.message)
    return null
  }
}

function main() {
  // Check which mode we're in based on command line argument
  const mode = process.argv[2] || 'build' // 'build' or 'dev'

  const outDir = path.join(__dirname, '..', 'out')
  const publicDir = path.join(__dirname, '..', 'public')

  if (mode === 'build') {
    console.log('📚 Copying book images to output directory...\n')

    if (!fs.existsSync(outDir)) {
      console.error('Error: out/ directory not found. Please run "pnpm build" first.')
      process.exit(1)
    }
  } else if (mode === 'dev') {
    console.log('📚 Copying book images to public directory for dev mode...\n')

    // Create public directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }
  }

  const bookPaths = loadBooksConfig()
  console.log(`Found ${bookPaths.length} book(s) in configuration\n`)

  let totalBooks = 0
  let totalImages = 0

  for (const bookPath of bookPaths) {
    const expandedPath = expandPath(bookPath)
    const bookId = getBookId(bookPath)

    if (!bookId) {
      console.warn(`⚠️  Skipping ${bookPath} (no valid book.json)`)
      continue
    }

    const imagesSourcePath = path.join(expandedPath, 'images')
    const imagesDestPath = mode === 'build'
      ? path.join(outDir, bookId, 'images')
      : path.join(publicDir, bookId, 'images')

    if (!fs.existsSync(imagesSourcePath)) {
      console.log(`ℹ️  ${bookId}: No images directory found, skipping`)
      continue
    }

    console.log(`📖 ${bookId}:`)
    console.log(`   Source: ${imagesSourcePath}`)
    console.log(`   Dest:   ${imagesDestPath}`)

    const copiedCount = copyDirectory(imagesSourcePath, imagesDestPath)

    if (copiedCount > 0) {
      console.log(`   ✓ Copied ${copiedCount} file(s)\n`)
      totalBooks++
      totalImages += copiedCount
    } else {
      console.log(`   ℹ️  No files to copy\n`)
    }
  }

  console.log('─'.repeat(50))
  console.log(`✓ Done! Copied ${totalImages} image(s) from ${totalBooks} book(s)`)

  if (mode === 'dev') {
    console.log('\n💡 Images are now available in dev mode at /{bookId}/images/')
  }
}

main()
