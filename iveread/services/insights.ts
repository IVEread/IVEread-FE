import { request } from '@/services/api-client';
import type { InsightsResponse } from '@/types/insights';

type InsightsAISummaryPayload = {
  summary: string;
};

export async function fetchInsights(): Promise<InsightsResponse> {
  return request<InsightsResponse>('/api/insights');
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
  const payload = await request<string | InsightsAISummaryPayload>('/api/insights/ai-summary', {
    method: 'POST',
    body: insights,
    query: options?.refresh ? { refresh: true } : undefined,
  });
  return normalizeInsightsSummary(payload);
}

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
