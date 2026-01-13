import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiClientError } from '@/services/api-client';
import { addFriend, getFriends, removeFriend } from '@/services/friends';
import type { Friend } from '@/types/friend';

type LoadState = 'loading' | 'success' | 'error';

type FriendsContextValue = {
  friends: Friend[];
  status: LoadState;
  error: string | null;
  refreshFriends: () => Promise<void>;
  addFriend: (target: string) => Promise<void>;
  removeFriend: (targetId: string) => Promise<void>;
};

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof ApiClientError) {
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
};

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [status, setStatus] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  const refreshFriends = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await getFriends();
      setFriends(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch (err) {
      setFriends([]);
      setStatus('error');
      setError(getErrorMessage(err, '친구 목록을 불러오지 못했어요.'));
    }
  }, []);

  const handleAddFriend = useCallback(
    async (target: string) => {
      const trimmed = target.trim();
      if (!trimmed) return;
      await addFriend(trimmed);
      await refreshFriends();
    },
    [refreshFriends],
  );

  const removeFriendById = useCallback(
    async (targetId: string) => {
      await removeFriend(targetId);
      await refreshFriends();
    },
    [refreshFriends],
  );

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  const value = useMemo(
    () => ({
      friends,
      status,
      error,
      refreshFriends,
      addFriend: handleAddFriend,
      removeFriend: removeFriendById,
    }),
    [friends, status, error, refreshFriends, handleAddFriend, removeFriendById],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within FriendsProvider');
  }
  return context;
}
