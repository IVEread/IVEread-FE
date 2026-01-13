import { request } from '@/services/api-client';
import type { Friend } from '@/types/friend';

export async function getFriends(): Promise<Friend[]> {
  return request<Friend[]>('/api/friends');
}

const isEmail = (value: string) => value.includes('@');

export async function addFriend(target: string): Promise<void> {
  await request<unknown>('/api/friends', {
    method: 'POST',
    body: isEmail(target)
      ? { email: target, action: 'add' }
      : { targetId: target, action: 'add' },
  });
}

export async function removeFriend(targetId: string): Promise<void> {
  await request<null>('/api/friends', {
    method: 'POST',
    body: { targetId, action: 'remove' },
  });
}
