import { request } from '@/services/api-client';
import { UpdateUserInput, UserProfile } from '@/types/user';

export async function getMe(): Promise<UserProfile> {
  return request<UserProfile>('/api/users/me');
}

export async function updateMe(payload: UpdateUserInput): Promise<UserProfile> {
  return request<UserProfile>('/api/users/me', {
    method: 'PATCH',
    body: payload,
  });
}

export async function getUserById(userId: string): Promise<UserProfile> {
  return request<UserProfile>(`/api/users/${encodeURIComponent(userId)}`);
}
