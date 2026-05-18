import Link from 'next/link'
import { Book, Chapter } from '@/types'

interface NavigationProps {
  book: Book
  currentChapter: Chapter
  previousChapter?: Chapter | null
  nextChapter?: Chapter | null
}

export default function Navigation({
  book,
  currentChapter,
}: NavigationProps) {
  const textSizeClass = book.language === 'en' ? 'text-sm' : 'text-xs'
  const visibleChapters = book.chapters
    .filter(ch => !ch.hidden)
    .sort((a, b) => a.order - b.order)

  // Get the first chapter to link to
  const firstChapter = visibleChapters[0]

  return (
    <div className="space-y-4">
      {/* Book Title */}
      <div className="px-2">
        <Link
          href={firstChapter ? `/${book.id}/${firstChapter.id}` : '/'}
          className={`${textSizeClass} font-semibold text-foreground hover:text-primary transition-colors`}
        >
          {book.title}
        </Link>
      </div>

      {/* Chapter List */}
      <nav>
        <ul>
          {visibleChapters.map((chapter) => {
            const isCurrent = chapter.id === currentChapter.id

            return (
              <li key={chapter.id}>
                <Link
                  href={`/${book.id}/${chapter.id}`}
                  className={`
                    block px-2 py-1 ${textSizeClass} rounded-sm transition-colors
                    ${
                      isCurrent
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {chapter.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
