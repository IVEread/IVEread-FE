export type CreateSentenceInput = {
  content: string;
  pageNo: number;
  thought?: string;
  bookIsbn: string;
};

export type UpdateSentenceInput = {
  content?: string;
  pageNo?: number;
  thought?: string;
};

export type Sentence = {
  id: string;
  content: string;
  pageNo: number;
  thought: string | null;
  createdAt: string;
  userId: string;
  userNickname: string;
  userProfileEmoji: string | null;
  bookIsbn: string;
  bookTitle: string;
  bookCoverImage: string;
};
