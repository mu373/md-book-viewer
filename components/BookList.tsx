import Link from 'next/link'
import { Book } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BookListProps {
  books: Book[]
}

export default function BookList({ books }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No books found. Please add book paths to{' '}
          <code className="bg-muted px-2 py-1 rounded text-xs">
            config/books.config.ts
          </code>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Publisher</TableHead>
            <TableHead className="text-right">Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id} className="cursor-pointer">
              <TableCell>
                <Link
                  href={`/${book.id}/${book.chapters[0]?.id || ''}`}
                  className="block"
                >
                  <div className="font-semibold hover:text-primary transition-colors">
                    {book.title}
                  </div>
                  {book.subtitle && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {book.subtitle}
                    </div>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/${book.id}/${book.chapters[0]?.id || ''}`}
                  className="block"
                >
                  {book.author || '—'}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/${book.id}/${book.chapters[0]?.id || ''}`}
                  className="block"
                >
                  {book.publisher || '—'}
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/${book.id}/${book.chapters[0]?.id || ''}`}
                  className="block"
                >
                  {book.year || '—'}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
