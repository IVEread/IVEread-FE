export type CreateCalendarRecordInput = {
  groupId: string;
  readDate: string;
  note: string;
};

export type CalendarRecord = {
  id: string;
  readDate: string;
  note: string | null;
  createdAt: string;
  userId: string;
  userNickname: string;
  userProfileEmoji: string | null;
  groupId: string;
  bookIsbn: string;
  bookTitle: string;
  bookCoverImage: string;
};
