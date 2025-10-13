# Next.js Markdown Book Renderer - Project Plan

## Project Overview
Build a simple Next.js web application that renders markdown files from book repositories stored in separate folders. The application will support mathematical expressions using KaTeX and display a table of contents (TOC) sidebar.

## Project Goals
- Render markdown content from multiple book repositories
- Support mathematical notation with KaTeX
- Provide easy navigation with a TOC sidebar
- Clean and readable interface for technical books

## Current Environment Analysis

### Existing Book Structure
Example book repository structure:
```
book-repository/
├── README.md
├── book.css
├── chapters/
│   ├── 01-about.md
│   ├── 02-foreward.md
│   ├── 03-toc.md
│   ├── 04-ch1.md
│   ├── 05-ch2.md
│   └── ... (more chapters)
└── scripts/
```

### Markdown Content Characteristics
- Contains LaTeX math expressions (inline `$...$` and block `$$...$$`)
- Uses HTML elements (e.g., `<div class="figure">`)
- Includes heading hierarchy (##, ###) suitable for TOC extraction
- Contains image references
- Some chapters have CSS links at the top

## Technical Stack

### Core Technologies
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown Processing**:
  - `remark` / `remark-parse` (markdown parsing)
  - `remark-math` (math notation support)
  - `rehype-katex` (KaTeX rendering)
  - `react-markdown` or `next-mdx-remote` (React rendering)
- **Math Rendering**: KaTeX
- **File System**: Node.js `fs` module

### Additional Libraries
- `gray-matter` (frontmatter parsing, if needed)
- `katex` (peer dependency for rehype-katex)
- `remark-gfm` (GitHub Flavored Markdown)
- `rehype-raw` (to support HTML in markdown)

## Architecture Design

### Directory Structure
```
nextjs-book-reader/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (book selection)
│   ├── [bookId]/
│   │   └── [chapterId]/
│   │       └── page.tsx (chapter viewer)
│   └── api/
│       └── books/
│           └── route.ts (optional API routes)
├── components/
│   ├── BookList.tsx
│   ├── ChapterContent.tsx
│   ├── TableOfContents.tsx
│   ├── Sidebar.tsx
│   └── Navigation.tsx
├── lib/
│   ├── markdown.ts (markdown processing utilities)
│   ├── books.ts (book/chapter loading logic)
│   └── toc.ts (TOC extraction)
├── types/
│   └── index.ts
├── config/
│   └── books.config.ts (book paths configuration)
└── public/
    └── ... (static assets)
```

### Data Flow
1. Configure book repository paths in `config/books.config.ts`
2. Load available books and chapters at build time or request time
3. Read markdown files from filesystem
4. Parse markdown and extract headings for TOC
5. Render markdown with math support
6. Display content with TOC sidebar

## Implementation Plan

### Phase 1: Project Setup
**Tasks:**
- [ ] Initialize Next.js project with TypeScript
- [ ] Install required dependencies (remark, rehype, KaTeX, etc.)
- [ ] Set up Tailwind CSS
- [ ] Create basic directory structure
- [ ] Configure TypeScript and linting

**Commands:**
```bash
npx create-next-app@latest nextjs-book-reader --typescript --tailwind --app
cd nextjs-book-reader
npm install remark remark-parse remark-math remark-gfm
npm install rehype rehype-katex rehype-raw
npm install katex
npm install gray-matter
npm install unist-util-visit
npm install @types/katex --save-dev
```

### Phase 2: Book Configuration System
**Tasks:**
- [ ] Create `config/books.config.ts` with book repository paths
- [ ] Define TypeScript types for Book, Chapter, Metadata structures
- [ ] Create `book.json` metadata file format specification
- [ ] Implement metadata loader in `lib/books.ts`
- [ ] Create functions to list all books and chapters from metadata
- [ ] Handle relative/absolute paths to book repositories
- [ ] Add validation for book.json schema

**Book Metadata Format (`book.json`):**
Each book repository should contain a `book.json` file in its root:

```json
{
  "id": "example-book",
  "title": "Example Book Title",
  "subtitle": "Optional Subtitle",
  "author": "Author Name",
  "publisher": "Publisher Name",
  "year": "2024",
  "description": "Brief description of the book",
  "language": "en",
  "chapters": [
    {
      "id": "about",
      "title": "About",
      "file": "chapters/01-about.md",
      "order": 1
    },
    {
      "id": "foreward",
      "title": "Foreword",
      "file": "chapters/02-foreward.md",
      "order": 2
    },
    {
      "id": "toc",
      "title": "Table of Contents",
      "file": "chapters/03-toc.md",
      "order": 3
    },
    {
      "id": "ch1",
      "title": "Chapter 1: Introduction",
      "file": "chapters/04-ch1.md",
      "order": 4
    },
    {
      "id": "ch2",
      "title": "Chapter 2: Getting Started",
      "file": "chapters/05-ch2.md",
      "order": 5
    }
  ]
}
```

**Application Configuration (`config/books.config.ts`):**
```typescript
// Simple list of book repository paths
export const BOOKS_CONFIG = [
  '~/path/to/your-book-repository',
  '~/path/to/another-book',
  // Add more book paths...
]

// Or with aliases
export const BOOKS_CONFIG = {
  'book-id': '~/path/to/your-book-repository',
  'another-book': '~/path/to/another-book'
}
```

### Phase 3: Markdown Processing Pipeline
**Tasks:**
- [ ] Create markdown processor in `lib/markdown.ts`
- [ ] Configure remark/rehype plugins for math support
- [ ] Handle HTML elements in markdown (rehype-raw)
- [ ] Create custom remark plugin for Japanese full-width space indentation
- [ ] Implement TOC extraction from heading nodes
- [ ] Add frontmatter support for chapter metadata
- [ ] Test with sample chapters containing math

**Key Functions:**
```typescript
// lib/markdown.ts
async function processMarkdown(content: string)
function extractTableOfContents(content: string)
function generateSlugFromHeading(text: string)

// lib/remark-japanese-indent.ts
export function remarkJapaneseIndent() {
  // Custom plugin to detect paragraphs starting with　(U+3000)
  // Adds 'indent-ja' class or data attribute to paragraph nodes
}
```

**Plugin Pipeline:**
```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { remarkJapaneseIndent } from './remark-japanese-indent'

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkGfm)
  .use(remarkJapaneseIndent) // Custom plugin for Japanese indent
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeKatex)
  .use(rehypeStringify)
```

### Phase 4: Core Components
**Tasks:**
- [ ] Build `BookList.tsx` - displays available books
- [ ] Build `ChapterContent.tsx` - renders markdown content
- [ ] Build `TableOfContents.tsx` - interactive TOC with scroll sync
- [ ] Build `Sidebar.tsx` - fixed sidebar for TOC
- [ ] Build `Navigation.tsx` - book/chapter navigation
- [ ] Add KaTeX CSS imports
- [ ] Style components with Tailwind

**Component Features:**
- **TableOfContents**:
  - Hierarchical display (h2, h3, h4)
  - Active section highlighting
  - Smooth scroll to sections
  - Sticky positioning
- **ChapterContent**:
  - Proper math rendering
  - Code syntax highlighting (optional)
  - Responsive layout

### Phase 5: Routing and Pages
**Tasks:**
- [ ] Create home page (`app/page.tsx`) - book selection
- [ ] Create dynamic route `app/[bookId]/[chapterId]/page.tsx`
- [ ] Implement static generation (generateStaticParams)
- [ ] Add previous/next chapter navigation
- [ ] Handle 404 for missing books/chapters
- [ ] Add loading states

**Route Structure:**
- `/` - List of all books
- `/[bookId]/[chapterId]` - Chapter viewer with TOC sidebar

### Phase 6: Styling and Layout
**Tasks:**
- [ ] Design responsive layout (mobile-friendly)
- [ ] Style markdown content for readability
  - Typography (font sizes, line height, spacing)
  - Code blocks
  - Math expressions
  - Images and figures
  - Japanese text rendering (proper line breaks, spacing)
- [ ] Implement Japanese full-width space (　) indentation
- [ ] Implement TOC sidebar (fixed position on desktop, collapsible on mobile)
- [ ] Add dark mode support (optional)
- [ ] Ensure KaTeX renders correctly

**Japanese Text Indentation:**
Paragraphs starting with full-width space (　, U+3000) should render with text-indent:

```css
/* Apply to paragraph elements that start with full-width space */
p:has(> :first-child:is(:text-node):starts-with("\u3000")) {
  text-indent: 1em;
}

/* Alternative: Use a remark plugin to add a class */
.indent-ja {
  text-indent: 1em;
}
```

Create a custom remark plugin to detect and handle full-width space indentation:
```typescript
// lib/remark-japanese-indent.ts
// Detects paragraphs starting with　(U+3000) and adds 'indent-ja' class
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Header/Navigation                               │
├──────────────────────────┬──────────────────────┤
│                          │ TOC Sidebar          │
│ Chapter Content          │ - Section 1          │
│ (Markdown + Math)        │   - Subsection 1.1   │
│                          │   - Subsection 1.2   │
│                          │ - Section 2          │
│                          │ ...                  │
└──────────────────────────┴──────────────────────┘
```

### Phase 7: Testing and Refinement
**Tasks:**
- [ ] Test with all chapters from sample book
- [ ] Verify math rendering (inline and display)
- [ ] Test TOC generation and navigation
- [ ] Test with multiple books
- [ ] Verify responsive design on different screen sizes
- [ ] Performance optimization (memoization, code splitting)
- [ ] Add error boundaries

### Phase 8: Documentation and Deployment
**Tasks:**
- [ ] Write README with setup instructions
- [ ] Document book configuration process
- [ ] Add instructions for adding new books
- [ ] Create helper script to generate `book.json` from existing books
- [ ] Choose deployment platform (Vercel, Netlify, etc.)
- [ ] Configure build process
- [ ] Deploy application

**Helper Script (`scripts/generate-book-json.js`):**
Create a Node.js script to automatically generate `book.json` by scanning a book directory:

```javascript
// Usage: node scripts/generate-book-json.js ~/path/to/your-book-repository
// Scans directory, finds markdown files, and generates book.json template
```

## Configuration Management

### Adding New Books

**Step 1: Create `book.json` in the book repository**
Create a `book.json` file in the root of your book repository:

```bash
cd ~/Developer/my-new-book
touch book.json
```

**Step 2: Define book metadata**
Edit `book.json` with your book's information:

```json
{
  "id": "my-new-book",
  "title": "My New Book Title",
  "subtitle": "Optional Subtitle",
  "author": "Author Name",
  "publisher": "Publisher Name",
  "year": "2024",
  "description": "Brief description of the book",
  "language": "en",
  "chapters": [
    {
      "id": "intro",
      "title": "Introduction",
      "file": "chapters/01-introduction.md",
      "order": 1
    },
    {
      "id": "ch1",
      "title": "Chapter 1: Getting Started",
      "file": "chapters/02-chapter1.md",
      "order": 2
    }
  ]
}
```

**Step 3: Add book path to application config**
Add the repository path to `config/books.config.ts`:

```typescript
export const BOOKS_CONFIG = [
  '~/path/to/existing-book',
  '~/path/to/my-new-book',  // Add new book path
]
```

**Step 4: Restart development server**
The new book will be automatically discovered and loaded.

### Metadata Schema

**Required Fields:**
- `id` (string): Unique identifier for the book
- `title` (string): Book title
- `chapters` (array): List of chapter objects

**Optional Fields:**
- `subtitle` (string): Book subtitle
- `author` (string): Author name(s)
- `publisher` (string): Publisher name
- `year` (string): Publication year
- `description` (string): Book description
- `language` (string): Language code (e.g., "en", "ja")
- `cover` (string): Path to cover image

**Chapter Object:**
- `id` (string): Unique chapter identifier
- `title` (string): Chapter title (displayed in navigation)
- `file` (string): Relative path to markdown file from book root
- `order` (number): Display order
- `description` (string, optional): Chapter description
- `hidden` (boolean, optional): Hide from navigation

### Benefits of JSON Metadata Approach

1. **Explicit Control**: Define exact chapter titles without parsing filenames
2. **Flexible Organization**: File naming doesn't dictate display order
3. **Rich Metadata**: Store additional info (author, language, descriptions)
4. **Easy Maintenance**: Update chapter titles without renaming files
5. **Internationalization**: Support multiple languages easily
6. **Validation**: Can validate JSON schema at build time
7. **Extensibility**: Easy to add new metadata fields later

## Technical Considerations

### Japanese Text Formatting

**Full-Width Space Indentation:**
Japanese books traditionally use full-width space (　, U+3000) at the beginning of paragraphs for indentation. The application should detect and render this properly.

**Implementation Approach:**

1. **Remark Plugin** (`lib/remark-japanese-indent.ts`):
```typescript
import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'

export const remarkJapaneseIndent: Plugin = () => {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      // Check if first child is text node starting with
      if (node.children?.[0]?.type === 'text') {
        const text = node.children[0].value
        if (text.startsWith('\u3000')) {
          // Remove the full-width space from text
          node.children[0].value = text.substring(1)
          // Add data attribute to mark for indentation
          node.data = node.data || {}
          node.data.hProperties = { className: ['indent-ja'] }
        }
      }
    })
  }
}
```

2. **CSS Styling**:
```css
/* globals.css or component styles */
.indent-ja {
  text-indent: 1em;
}

/* For Japanese text, use OS default fonts and proper typography */
.markdown-content[lang="ja"] {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.8;
  letter-spacing: 0.02em;
}
```

3. **Alternative Approach** (without removing the space):
```typescript
// Keep the　character but style it to collapse
export const remarkJapaneseIndent: Plugin = () => {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      if (node.children?.[0]?.type === 'text') {
        const text = node.children[0].value
        if (text.startsWith('\u3000')) {
          node.data = node.data || {}
          node.data.hProperties = {
            className: ['indent-ja'],
            'data-indent': 'true'
          }
        }
      }
    })
  }
}
```

```css
.indent-ja {
  text-indent: 1em;
}

/* Hide the leading full-width space */
.indent-ja::first-letter {
  font-size: 0;
  width: 0;
}
```

### Math Rendering with KaTeX
- Include KaTeX CSS in layout
- Configure `remark-math` and `rehype-katex`
- Handle both inline (`$...$`) and display (`$$...$$`) math
- Consider math rendering performance for long documents

### TOC Generation
- Extract headings during markdown processing
- Generate slugs for heading IDs (for anchor links)
- Support nested heading levels (h2, h3, h4)
- Implement scroll spy for active section tracking

### File System Access
- Use `fs.readFileSync` or `fs.promises.readFile` in server components
- Expand `~` to actual home directory path
- Handle missing files gracefully
- Consider caching for performance

### Performance
- Use Next.js static generation (SSG) when possible
- Implement incremental static regeneration (ISR) if needed
- Lazy load TOC component on client side
- Optimize large markdown files

### HTML in Markdown
- Use `rehype-raw` to support HTML elements in markdown
- Sanitize HTML if accepting user-generated content (not applicable here)
- Preserve custom CSS classes from source markdown

## Future Enhancements
- Full-text search across books
- Bookmarks and reading progress
- Export to PDF
- Collaborative annotations
- Multi-language support
- Image zoom functionality
- Code block copy button
- Dark mode toggle

## Success Criteria
- ✓ Successfully renders markdown from configured book repositories
- ✓ Math expressions display correctly using KaTeX
- ✓ TOC sidebar shows hierarchical structure and enables navigation
- ✓ Responsive design works on desktop and mobile
- ✓ Easy to add new books via configuration
- ✓ Fast page loads and smooth navigation

## Timeline Estimate
- **Phase 1**: 1-2 hours
- **Phase 2**: 2-3 hours
- **Phase 3**: 3-4 hours
- **Phase 4**: 4-6 hours
- **Phase 5**: 2-3 hours
- **Phase 6**: 3-4 hours
- **Phase 7**: 2-3 hours
- **Phase 8**: 1-2 hours

**Total**: ~18-27 hours

## Next Steps
1. Review and approve this plan
2. Initialize Next.js project
3. Begin Phase 1 implementation
4. Iterate based on testing and feedback
