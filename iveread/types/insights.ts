export type WeekdayDistribution = {
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
};

export type InsightsResponse = {
  habit: {
    totalReadingDays: number;
    currentStreak: number;
    bestStreak: number;
    weeklyFrequency: number;
    weekdayDistribution: WeekdayDistribution;
  };
  completion: {
    finishedBooks: number;
    activeGroups: number;
    completionRate: number;
    avgFinishDays: number | null;
  };
  activity: {
    totalRecords: number;
    totalSentences: number;
    topBooks: { isbn: string; title: string; recordCount: number }[];
  };
};
