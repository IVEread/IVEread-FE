export type CreateCalendarRecordReactionInput = {
  emoji: string;
};

export type UpdateCalendarRecordReactionInput = {
  emoji?: string;
};

export type CalendarRecordReaction = {
  id: string;
  emoji: string;
  createdAt: string;
  userId: string;
  userNickname: string;
  userProfileEmoji: string | null;
  calendarRecordId: string;
};
