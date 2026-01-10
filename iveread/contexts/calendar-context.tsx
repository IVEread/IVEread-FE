import React, { createContext, useContext, useMemo, useState } from 'react';
import { ImageSourcePropType } from 'react-native';

const coverOptions = [
  require('../assets/images/icon.png'),
  require('../assets/images/react-logo.png'),
  require('../assets/images/partial-react-logo.png'),
  require('../assets/images/splash-icon.png'),
];

const initialRecordsByOwner: Record<string, Record<string, CalendarRecord>> = {
  jimin: {
    '2026-01-05': {
      date: '2026-01-05',
      title: '1984',
      note: '밑줄 기록',
      cover: coverOptions[0],
      reactions: [{ id: 'jimin-0105-1', emoji: '✨', name: '서준' }],
    },
    '2026-01-12': {
      date: '2026-01-12',
      title: '위대한 개츠비',
      note: '토론 메모',
      cover: coverOptions[2],
      reactions: [{ id: 'jimin-0112-1', emoji: '👏', name: '수아' }],
    },
  },
  sejun: {
    '2026-01-08': {
      date: '2026-01-08',
      title: '1984',
      note: '챕터 요약',
      cover: coverOptions[0],
      reactions: [{ id: 'sejun-0108-1', emoji: '👍', name: '민호' }],
    },
    '2026-01-15': {
      date: '2026-01-15',
      title: '사피엔스',
      note: '핵심 인사이트',
      cover: coverOptions[1],
      reactions: [],
    },
  },
  sua: {
    '2026-01-03': {
      date: '2026-01-03',
      title: '위대한 개츠비',
      note: '감상 기록',
      cover: coverOptions[2],
      reactions: [{ id: 'sua-0103-1', emoji: '😍', name: '지민' }],
    },
    '2026-01-22': {
      date: '2026-01-22',
      title: '사피엔스',
      note: '토론 준비',
      cover: coverOptions[1],
      reactions: [],
    },
  },
  minho: {
    '2026-01-12': {
      date: '2026-01-12',
      title: '1984',
      note: '중간 체크',
      cover: coverOptions[0],
      reactions: [{ id: 'minho-0112-1', emoji: '🔥', name: '서준' }],
    },
    '2026-01-19': {
      date: '2026-01-19',
      title: '위대한 개츠비',
      note: '감상문',
      cover: coverOptions[2],
      reactions: [],
    },
  },
};

export type CalendarRecord = {
  date: string;
  title: string;
  note: string;
  cover: ImageSourcePropType;
  reactions: CalendarReaction[];
};

export type CalendarReaction = {
  id: string;
  emoji: string;
  name: string;
};

type CalendarContextValue = {
  recordsByOwner: Record<string, Record<string, CalendarRecord>>;
  addRecord: (ownerId: string, record: CalendarRecord) => void;
  addReaction: (ownerId: string, date: string, reaction: CalendarReaction) => void;
};

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

export function CalendarRecordsProvider({ children }: { children: React.ReactNode }) {
  const [recordsByOwner, setRecordsByOwner] = useState<
    Record<string, Record<string, CalendarRecord>>
  >(initialRecordsByOwner);

  const addRecord = (ownerId: string, record: CalendarRecord) => {
    setRecordsByOwner((prev) => ({
      ...prev,
      [ownerId]: {
        ...(prev[ownerId] ?? {}),
        [record.date]: record,
      },
    }));
  };

  const addReaction = (ownerId: string, date: string, reaction: CalendarReaction) => {
    setRecordsByOwner((prev) => {
      const target = prev[ownerId]?.[date];
      if (!target) return prev;
      return {
        ...prev,
        [ownerId]: {
          ...(prev[ownerId] ?? {}),
          [date]: {
            ...target,
            reactions: [...(target.reactions ?? []), reaction],
          },
        },
      };
    });
  };

  const value = useMemo(() => ({ recordsByOwner, addRecord, addReaction }), [recordsByOwner]);

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarRecords() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarRecords must be used within CalendarRecordsProvider');
  }
  return context;
}
