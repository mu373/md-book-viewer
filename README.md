# md-book-viewer

A modern Next.js application for reading books in markdown format with full mathematical notation support using KaTeX.

## Features

- **Multiple Book Support**: Configure multiple book repositories
- **Markdown Rendering**: Full GitHub Flavored Markdown support
- **Math Rendering**: LaTeX math expressions with KaTeX
- **Interactive TOC**: Auto-generated table of contents with scroll sync
- **Responsive Design**: Works on desktop and mobile devices
- **Japanese Text Support**: Proper typography and full-width space indentation
- **Static Generation**: Fast page loads with Next.js SSG
- **Dark Mode**: Automatic dark mode support
- **Full-Text Search**: Algolia-powered search with Japanese language support

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (install with `npm install -g pnpm`)

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd book-viewer
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure your books (see [Configuration](#configuration) below)

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

The build process automatically copies images from book repositories to the output directory.

```bash
pnpm build
```

The build process:
1. Generates static HTML for all chapters
2. Copies images from each book's `images/` directory to `out/{bookId}/images/`
3. Maintains relative paths so `../images/` references work correctly

## Configuration

### Setting up books.config.ts

1. Copy the example configuration file:
```bash
cp config/books.config.ts.example config/books.config.ts
```

2. Edit `config/books.config.ts` to add paths to your book repositories:

```typescript
export const BOOKS_CONFIG: string[] = [
  './books/mybook',              // Relative path (recommended for books in project)
  '~/Documents/another-book',    // Home directory path
  '/absolute/path/to/book',      // Absolute path
]
```

**Supported path formats:**
- **Relative paths**: `./books/mybook` - relative to project root (recommended for books stored in the project)
- **Home directory**: `~/Books/mybook` - uses your home directory (expanded automatically)
- **Absolute paths**: `/var/books/mybook` - full system path

**Note**: `config/books.config.ts` is in `.gitignore` to keep your local book paths private.

### Book Metadata Format

Each book repository must contain a `book.json` file in its root directory:

```json
{
  "id": "unique-book-id",
  "title": "Book Title",
  "subtitle": "Optional Subtitle",
  "author": "Author Name",
  "publisher": "Publisher Name",
  "year": "2024",
  "description": "Brief description of the book",
  "language": "en",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Chapter 1: Introduction",
      "file": "chapters/01-introduction.md",
      "order": 1
    }
  ]
}
```

#### Required Fields

- `id` (string): Unique identifier for the book
- `title` (string): Book title
- `chapters` (array): List of chapter objects

#### Optional Fields

- `subtitle` (string): Book subtitle
- `author` (string): Author name(s)
- `publisher` (string): Publisher name
- `year` (string): Publication year
- `description` (string): Book description
- `language` (string): Language code (e.g., "en", "ja")
- `cover` (string): Path to cover image

#### Chapter Object

- `id` (string): Unique chapter identifier
- `title` (string): Chapter title
- `file` (string): Relative path to markdown file from book root
- `order` (number): Display order
- `description` (string, optional): Chapter description
- `hidden` (boolean, optional): Hide from navigation

### Book Repository Structure

Each book repository should follow this structure:

```
book-repository/
├── book.json           # Book metadata (required)
├── chapters/           # Markdown files (required)
│   ├── 01-intro.md
│   ├── 02-chapter2.md
│   └── ...
└── images/            # Images referenced in markdown (optional)
    ├── fig-1.png
    └── ...
```

**Images**: Store images in an `images/` directory at the book root. Reference them in markdown with relative paths:

```markdown
![Description](../images/fig-1.png)
```

During build, images are automatically copied to the output directory maintaining the relative path structure, so `../images/` references work correctly from chapter pages.

## Project Structure

```
md-book-viewer/
├── app/                          # Next.js app directory
│   ├── [bookId]/
│   │   └── [chapterId]/
│   │       └── page.tsx         # Chapter viewer page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (book list)
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── BookList.tsx             # Book listing component
│   ├── ChapterContent.tsx       # Markdown content renderer
│   ├── Navigation.tsx           # Chapter navigation
│   ├── Sidebar.tsx              # Sidebar with TOC
│   └── TableOfContents.tsx      # Interactive TOC
├── lib/                         # Utility libraries
│   ├── books.ts                 # Book/chapter loading logic
│   ├── markdown.ts              # Markdown processing
│   ├── toc.ts                   # TOC extraction
│   └── remark-japanese-indent.ts # Japanese text plugin
├── types/                       # TypeScript types
│   └── index.ts                 # Type definitions
├── config/                      # Configuration
│   └── books.config.ts          # Book paths configuration
├── scripts/                     # Build and utility scripts
│   ├── copy-book-images.js      # Copies images from books to output
│   └── generate-book-json.js    # Generates book.json template
└── out/                         # Static build output (after build)
    └── [bookId]/
        ├── images/              # Copied from book repo
        └── [chapterId]/         # Chapter pages
```

## Markdown Features

### Math Support

Inline math: `$E = mc^2$`

Display math:
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### GitHub Flavored Markdown

- Tables
- Task lists
- Strikethrough
- Autolinks

### HTML Support

Raw HTML elements are supported in markdown files.

### Japanese Text

Japanese text is properly formatted with:
- Appropriate font families
- Letter spacing for readability
- Full-width space (　) indentation support

## Development

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
npx tsc --noEmit
```


### Building for Static Deployment

This application is configured for **static export** - all pages are pre-rendered as HTML files at build time. The `out/` directory contains fully static files that can be deployed anywhere:

```bash
pnpm build
# Deploy out/ directory to your hosting
```

### Testing the Static Build Locally

After building, you can test the static export locally using the same bun+hono server that runs in production:

```bash
# Serve on default port (3000)
pnpm serve

# Serve on a custom port
PORT=3010 pnpm serve
```

This runs [server.ts](server.ts) with Bun, providing the same caching behavior and routing as the Docker deployment.

## Docker Deployment

The application includes Docker support with a multi-stage build that uses **bun + hono** for efficient static file serving.

### Building and Running with Docker

1. **Ensure books are available**: Docker `COPY` doesn't follow symlinks, so you must have actual book files in the `books/` directory (not just symlinks).

2. **Start with Docker Compose** (recommended):
```bash
docker compose up -d
```

This will build the image and start the container in detached mode.

3. **View logs**:
```bash
docker compose logs -f
```

4. **Stop the container**:
```bash
docker compose down
```

5. **Access the application**: Open [http://localhost:3000](http://localhost:3000)

### Docker Build Process

The [Dockerfile](Dockerfile) implements a two-stage build:

1. **Build stage** ([Dockerfile:8-30](Dockerfile#L8-L30)):
   - Installs dependencies with pnpm
   - Validates that `books/` directory exists with actual content
   - Runs `pnpm build` to generate static files in `out/`

2. **Production stage** ([Dockerfile:33-49](Dockerfile#L33-L49)):
   - Uses lightweight Bun runtime
   - Copies only the `out/` directory and server files
   - Runs [server.ts](server.ts) with Bun for optimized static serving

## Search Setup (Algolia)

The application supports full-text search powered by Algolia.

### Setup

1. Create an [Algolia account](https://dashboard.algolia.com/) (free tier: 10k records, 10k searches/month)

2. Create a new application and index

3. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```bash
# Server-side only (for indexing)
ALGOLIA_APP_ID=your_app_id
ALGOLIA_ADMIN_KEY=your_admin_key
ALGOLIA_INDEX_NAME=md-book-viewer

# Client-side (for search UI)
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_only_key
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=md-book-viewer
```

4. Run the indexing script to push content to Algolia:
```bash
pnpm index
```

This will:
- Read all books from `BOOKS_CONFIG`
- Extract text content from markdown files
- Split content into searchable chunks by headings
- Configure the index for Japanese language (`indexLanguages: ['ja']`)
- Upload records to Algolia

### Re-indexing

Run `pnpm index` whenever you:
- Add new books or chapters
- Update existing content
- Change the books configuration

### Search Features

- Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) to open search
- Toggle between searching current book or all books
- Results show chapter and section with highlighted matches
- Keyboard navigation with arrow keys and Enter

### Synonyms

You can define synonyms and abbreviations in `config/synonyms.json` to improve search results. The indexing script automatically uploads these to Algolia.

```json
{
  "synonyms": [
    {
      "type": "synonym",
      "synonyms": ["MCMC", "マルコフ連鎖モンテカルロ法", "Markov chain Monte Carlo"]
    },
    {
      "type": "synonym",
      "synonyms": ["GNN", "グラフニューラルネットワーク", "Graph Neural Network"]
    }
  ]
}
```

Searching any term in a synonym group will find results containing any of the other terms.

## Technologies Used

- **Next.js 15** - React framework with App Router and static export
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **KaTeX** - Math rendering
- **Remark/Rehype** - Markdown processing
- **Unified** - Content transformation
- **Bun** - Fast JavaScript runtime for production serving (Docker)
- **Hono** - Lightweight web framework for static file serving (Docker)

## License
MIT License.
