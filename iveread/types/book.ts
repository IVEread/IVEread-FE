export type Book = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverImage: string;
  totalPage: number | null;
};

export type BookSearchResponse = {
  totalResults: number;
  items: Book[];
};
