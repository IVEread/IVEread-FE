import { request } from '@/services/api-client';
import { getFinishedBooks, getGroups } from '@/services/groups';
import { getGroupSentences } from '@/services/sentences';
import { getUserId } from '@/services/session';
import type { InsightsResponse, WeekdayDistribution } from '@/types/insights';
import type { ReadingRecord } from '@/types/record';
import type { Sentence } from '@/types/sentence';

type InsightsAISummaryPayload = {
  summary: string;
};

type InsightsSummaryRequest = {
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

export async function fetchInsights(): Promise<InsightsResponse> {
  try {
    return await buildInsightsFromUserData();
  } catch {
    return request<InsightsResponse>('/api/insights');
  }
}

const normalizeInsightsSummary = (payload: string | InsightsAISummaryPayload) => {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object' && 'summary' in payload) {
    return String(payload.summary ?? '');
  }
  return '';
};

export async function fetchInsightsAISummary(
  insights: InsightsResponse,
  options?: { refresh?: boolean },
): Promise<string> {
  const requestPayload: InsightsSummaryRequest = {
    habit: insights.habit,
    completion: insights.completion,
    activity: insights.activity,
  };
  const responsePayload = await request<string | InsightsAISummaryPayload>('/api/insights/ai-summary', {
    method: 'POST',
    body: requestPayload,
    query: options?.refresh ? { refresh: true } : undefined,
    headers: options?.refresh ? { 'x-refresh-ai': 'true' } : undefined,
  });
  return normalizeInsightsSummary(responsePayload);
}

const dateToKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const keyToDate = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const addDaysUTC = (date: Date, days: number): Date => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
};

const buildWeekdayDistribution = (dates: Date[]): WeekdayDistribution => {
  const distribution: WeekdayDistribution = {
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
  };

  for (const date of dates) {
    switch (date.getUTCDay()) {
      case 1:
        distribution.mon += 1;
        break;
      case 2:
        distribution.tue += 1;
        break;
      case 3:
        distribution.wed += 1;
        break;
      case 4:
        distribution.thu += 1;
        break;
      case 5:
        distribution.fri += 1;
        break;
      case 6:
        distribution.sat += 1;
        break;
      case 0:
      default:
        distribution.sun += 1;
        break;
    }
  }

  return distribution;
};

const calculateCurrentStreak = (dateKeys: Set<string>): number => {
  if (dateKeys.size === 0) return 0;

  let streak = 0;
  const now = new Date();
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  while (dateKeys.has(dateToKey(cursor))) {
    streak += 1;
    cursor = addDaysUTC(cursor, -1);
  }

  return streak;
};

const calculateBestStreak = (dateKeys: Set<string>): number => {
  if (dateKeys.size === 0) return 0;

  const sortedKeys = Array.from(dateKeys).sort();
  let best = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const key of sortedKeys) {
    const currentDate = keyToDate(key);

    if (prevDate && dateToKey(addDaysUTC(prevDate, 1)) === key) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > best) best = current;
    prevDate = currentDate;
  }

  return best;
};

const calculateWeeklyFrequency = (dateKeys: Set<string>): number => {
  if (dateKeys.size === 0) return 0;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const cutoff = addDaysUTC(today, -27);
  const cutoffUtc = Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth(), cutoff.getUTCDate());

  let count = 0;

  for (const key of dateKeys) {
    const date = keyToDate(key);
    const dateUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    if (dateUtc >= cutoffUtc) {
      count += 1;
    }
  }

  return count / 4;
};

const parseRecordDate = (value: string): Date | null => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const fetchUserRecords = async (userId: string): Promise<ReadingRecord[]> => {
  return request<ReadingRecord[]>(`/api/users/${encodeURIComponent(userId)}/records`);
};

const fetchUserSentences = async (userId: string, groupIds: string[]): Promise<Sentence[]> => {
  if (groupIds.length === 0) return [];
  const responses = await Promise.all(groupIds.map((groupId) => getGroupSentences(groupId)));
  return responses.flat().filter((sentence) => sentence.userId === userId);
};

