export type CreateRecordInput = {
  readDate: string;
  startPage: number;
  endPage: number;
  comment?: string;
  imageUrl: string;
  bookIsbn: string;
};

export type UpdateRecordInput = {
  startPage?: number;
  endPage?: number;
  comment?: string;
  imageUrl?: string;
};

export type ReadingRecord = {
  id: string;
  readDate: string;
  startPage: number;
  endPage: number;
  comment?: string | null;
  imageUrl: string;
  createdAt: string;
  userId: string;
  userNickname: string;
  userProfileEmoji: string | null;
  bookIsbn: string;
  bookTitle: string;
  bookCoverImage: string;
};
