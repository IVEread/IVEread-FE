import { request } from '@/services/api-client';
import type { UserProfile } from '@/types/user';

export async function getFriends(): Promise<UserProfile[]> {
  return request<UserProfile[]>('/api/friends');
}

export async function addFriendByEmail(email: string): Promise<void> {
  await request<unknown>('/api/friends', {
    method: 'POST',
    body: { email },
  });
}
