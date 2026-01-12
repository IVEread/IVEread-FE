import { request } from '@/services/api-client';
import { clearUserId, setUserId } from '@/services/session';
import { CreateUserInput, LoginInput, User } from '@/types/user';

export async function login(payload: LoginInput): Promise<User> {
  const user = await request<User>('/api/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  });
  await setUserId(user.id);
  return user;
}

export async function signup(payload: CreateUserInput): Promise<User> {
  const user = await request<User>('/api/auth/signup', {
    method: 'POST',
    body: payload,
    auth: false,
  });
  await setUserId(user.id);
  return user;
}

export async function logout(): Promise<void> {
  await request<null>('/api/auth/logout', {
    method: 'POST',
    auth: false,
  });
  await clearUserId();
}
