import { request } from '@/services/api-client';
import { CreateGroupInput, FinishedGroup, Group, UpdateGroupInput } from '@/types/group';

export async function getGroups(): Promise<Group[]> {
  return request<Group[]>('/api/groups');
}

export async function searchGroups(query: string): Promise<Group[]> {
  return request<Group[]>('/api/groups/search', {
    query: { query },
  });
}

export async function getGroup(groupId: string): Promise<Group> {
  return request<Group>(`/api/groups/${encodeURIComponent(groupId)}`);
}

export async function createGroup(payload: CreateGroupInput): Promise<Group> {
  return request<Group>('/api/groups', {
    method: 'POST',
    body: payload,
  });
}

export async function updateGroup(groupId: string, payload: UpdateGroupInput): Promise<Group> {
  return request<Group>(`/api/groups/${encodeURIComponent(groupId)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function joinGroup(groupId: string): Promise<void> {
  await request<null>(`/api/groups/${encodeURIComponent(groupId)}/join`, {
    method: 'POST',
  });
}

export async function leaveGroup(groupId: string): Promise<void> {
  await request<null>(`/api/groups/${encodeURIComponent(groupId)}/leave`, {
    method: 'DELETE',
  });
}

export async function finishGroupRead(groupId: string): Promise<void> {
  await request<null>(`/api/groups/${encodeURIComponent(groupId)}/finish`, {
    method: 'PATCH',
  });
}

export async function getFinishedBooks(): Promise<FinishedGroup[]> {
  return request<FinishedGroup[]>('/api/users/me/finished-books');
}
