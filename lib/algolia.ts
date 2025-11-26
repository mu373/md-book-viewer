import { algoliasearch, SearchClient } from 'algoliasearch'

export const INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'md-book-viewer'

let searchClient: SearchClient | null = null

function getSearchClient(): SearchClient | null {
  if (searchClient) return searchClient

  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

  if (!appId || !searchKey) {
    return null
  }

  searchClient = algoliasearch(appId, searchKey)
  return searchClient
}

export interface SearchRecord {
  objectID: string
  bookId: string
  bookTitle: string
  chapterId: string
  chapterTitle: string
  chapterOrder: number
  heading?: string
  headingId?: string
  content: string
  url: string
}

export interface SearchResult {
  hits: Array<SearchRecord & {
    _highlightResult?: {
      content?: { value: string }
      heading?: { value: string }
      chapterTitle?: { value: string }
    }
    _snippetResult?: {
      content?: { value: string }
    }
  }>
  nbHits: number
  query: string
}

export async function search(query: string, bookId?: string): Promise<SearchResult> {
  if (!query.trim()) {
    return { hits: [], nbHits: 0, query }
  }

  const client = getSearchClient()
  if (!client) {
    console.warn('Algolia client not configured. Set NEXT_PUBLIC_ALGOLIA_APP_ID and NEXT_PUBLIC_ALGOLIA_SEARCH_KEY.')
    return { hits: [], nbHits: 0, query }
  }

  const result = await client.searchSingleIndex<SearchRecord>({
    indexName: INDEX_NAME,
    searchParams: {
      query,
      filters: bookId ? `bookId:${bookId}` : undefined,
      hitsPerPage: 20,
      restrictSearchableAttributes: ['content'],
      attributesToHighlight: ['content'],
      attributesToSnippet: ['content:60'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    },
  })

  return {
    hits: result.hits as SearchResult['hits'],
    nbHits: result.nbHits || 0,
    query,
  }
}

export function isSearchEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID && process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY)
}
