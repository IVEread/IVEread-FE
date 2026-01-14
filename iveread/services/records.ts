import { request } from '@/services/api-client';
import { CreateRecordCommentInput, RecordComment } from '@/types/record-comment';
import {
  CreateRecordReactionInput,
  RecordReaction,
  UpdateRecordReactionInput,
} from '@/types/record-reaction';
import { CreateRecordInput, ReadingRecord, UpdateRecordInput } from '@/types/record';

export type RecordQuery = {
  year?: number;
  month?: number;
  userId?: string;
};

const buildRecordQuery = (query?: RecordQuery) => {
  if (!query) return undefined;
  const { year, month, userId } = query;
  if ((year === undefined) !== (month === undefined)) {
    throw new Error('Both year and month are required when filtering by date.');
  }
  return {
    year,
    month,
    userId,
  };
};

export async function getGroupRecords(groupId: string, query?: RecordQuery): Promise<ReadingRecord[]> {
  return request<ReadingRecord[]>(`/api/groups/${encodeURIComponent(groupId)}/records`, {
    query: buildRecordQuery(query),
  });
}

export async function getUserRecords(userId: string, query?: RecordQuery): Promise<ReadingRecord[]> {
  return request<ReadingRecord[]>(`/api/users/${encodeURIComponent(userId)}/records`, {
    query: buildRecordQuery(query),
  });
}

export async function createRecord(groupId: string, payload: CreateRecordInput): Promise<ReadingRecord> {
  return request<ReadingRecord>(`/api/groups/${encodeURIComponent(groupId)}/records`, {
    method: 'POST',
    body: payload,
  });
}

export async function getRecord(recordId: string): Promise<ReadingRecord> {
  return request<ReadingRecord>(`/api/records/${encodeURIComponent(recordId)}`);
}

export async function updateRecord(recordId: string, payload: UpdateRecordInput): Promise<ReadingRecord> {
  return request<ReadingRecord>(`/api/records/${encodeURIComponent(recordId)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteRecord(recordId: string): Promise<void> {
  await request<null>(`/api/records/${encodeURIComponent(recordId)}`, {
    method: 'DELETE',
  });
}

export async function getRecordComments(recordId: string): Promise<RecordComment[]> {
  return request<RecordComment[]>(`/api/records/${encodeURIComponent(recordId)}/comments`);
}

export async function createRecordComment(
  recordId: string,
  payload: CreateRecordCommentInput
): Promise<RecordComment> {
  return request<RecordComment>(`/api/records/${encodeURIComponent(recordId)}/comments`, {
    method: 'POST',
    body: payload,
  });
}

export async function getRecordReactions(recordId: string): Promise<RecordReaction[]> {
  return request<RecordReaction[]>(`/api/records/${encodeURIComponent(recordId)}/reactions`);
}

export async function createRecordReaction(
  recordId: string,
  payload: CreateRecordReactionInput
): Promise<RecordReaction> {
  return request<RecordReaction>(`/api/records/${encodeURIComponent(recordId)}/reactions`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateRecordReaction(
  reactionId: string,
  payload: UpdateRecordReactionInput
): Promise<RecordReaction> {
  return request<RecordReaction>(`/api/record-reactions/${encodeURIComponent(reactionId)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteRecordReaction(reactionId: string): Promise<void> {
  await request<null>(`/api/record-reactions/${encodeURIComponent(reactionId)}`, {
    method: 'DELETE',
  });
}

export async function toggleRecordLike(
  recordId: string
): Promise<{ liked: boolean; likeCount: number }> {
  return request<{ liked: boolean; likeCount: number }>(
    `/api/records/${encodeURIComponent(recordId)}/likes`,
    {
      method: 'POST',
    },
  );
}

export async function getRecordLikeCount(recordId: string): Promise<{ likeCount: number }> {
  return request<{ likeCount: number }>(`/api/records/${encodeURIComponent(recordId)}/likes`);
}
