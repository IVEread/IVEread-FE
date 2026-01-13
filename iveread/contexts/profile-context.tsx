import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileState>({
    id: '',
    nickname: '',
    password: '',
    emoji: '',
  });

  const updateProfile = (next: Partial<ProfileState>) => {
    if (next.nickname !== undefined || next.emoji !== undefined) {
      updateMe({
        nickname: next.nickname,
        emoji: next.emoji,
      }).catch(() => {});
    }
    setProfile((prev) => ({ ...prev, ...next }));
  };

  const value = useMemo(() => ({ profile, updateProfile }), [profile]);

  useEffect(() => {
    let isActive = true;
    getMe()
      .then((data) => {
        if (!isActive) return;
        setProfile((prev) => ({
          ...prev,
          id: data.id,
          nickname: data.nickname,
          emoji: data.emoji ?? prev.emoji,
        }));
      })
      .catch(() => {
        if (!isActive) return;
        setProfile((prev) => ({
          ...prev,
          id: prev.id,
          nickname: prev.nickname || '사용자',
          emoji: prev.emoji || '📚',
        }));
      });
    return () => {
      isActive = false;
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
