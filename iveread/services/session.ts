import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'session.userId';

let cachedUserId: string | null = null;
let hydrated = false;

async function hydrate() {
  if (hydrated) return;
  cachedUserId = await AsyncStorage.getItem(USER_ID_KEY);
  hydrated = true;
}

export async function bootstrapSession() {
  await hydrate();
}

export async function getUserId(): Promise<string | null> {
  await hydrate();
  return cachedUserId;
}

export async function setUserId(userId: string | null): Promise<void> {
  cachedUserId = userId;
  hydrated = true;
  if (userId) {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  } else {
    await AsyncStorage.removeItem(USER_ID_KEY);
  }
}

export async function clearUserId(): Promise<void> {
  await setUserId(null);
}
