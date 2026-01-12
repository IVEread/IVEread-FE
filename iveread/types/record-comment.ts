export type CreateRecordCommentInput = {
  content: string;
};

export type UpdateRecordCommentInput = {
  content?: string;
};

export type RecordComment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userNickname: string;
  userProfileEmoji: string | null;
  recordId: string;
};
