import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import {
  getChapter,
  getChapterContent,
  getNextChapter,
  getPreviousChapter,
  getAllBookChapterPairs,
} from '@/lib/books'
import { processMarkdownSync } from '@/lib/markdown'
import ChapterContent from '@/components/ChapterContent'
import Sidebar from '@/components/Sidebar'
import SearchHighlighter from '@/components/SearchHighlighter'
import BudouXText from '@/components/BudouXText'

interface PageProps {
  params: Promise<{
    bookId: string
    chapterId: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookId, chapterId } = await params
  const result = getChapter(bookId, chapterId)

  if (!result) {
    return {
      title: 'Chapter Not Found',
    }
  }

  const { book, chapter } = result

  return {
    title: `${chapter.title} | ${book.title}`,
    description: `${chapter.title} - ${book.title}`,
  }
}

export default async function ChapterPage({ params }: PageProps) {
  const { bookId, chapterId } = await params
  const result = getChapter(bookId, chapterId)

  if (!result) {
    notFound()
  }

  const { book, chapter } = result

  // Get chapter content and process markdown
  const content = getChapterContent(book, chapter)
  const { html, toc } = processMarkdownSync(content)

  // Get navigation chapters
  const previousChapter = getPreviousChapter(bookId, chapterId)
  const nextChapter = getNextChapter(bookId, chapterId)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar with Navigation and TOC */}
      <Sidebar
        book={book}
        currentChapter={chapter}
        toc={toc}
        previousChapter={previousChapter}
        nextChapter={nextChapter}
      />

      {/* Main Content */}
      <main className="lg:pl-72 xl:pr-60">
        <div className="max-w-3xl mx-auto px-6 py-16 lg:py-8 lg:px-12 overflow-x-hidden">
          {/* Chapter Content */}
          <ChapterContent html={html} language={book.language} />
          <SearchHighlighter />

          {/* Bottom Navigation */}
          <nav className="mt-12 pt-6">
            <div className="flex gap-2">
              {previousChapter && (
                <Link
                  href={`/${bookId}/${previousChapter.id}`}
                  className="flex-1 flex items-center gap-2 p-3 bg-card rounded-md border border-border hover:bg-accent transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground mb-0.5">
                      Previous
                    </div>
                    <div className="text-xs font-medium text-foreground">
                      <BudouXText language={book.language}>{previousChapter.title}</BudouXText>
                    </div>
                  </div>
                </Link>
              )}

              {nextChapter && (
                <Link
                  href={`/${bookId}/${nextChapter.id}`}
                  className={`flex-1 flex items-center gap-2 p-3 bg-card rounded-md border border-border hover:bg-accent transition-colors group ${previousChapter ? 'text-right justify-end' : ''}`}
                >
                  {previousChapter && (
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground mb-0.5">
                        Next
                      </div>
                      <div className="text-xs font-medium text-foreground">
                        <BudouXText language={book.language}>{nextChapter.title}</BudouXText>
                      </div>
                    </div>
                  )}
                  {!previousChapter && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                  )}
                  {!previousChapter && (
                    <div className="min-w-0">
                      <div className="text-[10px] text-muted-foreground mb-0.5">
                        Next
                      </div>
                      <div className="text-xs font-medium text-foreground">
                        <BudouXText language={book.language}>{nextChapter.title}</BudouXText>
                      </div>
                    </div>
                  )}
                  {previousChapter && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                  )}
                </Link>
              )}
            </div>

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mt-4 pb-8">
              <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <li className="flex items-center">
                  <Link
                    href={`/${bookId}/${book.chapters[0]?.id || chapterId}`}
                    className="hover:text-foreground transition-colors"
                  >
                    <BudouXText language={book.language}>{book.title}</BudouXText>
                  </Link>
                </li>
                <li className="flex items-center">
                  <ChevronRight className="w-3 h-3 mx-1" />
                  <span className="text-foreground">
                    <BudouXText language={book.language}>{chapter.title}</BudouXText>
                  </span>
                </li>
              </ol>
            </nav>
          </nav>
        </div>
      </main>
    </div>
  )
}

// Generate static params for all book/chapter combinations
export async function generateStaticParams() {
  const pairs = getAllBookChapterPairs()

  return pairs.map(({ bookId, chapterId }) => ({
    bookId,
    chapterId,
  }))
}
