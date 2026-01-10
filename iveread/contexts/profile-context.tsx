import React, { createContext, useContext, useMemo, useState } from 'react';

type ProfileState = {
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
    nickname: '서윤',
    password: '',
    emoji: '📚',
  });

  const updateProfile = (next: Partial<ProfileState>) => {
    setProfile((prev) => ({ ...prev, ...next }));
  };

  const value = useMemo(() => ({ profile, updateProfile }), [profile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
