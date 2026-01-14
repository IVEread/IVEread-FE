import { request } from '@/services/api-client';
import type { CalendarRecord, CreateCalendarRecordInput } from '@/types/calendar-record';
import type {
  CalendarRecordReaction,
  CreateCalendarRecordReactionInput,
  UpdateCalendarRecordReactionInput,
} from '@/types/calendar-record-reaction';

export type CalendarRecordQuery = {
  year?: number;
  month?: number;
};

const buildCalendarQuery = (query?: CalendarRecordQuery) => {
  if (!query) return undefined;
  const { year, month } = query;
  if ((year === undefined) !== (month === undefined)) {
    throw new Error('Both year and month are required when filtering by date.');
  }
  return {
    year,
    month,
  };
};

export async function getCalendarRecords(
  userId: string,
  query?: CalendarRecordQuery
): Promise<CalendarRecord[]> {
  return request<CalendarRecord[]>(`/api/users/${encodeURIComponent(userId)}/calendar-records`, {
    query: buildCalendarQuery(query),
  });
}

export async function createCalendarRecord(
  payload: CreateCalendarRecordInput
): Promise<CalendarRecord> {
  return request<CalendarRecord>('/api/calendar-records', {
    method: 'POST',
    body: payload,
  });
}

export async function getCalendarRecordReactions(
  recordId: string
): Promise<CalendarRecordReaction[]> {
  return request<CalendarRecordReaction[]>(
    `/api/calendar-records/${encodeURIComponent(recordId)}/reactions`
  );
}

export async function createCalendarRecordReaction(
  recordId: string,
  payload: CreateCalendarRecordReactionInput
): Promise<CalendarRecordReaction> {
  return request<CalendarRecordReaction>(
    `/api/calendar-records/${encodeURIComponent(recordId)}/reactions`,
    {
      method: 'POST',
      body: payload,
    },
  );
}

export async function updateCalendarRecordReaction(
  reactionId: string,
  payload: UpdateCalendarRecordReactionInput
): Promise<CalendarRecordReaction> {
  return request<CalendarRecordReaction>(
    `/api/calendar-record-reactions/${encodeURIComponent(reactionId)}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function deleteCalendarRecordReaction(reactionId: string): Promise<void> {
  await request<null>(`/api/calendar-record-reactions/${encodeURIComponent(reactionId)}`, {
    method: 'DELETE',
  });
}
