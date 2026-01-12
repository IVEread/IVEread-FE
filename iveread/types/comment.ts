export type CreateSentenceCommentInput = {
  content: string;
};

export type UpdateSentenceCommentInput = {
  content?: string;
};

export type SentenceComment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userNickname: string;
  userProfileEmoji: string | null;
  sentenceId: string;
};
