import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import {
  createRecord,
  createRecordReaction,
  deleteRecordReaction,
  getRecordReactions,
  getUserRecords,
  updateRecordReaction,
} from '@/services/records';
import type { CreateRecordInput, ReadingRecord } from '@/types/record';
import type { RecordReaction } from '@/types/record-reaction';

const fallbackCover = require('../assets/images/icon.png');

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateKey = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return formatDateKey(date);
};

export type CalendarReaction = {
  id: string;
  emoji: string;
  name: string;
  userId: string;
  profileEmoji: string | null;
};

export type CalendarRecord = {
  date: string;
  title: string;
  note: string;
  cover: ImageSourcePropType;
  recordId: string;
  ownerId: string;
  reactions: CalendarReaction[];
  reactionsLoaded: boolean;
};

type CalendarContextValue = {
  recordsByOwner: Record<string, Record<string, CalendarRecord>>;
  loadRecords: (ownerId: string, year: number, month: number) => Promise<void>;
  addRecord: (groupId: string, payload: CreateRecordInput) => Promise<ReadingRecord>;
  loadRecordReactions: (recordId: string) => Promise<void>;
  addReaction: (recordId: string, emoji: string) => Promise<RecordReaction>;
  updateReaction: (reactionId: string, emoji: string) => Promise<RecordReaction>;
  removeReaction: (recordId: string, reactionId: string) => Promise<void>;
};

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

const mapReaction = (reaction: RecordReaction): CalendarReaction => ({
  id: reaction.id,
  emoji: reaction.emoji,
  name: reaction.userNickname,
  userId: reaction.userId,
  profileEmoji: reaction.userProfileEmoji ?? null,
});

const resolveCover = (record: ReadingRecord): ImageSourcePropType => {
  const coverUrl = record.bookCoverImage?.trim() || record.imageUrl?.trim();
  if (coverUrl) {
    return { uri: coverUrl };
  }
  return fallbackCover;
};

const mapRecordToCalendar = (
  record: ReadingRecord,
  existing?: CalendarRecord,
): CalendarRecord | null => {
  const dateKey = getDateKey(record.readDate) ?? getDateKey(record.createdAt);
  if (!dateKey) return null;
  return {
    date: dateKey,
    title: record.bookTitle ?? '',
    note: record.comment ?? '',
    cover: resolveCover(record),
    recordId: record.id,
    ownerId: record.userId,
    reactions: existing?.reactions ?? [],
    reactionsLoaded: existing?.reactionsLoaded ?? false,
  };
};

export function CalendarRecordsProvider({ children }: { children: React.ReactNode }) {
  const [recordsByOwner, setRecordsByOwner] = useState<
    Record<string, Record<string, CalendarRecord>>
  >({});

  const upsertRecord = useCallback((record: ReadingRecord) => {
    setRecordsByOwner((prev) => {
      const ownerId = record.userId;
      const ownerRecords = prev[ownerId] ?? {};
      const existing = Object.values(ownerRecords).find((item) => item.recordId === record.id);
      const mapped = mapRecordToCalendar(record, existing);
      if (!mapped) return prev;
      return {
        ...prev,
        [ownerId]: {
          ...ownerRecords,
          [mapped.date]: mapped,
        },
      };
    });
  }, []);

  const updateRecordById = useCallback(
    (recordId: string, updater: (record: CalendarRecord) => CalendarRecord) => {
      setRecordsByOwner((prev) => {
        let updated = false;
        const next = { ...prev };

        for (const ownerId of Object.keys(prev)) {
          const ownerRecords = prev[ownerId];
          for (const [dateKey, record] of Object.entries(ownerRecords)) {
            if (record.recordId === recordId) {
              next[ownerId] = {
                ...ownerRecords,
                [dateKey]: updater(record),
              };
              updated = true;
              break;
            }
          }
          if (updated) break;
        }

        return updated ? next : prev;
      });
    },
    [],
  );

  const loadRecords = useCallback(async (ownerId: string, year: number, month: number) => {
    const records = await getUserRecords(ownerId, { year, month });
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;

    setRecordsByOwner((prev) => {
      const ownerRecords = prev[ownerId] ?? {};
      const existingById = new Map(
        Object.values(ownerRecords).map((record) => [record.recordId, record]),
      );
      const nextOwner: Record<string, CalendarRecord> = {};

      Object.entries(ownerRecords).forEach(([dateKey, record]) => {
        if (!dateKey.startsWith(monthPrefix)) {
          nextOwner[dateKey] = record;
        }
      });

      const sorted = [...records].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      sorted.forEach((record) => {
        const mapped = mapRecordToCalendar(record, existingById.get(record.id));
        if (!mapped) return;
        if (!nextOwner[mapped.date]) {
          nextOwner[mapped.date] = mapped;
        }
      });

      return {
        ...prev,
        [ownerId]: nextOwner,
      };
    });
  }, []);

  const addRecord = useCallback(
    async (groupId: string, payload: CreateRecordInput) => {
      const created = await createRecord(groupId, payload);
      upsertRecord(created);
      return created;
    },
    [upsertRecord],
  );

  const loadRecordReactions = useCallback(
    async (recordId: string) => {
      const reactions = await getRecordReactions(recordId);
      const mapped = reactions.map(mapReaction);
      updateRecordById(recordId, (record) => ({
        ...record,
        reactions: mapped,
        reactionsLoaded: true,
      }));
    },
    [updateRecordById],
  );

  const addReaction = useCallback(
    async (recordId: string, emoji: string) => {
      const created = await createRecordReaction(recordId, { emoji });
      const mapped = mapReaction(created);
      updateRecordById(recordId, (record) => {
        const next = record.reactions.filter((item) => item.id !== created.id);
        return {
          ...record,
          reactions: [...next, mapped],
          reactionsLoaded: true,
        };
      });
      return created;
    },
    [updateRecordById],
  );

  const updateReaction = useCallback(
    async (reactionId: string, emoji: string) => {
      const updated = await updateRecordReaction(reactionId, { emoji });
      const mapped = mapReaction(updated);
      updateRecordById(updated.recordId, (record) => ({
        ...record,
        reactions: record.reactions.map((item) => (item.id === updated.id ? mapped : item)),
        reactionsLoaded: true,
      }));
      return updated;
    },
    [updateRecordById],
  );

  const removeReaction = useCallback(
    async (recordId: string, reactionId: string) => {
      await deleteRecordReaction(reactionId);
      updateRecordById(recordId, (record) => ({
        ...record,
        reactions: record.reactions.filter((item) => item.id !== reactionId),
        reactionsLoaded: true,
      }));
    },
    [updateRecordById],
  );

  const value = useMemo(
    () => ({
      recordsByOwner,
      loadRecords,
      addRecord,
      loadRecordReactions,
      addReaction,
      updateReaction,
      removeReaction,
    }),
    [
      recordsByOwner,
      loadRecords,
      addRecord,
      loadRecordReactions,
      addReaction,
      updateReaction,
      removeReaction,
    ],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarRecords() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarRecords must be used within CalendarRecordsProvider');
  }
  return context;
}
