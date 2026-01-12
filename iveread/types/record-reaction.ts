export type CreateRecordReactionInput = {
  emoji: string;
};

export type UpdateRecordReactionInput = {
  emoji?: string;
};

export type RecordReaction = {
  id: string;
  emoji: string;
  createdAt: string;
  userId: string;
  userNickname: string;
  userProfileEmoji: string | null;
  recordId: string;
};
