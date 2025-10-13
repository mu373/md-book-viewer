import { getAllBooks } from '@/lib/books'
import BookList from '@/components/BookList'

export default function HomePage() {
  const books = getAllBooks()

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Books
          </h1>
        </header>

        <BookList books={books} />
      </div>
    </main>
  )
}