const buildInsightsFromUserData = async (): Promise<InsightsResponse> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('Missing user id');
  }

  const [groups, finishedBooks, records] = await Promise.all([
    getGroups(),
    getFinishedBooks(),
    fetchUserRecords(userId),
  ]);

  const groupIds = groups.map((group) => group.id);
  const sentences = await fetchUserSentences(userId, groupIds);

  const recordDates: Date[] = [];
  const uniqueDateKeys = new Set<string>();

  for (const record of records) {
    const parsed = parseRecordDate(record.readDate);
    if (!parsed) continue;
    recordDates.push(parsed);
    uniqueDateKeys.add(dateToKey(parsed));
  }

  const totalReadingDays = uniqueDateKeys.size;
  const currentStreak = calculateCurrentStreak(uniqueDateKeys);
  const bestStreak = calculateBestStreak(uniqueDateKeys);
  const weeklyFrequency = calculateWeeklyFrequency(uniqueDateKeys);
  const weekdayDistribution = buildWeekdayDistribution(recordDates);

  const finishedGroupIds = new Set(finishedBooks.map((item) => item.groupId));
  const activeGroups = groups.filter((group) => !finishedGroupIds.has(group.id)).length;
  const completionRate =
    finishedBooks.length + activeGroups === 0
      ? 0
      : finishedBooks.length / (finishedBooks.length + activeGroups);

  const bookMap = new Map<string, { isbn: string; title: string; recordCount: number }>();
  for (const record of records) {
    const isbn = record.bookIsbn;
    if (!isbn) continue;
    const existing = bookMap.get(isbn);
    if (existing) {
      existing.recordCount += 1;
      if (!existing.title && record.bookTitle) {
        existing.title = record.bookTitle;
      }
      continue;
    }
    bookMap.set(isbn, {
      isbn,
      title: record.bookTitle ?? '',
      recordCount: 1,
    });
  }

  const topBooks = Array.from(bookMap.values())
    .sort((a, b) => b.recordCount - a.recordCount)
    .slice(0, 3);

  return {
    habit: {
      totalReadingDays,
      currentStreak,
      bestStreak,
      weeklyFrequency,
      weekdayDistribution,
    },
    completion: {
      finishedBooks: finishedBooks.length,
      activeGroups,
      completionRate,
      avgFinishDays: null,
    },
    activity: {
      totalRecords: records.length,
      totalSentences: sentences.length,
      topBooks,
    },
  };
};

export const buildInsightsFallbackSummary = (insights: InsightsResponse): string => {
  const completionRatePercent = Math.round(insights.completion.completionRate * 100);

  return [
    `현재 연속 기록은 ${insights.habit.currentStreak}일이고 주간 독서 빈도는 ${insights.habit.weeklyFrequency}일이에요.`,
    `완독한 책은 ${insights.completion.finishedBooks}권이며 완독률은 ${completionRatePercent}%예요.`,
    `지금까지 남긴 기록은 ${insights.activity.totalRecords}개, 문장은 ${insights.activity.totalSentences}개예요.`,
    `이 흐름을 이어가면 독서 리듬이 더 단단해질 거예요.`,
  ].join(' ');
};

export async function fetchInsightsTextExample(): Promise<string[]> {
  const insights = await fetchInsights();

  const topBooksText = insights.activity.topBooks.length
    ? insights.activity.topBooks
        .map((book) => `${book.title || '제목 없음'} (${book.recordCount}회)`)
        .join(', ')
    : '없음';

  return [
    `총 독서일: ${insights.habit.totalReadingDays}일`,
    `현재 연속 기록: ${insights.habit.currentStreak}일`,
    `최고 연속 기록: ${insights.habit.bestStreak}일`,
    `주간 독서 빈도: ${insights.habit.weeklyFrequency}일`,
    `완독한 책: ${insights.completion.finishedBooks}권`,
    `진행 중인 모임: ${insights.completion.activeGroups}개`,
    `완독률: ${Math.round(insights.completion.completionRate * 100)}%`,
    `평균 완독 기간: ${
      insights.completion.avgFinishDays === null
        ? '기록 없음'
        : `${Math.round(insights.completion.avgFinishDays)}일`
    }`,
    `총 기록 수: ${insights.activity.totalRecords}개`,
    `총 문장 수: ${insights.activity.totalSentences}개`,
    `인기 도서: ${topBooksText}`,
  ];
}
