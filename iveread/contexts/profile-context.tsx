import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getMe, updateMe } from '@/services/users';

type ProfileState = {
  id: string;
  nickname: string;
  password: string;
  emoji: string;
};

type ProfileContextValue = {
  profile: ProfileState;
  updateProfile: (next: Partial<ProfileState>) => void;
  refreshProfile: (isActiveRef?: { current: boolean }) => Promise<void>;
  resetProfile: () => void;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const defaultProfile: ProfileState = {
  id: '',
  nickname: '',
  password: '',
  emoji: '',
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileState>(defaultProfile);

  const updateProfile = useCallback((next: Partial<ProfileState>) => {
    if (next.nickname !== undefined || next.emoji !== undefined) {
      updateMe({
        nickname: next.nickname,
        emoji: next.emoji,
      }).catch(() => {});
    }
    setProfile((prev) => ({ ...prev, ...next }));
  }, []);

  const refreshProfile = useCallback(async (isActiveRef?: { current: boolean }) => {
    const data = await getMe();
    if (isActiveRef && !isActiveRef.current) return;
    setProfile((prev) => ({
      ...prev,
      id: data.id,
      nickname: data.nickname,
      emoji: data.emoji ?? prev.emoji,
    }));
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(defaultProfile);
  }, []);

  const value = useMemo(
    () => ({ profile, updateProfile, refreshProfile, resetProfile }),
    [profile, updateProfile, refreshProfile, resetProfile],
  );

  useEffect(() => {
    const isActiveRef = { current: true };
    refreshProfile(isActiveRef).catch(() => {
      if (!isActiveRef.current) return;
      setProfile((prev) => ({
        ...prev,
        id: prev.id,
        nickname: prev.nickname || '사용자',
        emoji: prev.emoji || '📚',
      }));
    });
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
