import React, { createContext, useContext, useMemo, useState } from 'react';
import { ImageSourcePropType } from 'react-native';

const coverOptions = [
  require('../assets/images/icon.png'),
  require('../assets/images/react-logo.png'),
  require('../assets/images/partial-react-logo.png'),
  require('../assets/images/splash-icon.png'),
];

export type ReadingClub = {
  id: string;
  groupName: string;
  title: string;
  author: string;
  tag: string;
  tags: string[];
  progress: number;
  members: string;
  memberCount: number;
  memberLimit: number;
  lastActive: string;
  lastActiveDays: number;
  activityScore: number;
  cover: ImageSourcePropType;
};

const initialClubs: ReadingClub[] = [
  {
    id: '1984',
    groupName: '월요일 고전 읽기',
    title: '1984',
    author: '조지 오웰',
    tag: '고전 디스토피아 소설 모임',
    tags: ['고전', '소설', '토론'],
    progress: 0.6,
    members: '5명 중 3명 기록 완료',
    memberCount: 5,
    memberLimit: 6,
    lastActive: '2일 전',
    lastActiveDays: 2,
    activityScore: 86,
    cover: coverOptions[0],
  },
  {
    id: 'sapiens',
    groupName: '인류학 토론 모임',
    title: '사피엔스',
    author: '유발 하라리',
    tag: '역사와 인류학 토론',
    tags: ['인문', '논픽션'],
    progress: 0.35,
    members: '6명 중 2명 기록 완료',
    memberCount: 6,
    memberLimit: 8,
    lastActive: '오늘',
    lastActiveDays: 0,
    activityScore: 92,
    cover: coverOptions[1],
  },
  {
    id: 'gatsby',
    groupName: '아메리칸 클래식',
    title: '위대한 개츠비',
    author: 'F. 스콧 피츠제럴드',
    tag: '미국 문학 고전 읽기',
    tags: ['고전', '문학'],
    progress: 0.8,
    members: '5명 중 5명 기록 완료',
    memberCount: 5,
    memberLimit: 5,
    lastActive: '5일 전',
    lastActiveDays: 5,
    activityScore: 74,
    cover: coverOptions[2],
  },
];

type ReadingClubsContextValue = {
  clubs: ReadingClub[];
  addClub: (club: Omit<ReadingClub, 'id' | 'cover'> & { cover?: ImageSourcePropType }) => void;
};

const ReadingClubsContext = createContext<ReadingClubsContextValue | undefined>(undefined);

export function ReadingClubsProvider({ children }: { children: React.ReactNode }) {
  const [clubs, setClubs] = useState<ReadingClub[]>(initialClubs);

  const addClub = (club: Omit<ReadingClub, 'id' | 'cover'> & { cover?: ImageSourcePropType }) => {
    setClubs((prev) => [
      {
        ...club,
        id: `club-${Date.now()}`,
        cover: club.cover ?? coverOptions[prev.length % coverOptions.length],
      },
      ...prev,
    ]);
  };

  const value = useMemo(() => ({ clubs, addClub }), [clubs]);

  return <ReadingClubsContext.Provider value={value}>{children}</ReadingClubsContext.Provider>;
}

export function useReadingClubs() {
  const context = useContext(ReadingClubsContext);
  if (!context) {
    throw new Error('useReadingClubs must be used within ReadingClubsProvider');
  }
  return context;
}
