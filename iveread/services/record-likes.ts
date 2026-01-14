import AsyncStorage from '@react-native-async-storage/async-storage';

type RecordLikeState = {
  liked: boolean;
  likeCount: number;
};

const LIKE_STATE_PREFIX = 'recordLikeState:';

const getLikeStateKey = (recordId: string, userId?: string | null) =>
  `${LIKE_STATE_PREFIX}${userId ?? 'anonymous'}:${recordId}`;

export async function getRecordLikeState(
  recordId: string,
  userId?: string | null,
): Promise<RecordLikeState | null> {
  try {
    const raw = await AsyncStorage.getItem(getLikeStateKey(recordId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RecordLikeState> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.liked !== 'boolean' || typeof parsed.likeCount !== 'number') {
      return null;
    }
    return { liked: parsed.liked, likeCount: parsed.likeCount };
  } catch {
    return null;
  }
}

export async function setRecordLikeState(
  recordId: string,
  state: RecordLikeState,
  userId?: string | null,
): Promise<void> {
  try {
    await AsyncStorage.setItem(getLikeStateKey(recordId, userId), JSON.stringify(state));
  } catch {
    // Ignore caching failures to avoid blocking UX.
  }
}
