import { request } from '@/services/api-client';
import { CreateSentenceCommentInput, SentenceComment, UpdateSentenceCommentInput } from '@/types/comment';
import { CreateSentenceInput, Sentence, UpdateSentenceInput } from '@/types/sentence';

export async function getGroupSentences(groupId: string): Promise<Sentence[]> {
  return request<Sentence[]>(`/api/groups/${encodeURIComponent(groupId)}/sentences`);
}

export async function createSentence(groupId: string, payload: CreateSentenceInput): Promise<Sentence> {
  return request<Sentence>(`/api/groups/${encodeURIComponent(groupId)}/sentences`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateSentence(sentenceId: string, payload: UpdateSentenceInput): Promise<Sentence> {
  return request<Sentence>(`/api/sentences/${encodeURIComponent(sentenceId)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteSentence(sentenceId: string): Promise<void> {
  await request<null>(`/api/sentences/${encodeURIComponent(sentenceId)}`, {
    method: 'DELETE',
  });
}

export async function getSentenceComments(sentenceId: string): Promise<SentenceComment[]> {
  return request<SentenceComment[]>(`/api/sentences/${encodeURIComponent(sentenceId)}/comments`);
}

export async function createSentenceComment(
  sentenceId: string,
  payload: CreateSentenceCommentInput
): Promise<SentenceComment> {
  return request<SentenceComment>(`/api/sentences/${encodeURIComponent(sentenceId)}/comments`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateSentenceComment(
  commentId: string,
  payload: UpdateSentenceCommentInput
): Promise<SentenceComment> {
  return request<SentenceComment>(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteSentenceComment(commentId: string): Promise<void> {
  await request<null>(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}
