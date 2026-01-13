import { useCallback, useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

import { ApiClientError } from '@/services/api-client';
import { getGroups } from '@/services/groups';
import type { Group } from '@/types/group';

type LoadState = 'loading' | 'success' | 'error';

export type GroupBookOption = {
  id: string;
  title: string;
  cover: ImageSourcePropType;
  isbn?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiClientError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const isGroupActive = (group: Group) => {
  const now = new Date();
  const startDate = parseDate(group.startDate);
  const goalDate = parseDate(group.goalDate);

  if (startDate && startDate > now) return false;
  if (goalDate && goalDate < now) return false;
  return true;
};

const mapGroupsToBooks = (groups: Group[], fallbackCover: ImageSourcePropType) => {
  const bookMap = new Map<string, GroupBookOption>();

  groups.forEach((group) => {
    const title = group.bookTitle?.trim();
    if (!title) return;

    const isbn = group.bookIsbn?.trim() || undefined;
    const dedupeKey = isbn ?? title.toLowerCase();
    if (bookMap.has(dedupeKey)) return;

    const cover =
      typeof group.bookCover === 'string' && group.bookCover.trim().length > 0
        ? { uri: group.bookCover }
        : fallbackCover;

    bookMap.set(dedupeKey, {
      id: dedupeKey,
      title,
      isbn,
      cover,
    });
  });

  return Array.from(bookMap.values());
};

export function useActiveGroupBooks({ fallbackCover }: { fallbackCover: ImageSourcePropType }) {
  const [books, setBooks] = useState<GroupBookOption[]>([]);
  const [status, setStatus] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const groups = await getGroups();
      const activeGroups = groups.filter(isGroupActive);
      const mappedBooks = mapGroupsToBooks(activeGroups, fallbackCover);
      setBooks(mappedBooks);
      setStatus('success');
    } catch (err) {
      setBooks([]);
      setStatus('error');
      setError(getErrorMessage(err, '책 목록을 불러오지 못했어요.'));
    }
  }, [fallbackCover]);

  useEffect(() => {
    load();
  }, [load]);

  return { books, status, error, refresh: load };
}
