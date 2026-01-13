export type GroupBookInput = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverImage: string;
  totalPage: number;
};

export type CreateGroupInput = {
  name: string;
  startDate: string;
  goalDate: string | null;
  book: GroupBookInput;
};

export type UpdateGroupInput = {
  name?: string;
  goalDate?: string;
};

export type Group = {
  id: string;
  name: string;
  startDate: string;
  goalDate: string | null;
  bookIsbn: string;
  bookTitle: string;
  bookCover: string;
  memberCount: number;
  createdAt: string;
};
