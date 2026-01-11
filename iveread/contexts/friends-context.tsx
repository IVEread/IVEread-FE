import React, { createContext, useContext, useMemo, useState } from 'react';

export type Friend = {
  name: string;
  email: string;
};

type FriendsContextValue = {
  friends: Friend[];
  addFriend: (friend: Friend) => void;
};

const initialFriends: Friend[] = [
  { name: '명성', email: 'myoungseong@iveread.app' },
  { name: '유진', email: 'yujin@iveread.app' },
  { name: '원영', email: 'wonyoung@iveread.app' },
];

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>(initialFriends);

  const addFriend = (friend: Friend) => {
    const emailKey = friend.email.trim().toLowerCase();
    if (!emailKey) return;
    setFriends((prev) => {
      const exists = prev.some((item) => item.email.toLowerCase() === emailKey);
      if (exists) return prev;
      return [...prev, { ...friend, email: emailKey }];
    });
  };

  const value = useMemo(() => ({ friends, addFriend }), [friends]);

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within FriendsProvider');
  }
  return context;
}
