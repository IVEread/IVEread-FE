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
  goalDate: string;
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
  bookTitle: string;
  bookCover: string;
  memberCount: number;
  createdAt: string;
};
