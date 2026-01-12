import { request } from '@/services/api-client';
import { Book, BookSearchResponse } from '@/types/book';

export async function getBookByIsbn(bookId: string): Promise<Book> {
  return request<Book>(`/api/books/${encodeURIComponent(bookId)}`);
}

export async function searchBooks(query: string, page?: number, size?: number): Promise<BookSearchResponse> {
  return request<BookSearchResponse>('/api/books/search', {
    query: {
      query,
      page,
      size,
    },
  });
}
