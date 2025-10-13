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

```bash
pnpm build
pnpm start
```

## Configuration

### Adding Books

Books are configured in [`config/books.config.ts`](config/books.config.ts). Add paths to your book repositories:

```typescript
export const BOOKS_CONFIG: string[] = [
  '~/path/to/your-book-repository',
  '~/path/to/another-book',
  // Add more book paths...
]
```

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
└── public/                      # Static assets
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


### Building

This application is configured for **static export** - all pages are pre-rendered as HTML files at build time. The `out/` directory contains fully static files that can be deployed anywhere:

```bash
pnpm build
# Deploy out/ directory to your hosting
```


## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **KaTeX** - Math rendering
- **Remark/Rehype** - Markdown processing
- **Unified** - Content transformation

## License
MIT License.
