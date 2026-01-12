import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
  type DimensionValue,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { getPersonEmoji } from '@/constants/people';
import { useProfile } from '@/contexts/profile-context';
import { ApiClientError } from '@/services/api-client';
import { getBookByIsbn, searchBooks } from '@/services/books';
import { getGroup, getGroups } from '@/services/groups';
import {
  createRecordComment,
  getGroupRecords,
  getRecordComments,
  getRecordReactions,
} from '@/services/records';
import {
  createSentence,
  createSentenceComment,
  getGroupSentences,
  getSentenceComments,
} from '@/services/sentences';
import { getUserId } from '@/services/session';
import type { Book } from '@/types/book';
import type { Group } from '@/types/group';

const dayKeyOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const getWeekStart = (baseDate: Date) => {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDateKeys = (baseDate: Date) => {
  const start = getWeekStart(baseDate);
  return dayKeyOrder.map((key, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { key, dateKey: formatDateKey(date) };
  });
};

type LoadState = 'idle' | 'loading' | 'success' | 'error';

type SentenceReply = {
  id: string;
  name: string;
  time: string;
  text: string;
};

type SentenceItem = {
  id: string;
  page: string;
  text: string;
  name: string;
  replies: SentenceReply[];
  source: 'remote' | 'local';
};

type FeedComment = {
  id: string;
  name: string;
  time: string;
  text: string;
};

type FeedItem = {
  id: string;
  name: string;
  time: string;
  image: ImageSourcePropType;
  caption: string;
  likes: number;
  comments: FeedComment[];
  createdAt: string;
  recordId?: string;
  source: 'remote' | 'local';
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
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

const isNotFoundError = (error: unknown) =>
  error instanceof ApiClientError && error.status === 404;

const weeklyStampConfig = [
  {
    id: 'mon',
    day: '월',
    icon: '📗',
    border: '#9FC57C',
    fill: '#E7F3D7',
    shape: 'square',
  },
  {
    id: 'tue',
    day: '화',
    icon: '📘',
    border: '#8FB6D4',
    fill: '#E1EEF7',
    shape: 'square',
  },
  {
    id: 'wed',
    day: '수',
    icon: '📙',
    border: '#E2A458',
    fill: '#F9E8D0',
    shape: 'round',
  },
  {
    id: 'thu',
    day: '목',
    icon: '📖',
    border: '#E07C4F',
    fill: '#F7E0D4',
    shape: 'round',
  },
  {
    id: 'fri',
    day: '금',
    icon: '📘',
    border: '#5B9BD5',
    fill: '#DCEBFA',
    shape: 'round',
  },
  {
    id: 'sat',
    day: '토',
    icon: '📓',
    border: '#C9A6E3',
    fill: '#EFE3F7',
    shape: 'square',
  },
  {
    id: 'sun',
    day: '일',
    icon: '📔',
    border: '#D88FA0',
    fill: '#F7DEE3',
    shape: 'square',
  },
] as const;

export default function BookDetailScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const routeId = typeof id === 'string' ? id : undefined;
  const [book, setBook] = useState<Book | null>(null);
  const [bookStatus, setBookStatus] = useState<LoadState>('loading');
  const [bookError, setBookError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupStatus, setGroupStatus] = useState<LoadState>('loading');
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [sentencesStatus, setSentencesStatus] = useState<LoadState>('loading');
  const [sentencesError, setSentencesError] = useState<string | null>(null);
  const [isAddingSentence, setIsAddingSentence] = useState(false);
  const [sentenceText, setSentenceText] = useState('');
  const [sentencePage, setSentencePage] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedStatus, setFeedStatus] = useState<LoadState>('loading');
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [selectedUploadImage, setSelectedUploadImage] = useState<ImageSourcePropType | null>(null);
  const [selectedUploadUri, setSelectedUploadUri] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [feedCommentText, setFeedCommentText] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<'current' | 'previous'>('current');
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const myEmoji = profile.emoji || (profile.nickname ? profile.nickname.slice(0, 1) : '😊');
  const getEmojiForName = (name: string) => getPersonEmoji(name, myEmoji);
  const galleryCardSize = Math.floor((width - 22 * 2 - 14) / 2);
  const previewImageHeight = Math.min(Math.floor(width * 1.35), Math.floor(height * 0.68));
  const uploadDateKeys = useMemo(
    () =>
      new Set(
        feedItems
          .map((item) => item.createdAt)
          .filter((value): value is string => Boolean(value)),
      ),
    [feedItems],
  );
  const baseWeekDate = useMemo(() => {
    const date = new Date();
    if (selectedWeek === 'previous') {
      date.setDate(date.getDate() - 7);
    }
    return date;
  }, [selectedWeek]);
  const weekDateKeys = useMemo(() => getWeekDateKeys(baseWeekDate), [baseWeekDate]);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const weeklyStamps = useMemo(
    () =>
      weeklyStampConfig.map((stamp, index) => {
        const weekDateKey = weekDateKeys[index]?.dateKey;
        return {
          ...stamp,
          isChecked: weekDateKey ? uploadDateKeys.has(weekDateKey) : false,
          isToday: weekDateKey === todayKey,
        };
      }),
    [uploadDateKeys, weekDateKeys, todayKey],
  );
  const completedStampCount = weeklyStamps.filter((stamp) => stamp.isChecked).length;
  const streakCount = useMemo(() => {
    let count = 0;
    const weekStart = getWeekStart(baseWeekDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(0, 0, 0, 0);
    const date = new Date(selectedWeek === 'current' ? new Date() : weekEnd);
    date.setHours(0, 0, 0, 0);
    while (date >= weekStart) {
      const key = formatDateKey(date);
      if (!uploadDateKeys.has(key)) {
        break;
      }
      count += 1;
      date.setDate(date.getDate() - 1);
    }
    return count;
  }, [baseWeekDate, selectedWeek, uploadDateKeys]);
  const stampTopRow = weeklyStamps.slice(0, 3);
  const stampBottomRow = weeklyStamps.slice(3);
  const stampTopPositions: DimensionValue[] = ['25%', '50%', '75%'];
  const stampBottomPositions: DimensionValue[] = ['12.5%', '37.5%', '62.5%', '87.5%'];
  const stampItemWidth = 64;
  const stampRowOffset = 80;

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!routeId) {
        if (!isActive) return;
        setBook(null);
        setBookStatus('error');
        setBookError('도서 정보를 불러올 수 없어요.');
        setGroup(null);
        setGroupStatus('error');
        setGroupError('교환독서 정보를 불러올 수 없어요.');
        setGroupId(null);
        return;
      }

      setBook(null);
      setBookStatus('loading');
      setBookError(null);
      setGroup(null);
      setGroupStatus('loading');
      setGroupError(null);
      setGroupId(null);

      let resolvedGroup: Group | null = null;
      let resolvedBook: Book | null = null;
      let groupMessage: string | null = null;
      let bookMessage: string | null = null;

      try {
        resolvedGroup = await getGroup(routeId);
      } catch (error) {
        if (!isNotFoundError(error)) {
          groupMessage = getErrorMessage(error, '교환독서 정보를 불러오지 못했어요.');
        }
      }

      try {
        resolvedBook = await getBookByIsbn(routeId);
      } catch (error) {
        if (!isNotFoundError(error)) {
          bookMessage = getErrorMessage(error, '도서 정보를 불러오지 못했어요.');
        }
      }

      if (!resolvedBook && resolvedGroup?.bookTitle) {
        try {
          const search = await searchBooks(resolvedGroup.bookTitle, 1, 5);
          const match =
            search.items.find((item) => item.title === resolvedGroup?.bookTitle) ?? search.items[0];
          if (match) {
            try {
              resolvedBook = await getBookByIsbn(match.isbn);
            } catch (error) {
              resolvedBook = match;
              if (!bookMessage && !isNotFoundError(error)) {
                bookMessage = getErrorMessage(error, '도서 정보를 불러오지 못했어요.');
              }
            }
          }
        } catch (error) {
          if (!bookMessage) {
            bookMessage = getErrorMessage(error, '도서 정보를 불러오지 못했어요.');
          }
        }
      }

      if (!resolvedGroup && resolvedBook) {
        try {
          const groups = await getGroups();
          resolvedGroup = groups.find((item) => item.bookTitle === resolvedBook?.title) ?? null;
        } catch (error) {
          if (!groupMessage) {
            groupMessage = getErrorMessage(error, '교환독서 정보를 불러오지 못했어요.');
          }
        }
      }

      if (!isActive) return;

      if (resolvedBook) {
        setBook(resolvedBook);
        setBookStatus('success');
        setBookError(null);
      } else {
        setBook(null);
        setBookStatus('error');
        setBookError(bookMessage ?? '도서 정보를 찾을 수 없어요.');
      }

      if (resolvedGroup) {
        setGroup(resolvedGroup);
        setGroupStatus('success');
        setGroupError(null);
        setGroupId(resolvedGroup.id);
      } else {
        setGroup(null);
        setGroupStatus('error');
        setGroupError(groupMessage ?? '교환독서 정보를 찾을 수 없어요.');
        setGroupId(null);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [routeId]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!groupId) {
        if (!isActive) return;
        setSentences([]);
        setFeedItems([]);
        setSelectedPostId(null);
        setOpenReplyId(null);
        setReplyInputs({});
        setFeedCommentText('');
        if (groupStatus === 'loading') {
          setSentencesStatus('loading');
          setSentencesError(null);
          setFeedStatus('loading');
          setFeedError(null);
        } else {
          setSentencesStatus('error');
          setSentencesError('교환독서 정보를 불러올 수 없어요.');
          setFeedStatus('error');
          setFeedError('독서 기록을 불러올 수 없어요.');
        }
        return;
      }

      setSentences([]);
      setSentencesStatus('loading');
      setSentencesError(null);
      setFeedItems([]);
      setFeedStatus('loading');
      setFeedError(null);
      setSelectedPostId(null);
      setOpenReplyId(null);
      setReplyInputs({});
      setFeedCommentText('');

      const userId = await getUserId();

      const loadSentences = async () => {
        try {
          const data = await getGroupSentences(groupId);
          const sorted = [...data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          const mapped = await Promise.all(
            sorted.map(async (sentence): Promise<SentenceItem> => {
              let replies: SentenceReply[] = [];
              try {
                const comments = await getSentenceComments(sentence.id);
                replies = comments.map((comment) => ({
                  id: comment.id,
                  name: comment.userNickname,
                  time: formatRelativeTime(String(comment.createdAt)),
                  text: comment.content,
                }));
              } catch {
                replies = [];
              }
              return {
                id: sentence.id,
                page: `p. ${sentence.pageNo}`,
                text: sentence.content,
                name: sentence.userNickname,
                replies,
                source: 'remote',
              };
            }),
          );

          if (!isActive) return;
          setSentences(mapped);
          setSentencesStatus('success');
          setSentencesError(null);
        } catch (error) {
          if (!isActive) return;
          setSentences([]);
          setSentencesStatus('error');
          setSentencesError(getErrorMessage(error, '문장을 불러오지 못했어요.'));
        }
      };

      const loadRecords = async () => {
        try {
          const records = await getGroupRecords(groupId);
          const sorted = [...records].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          const likedSet = new Set<string>();
          const mapped = await Promise.all(
            sorted.map(async (record): Promise<FeedItem> => {
              let comments: FeedComment[] = [];
              let reactionsCount = 0;
              let reactionsByUser = false;

              try {
                const recordComments = await getRecordComments(record.id);
                comments = recordComments.map((comment) => ({
                  id: comment.id,
                  name: comment.userNickname,
                  time: formatRelativeTime(String(comment.createdAt)),
                  text: comment.content,
                }));
              } catch {
                comments = [];
              }

              try {
                const reactions = await getRecordReactions(record.id);
                reactionsCount = reactions.length;
                if (userId) {
                  reactionsByUser = reactions.some((reaction) => reaction.userId === userId);
                }
              } catch {
                reactionsCount = 0;
              }

              if (reactionsByUser) {
                likedSet.add(record.id);
              }

              const readDate = new Date(record.readDate);
              const createdDate = Number.isNaN(readDate.getTime())
                ? new Date(record.createdAt)
                : readDate;

              return {
                id: record.id,
                recordId: record.id,
                name: record.userNickname,
                time: formatRelativeTime(String(record.createdAt)),
                image: { uri: record.imageUrl },
                caption: record.comment ?? '',
                likes: reactionsCount,
                comments,
                createdAt: formatDateKey(createdDate),
                source: 'remote',
              };
            }),
          );

          if (!isActive) return;
          setFeedItems(mapped);
          setFeedStatus('success');
          setFeedError(null);
          setLikedPostIds(likedSet);
        } catch (error) {
          if (!isActive) return;
          setFeedItems([]);
          setFeedStatus('error');
          setFeedError(getErrorMessage(error, '독서 기록을 불러오지 못했어요.'));
        }
      };

      await Promise.all([loadSentences(), loadRecords()]);
    };

    load();

    return () => {
      isActive = false;
    };
  }, [groupId, groupStatus]);

  const bookTitle =
    book?.title ?? group?.bookTitle ?? (bookStatus === 'loading' ? '불러오는 중...' : '');
  const bookAuthor = book?.author ?? '';
  const bookTag = book?.publisher ?? '';
  const bookCoverSource = useMemo<ImageSourcePropType | null>(() => {
    if (book?.coverImage) {
      return { uri: book.coverImage };
    }
    if (group?.bookCover) {
      return { uri: group.bookCover };
    }
    return null;
  }, [book?.coverImage, group?.bookCover]);

  const groupStartDate = group?.startDate ? formatDisplayDate(group.startDate) : null;
  const groupGoalDate = group?.goalDate ? formatDisplayDate(group.goalDate) : null;
  const memberAvatarCount = group?.memberCount ? Math.min(group.memberCount, 5) : 0;

  const handleAddSentence = async () => {
    const trimmedText = sentenceText.trim();
    const trimmedPage = sentencePage.trim();

    if (!trimmedText) {
      Alert.alert('안내', '문장을 입력해 주세요.');
      return;
    }
    if (!trimmedPage) {
      Alert.alert('안내', '페이지를 입력해 주세요.');
      return;
    }
    const pageNo = Number(trimmedPage);
    if (!Number.isFinite(pageNo)) {
      Alert.alert('안내', '올바른 페이지 번호를 입력해 주세요.');
      return;
    }
    if (!groupId || !book?.isbn) {
      Alert.alert('안내', '교환독서 정보를 불러온 뒤 등록할 수 있어요.');
      return;
    }

    try {
      const created = await createSentence(groupId, {
        content: trimmedText,
        pageNo,
        bookIsbn: book.isbn,
      });
      const nextItem: SentenceItem = {
        id: created.id,
        page: `p. ${created.pageNo}`,
        text: created.content,
        name: created.userNickname,
        replies: [],
        source: 'remote',
      };
      setSentences((prev) => [nextItem, ...prev]);
      setSentencesStatus('success');
      setSentencesError(null);
      setSentenceText('');
      setSentencePage('');
      setIsAddingSentence(false);
    } catch (error) {
      Alert.alert('안내', getErrorMessage(error, '문장 등록에 실패했어요.'));
    }
  };

  const handleAddReply = async (sentenceId: string) => {
    const message = replyInputs[sentenceId]?.trim();
    if (!message) {
      Alert.alert('안내', '답글을 입력해 주세요.');
      return;
    }

    const target = sentences.find((sentence) => sentence.id === sentenceId);
    if (!target) {
      return;
    }

    if (target.source === 'remote') {
      try {
        const created = await createSentenceComment(sentenceId, { content: message });
        setSentences((prev) =>
          prev.map((sentence) =>
            sentence.id === sentenceId
              ? {
                  ...sentence,
                  replies: [
                    ...(sentence.replies ?? []),
                    {
                      id: created.id,
                      name: created.userNickname,
                      time: formatRelativeTime(String(created.createdAt)),
                      text: created.content,
                    },
                  ],
                }
              : sentence,
          ),
        );
      } catch (error) {
        Alert.alert('안내', getErrorMessage(error, '답글 등록에 실패했어요.'));
        return;
      }
    } else {
      setSentences((prev) =>
        prev.map((sentence) =>
          sentence.id === sentenceId
            ? {
                ...sentence,
                replies: [
                  ...(sentence.replies ?? []),
                  { id: `r-${Date.now()}`, name: '나', time: '방금', text: message },
                ],
              }
            : sentence,
        ),
      );
    }

    setReplyInputs((prev) => ({ ...prev, [sentenceId]: '' }));
    setOpenReplyId(null);
  };
  const contentContainerStyle = useMemo(
    () => [styles.container, { paddingBottom: 160 + insets.bottom }],
    [insets.bottom],
  );
  const sections = useMemo(
    () => ['header', 'info', 'stamps', 'sentences', 'feed'] as const,
    [],
  );
  const renderSection = useMemo(
    () =>
      ({ item }: { item: (typeof sections)[number] }) => {
        if (item === 'header') {
          return (
            <>
              <View style={styles.headerRow}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                  <Text style={styles.backIcon}>‹</Text>
                </Pressable>
                <Text style={styles.headerTitle}>교환독서 상세 페이지</Text>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.bookCard}>
                <View style={styles.bookCover}>
                  {bookCoverSource ? (
                    <Image source={bookCoverSource} style={styles.bookCoverImage} />
                  ) : (
                    <Text style={styles.bookCoverText}>
                      {bookStatus === 'loading' ? '불러오는 중' : '표지'}
                    </Text>
                  )}
                </View>
                <View style={styles.bookInfo}>
                  <View style={styles.bookTitleRow}>
                    <Text style={styles.bookTitle}>{bookTitle}</Text>
                    {bookTag ? (
                      <View style={styles.bookTagInline}>
                        <Text style={styles.bookTagText}>{bookTag}</Text>
                      </View>
                    ) : null}
                  </View>
                  {bookStatus === 'error' && bookError ? (
                    <Text style={styles.emptyText}>{bookError}</Text>
                  ) : bookAuthor ? (
                    <Text style={styles.bookAuthor}>{bookAuthor}</Text>
                  ) : null}
                </View>
              </View>
            </>
          );
        }

        if (item === 'info') {
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>교환독서 정보</Text>
              <View style={styles.infoCard}>
                {groupStatus === 'loading' ? (
                  <Text style={styles.emptyText}>정보를 불러오는 중...</Text>
                ) : groupStatus === 'error' ? (
                  <Text style={styles.emptyText}>
                    {groupError ?? '교환독서 정보를 불러올 수 없어요.'}
                  </Text>
                ) : group ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>시작일</Text>
                      <Text style={styles.infoValue}>
                        {groupStartDate ? `${groupStartDate} 시작` : '-'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>목표일</Text>
                      <Text style={styles.infoValue}>
                        {groupGoalDate ? `${groupGoalDate} 까지` : '-'}
                      </Text>
                    </View>
                    <View style={styles.memberRow}>
                      <View style={styles.memberAvatarStack}>
                        {Array.from({ length: memberAvatarCount }).map((_, index) => (
                          <View key={`member-${index}`} style={styles.memberAvatar}>
                            <Text style={styles.memberInitial}>{myEmoji}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.memberCount}>
                        {group.memberCount}명이 함께 읽고 있어요
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.emptyText}>교환독서 정보를 찾을 수 없어요.</Text>
                )}
              </View>
            </View>
          );
        }

        if (item === 'stamps') {
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>일주일 출석 스탬프</Text>
              <View style={styles.stampCard}>
                <View style={styles.stampHeader}>
                  <Text style={styles.stampTitle}>
                    {selectedWeek === 'current'
                      ? `이번 주 ${completedStampCount}일 출석`
                      : `지난 주 ${completedStampCount}일 출석`}
                  </Text>
                </View>
                <View style={styles.stampControlRow}>
                  <View style={styles.weekToggle}>
                    <Pressable
                      onPress={() => setSelectedWeek('current')}
                      style={[
                        styles.weekToggleButton,
                        selectedWeek === 'current' && styles.weekToggleButtonActive,
                      ]}
                      accessibilityRole="button">
                      <Text
                        style={[
                          styles.weekToggleText,
                          selectedWeek === 'current' && styles.weekToggleTextActive,
                        ]}>
                        이번 주
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedWeek('previous')}
                      style={[
                        styles.weekToggleButton,
                        selectedWeek === 'previous' && styles.weekToggleButtonActive,
                      ]}
                      accessibilityRole="button">
                      <Text
                        style={[
                          styles.weekToggleText,
                          selectedWeek === 'previous' && styles.weekToggleTextActive,
                        ]}>
                        지난 주
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakLabel}>연속</Text>
                    <Text style={styles.streakValue}>{streakCount}일</Text>
                  </View>
                </View>
                <View style={styles.stampLayout}>
                  {stampTopRow.map((stamp, index) => {
                    const isSquare = stamp.shape === 'square';
                    return (
                      <View
                        key={stamp.id}
                        style={[
                          styles.stampItemAbsolute,
                          {
                            left: stampTopPositions[index],
                            top: 0,
                            width: stampItemWidth,
                            transform: [{ translateX: -stampItemWidth / 2 }],
                          },
                        ]}>
                        <View
                          style={[
                            styles.stampBadge,
                            isSquare ? styles.stampBadgeSquare : styles.stampBadgeRound,
                            {
                              borderColor: stamp.border,
                              backgroundColor: stamp.isChecked ? stamp.fill : Palette.surface,
                            },
                            stamp.isChecked ? styles.stampBadgeActive : styles.stampBadgeInactive,
                            stamp.isToday && styles.stampBadgeToday,
                          ]}>
                          <Text
                            style={[
                              styles.stampIcon,
                              stamp.isChecked ? styles.stampIconActive : styles.stampIconInactive,
                            ]}>
                            {stamp.icon}
                          </Text>
                        </View>
                        <Text style={[styles.stampDay, stamp.isToday && styles.stampDayToday]}>
                          {stamp.day}
                        </Text>
                      </View>
                    );
                  })}
                  {stampBottomRow.map((stamp, index) => {
                    const isSquare = stamp.shape === 'square';
                    return (
                      <View
                        key={stamp.id}
                        style={[
                          styles.stampItemAbsolute,
                          {
                            left: stampBottomPositions[index],
                            top: stampRowOffset,
                            width: stampItemWidth,
                            transform: [{ translateX: -stampItemWidth / 2 }],
                          },
                        ]}>
                        <View
                          style={[
                            styles.stampBadge,
                            isSquare ? styles.stampBadgeSquare : styles.stampBadgeRound,
                            {
                              borderColor: stamp.border,
                              backgroundColor: stamp.isChecked ? stamp.fill : Palette.surface,
                            },
                            stamp.isChecked ? styles.stampBadgeActive : styles.stampBadgeInactive,
                            stamp.isToday && styles.stampBadgeToday,
                          ]}>
                          <Text
                            style={[
                              styles.stampIcon,
                              stamp.isChecked ? styles.stampIconActive : styles.stampIconInactive,
                            ]}>
                            {stamp.icon}
                          </Text>
                        </View>
                        <Text style={[styles.stampDay, stamp.isToday && styles.stampDayToday]}>
                          {stamp.day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.stampNote}>오늘 스탬프를 찍으면 연속 기록이 이어져요.</Text>
              </View>
            </View>
          );
        }

        if (item === 'sentences') {
          return (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>인상 깊었던 문장</Text>
                <Pressable
                  style={styles.plusButton}
                  onPress={() => setIsAddingSentence((prev) => !prev)}
                  accessibilityRole="button">
                  <Text style={styles.plusButtonText}>＋</Text>
                </Pressable>
              </View>
              {isAddingSentence && (
                <View style={styles.sentenceInputCard}>
                  <View style={styles.sentenceInputRow}>
                    <TextInput
                      value={sentencePage}
                      onChangeText={setSentencePage}
                      placeholder="페이지"
                      placeholderTextColor={Palette.textTertiary}
                      keyboardType="number-pad"
                      style={styles.sentencePageInput}
                    />
                    <Pressable
                      style={styles.sentenceAddButton}
                      onPress={handleAddSentence}
                      accessibilityRole="button">
                      <Text style={styles.sentenceAddText}>추가</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={sentenceText}
                    onChangeText={setSentenceText}
                    placeholder="인상 깊었던 문장을 입력하세요"
                    placeholderTextColor={Palette.textTertiary}
                    multiline
                    style={styles.sentenceTextInput}
                  />
                </View>
              )}
              {sentencesStatus === 'loading' ? (
                <Text style={styles.emptyText}>문장을 불러오는 중...</Text>
              ) : sentencesStatus === 'error' ? (
                <Text style={styles.emptyText}>
                  {sentencesError ?? '문장을 불러올 수 없어요.'}
                </Text>
              ) : sentences.length === 0 ? (
                <Text style={styles.emptyText}>아직 등록된 문장이 없어요.</Text>
              ) : (
                sentences.map((item) => (
                  <View key={item.id} style={styles.sentenceCard}>
                    <View style={styles.pageBadge}>
                      <Text style={styles.pageBadgeText}>{item.page}</Text>
                    </View>
                    <Text style={styles.sentenceText}>{item.text}</Text>
                    <View style={styles.sentenceMeta}>
                      <View style={styles.sentenceAvatar}>
                        <Text style={styles.sentenceAvatarText}>
                          {getEmojiForName(item.name)}
                        </Text>
                      </View>
                      <Text style={styles.sentenceName}>{item.name}</Text>
                    </View>
                    <View style={styles.replySection}>
                      {item.replies && item.replies.length > 0 ? (
                        item.replies.map((reply) => (
                          <View key={reply.id} style={styles.replyRow}>
                            <View style={styles.replyAvatar}>
                              <Text style={styles.replyAvatarText}>
                                {getEmojiForName(reply.name)}
                              </Text>
                            </View>
                            <View style={styles.replyBody}>
                              <View style={styles.replyHeader}>
                                <Text style={styles.replyName}>{reply.name}</Text>
                                <Text style={styles.replyTime}>{reply.time}</Text>
                              </View>
                              <Text style={styles.replyText}>{reply.text}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.replyEmptyText}>첫 번째 답글을 남겨보세요.</Text>
                      )}
                      {openReplyId === item.id ? (
                        <View style={styles.replyInputRow}>
                          <TextInput
                            value={replyInputs[item.id] ?? ''}
                            onChangeText={(value) =>
                              setReplyInputs((prev) => ({ ...prev, [item.id]: value }))
                            }
                            placeholder="답글을 입력하세요..."
                            placeholderTextColor={Palette.textTertiary}
                            style={styles.replyInput}
                          />
                          <Pressable
                            style={styles.sendButton}
                            onPress={() => handleAddReply(item.id)}
                            accessibilityRole="button">
                            <Text style={styles.sendButtonText}>↗</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.replyToggleButton}
                          onPress={() => setOpenReplyId(item.id)}
                          accessibilityRole="button">
                          <Text style={styles.replyToggleText}>답글 달기</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        }

        return (
          <View style={styles.section}>
            <View style={[styles.sectionHeaderRow, styles.feedHeaderRow]}>
              <Text style={styles.sectionTitle}>독서 기록 피드</Text>
              <Pressable
                style={styles.feedUploadButton}
                onPress={() => setIsUploadOpen(true)}
                accessibilityRole="button">
                <Text style={styles.feedUploadText}>업로드</Text>
              </Pressable>
            </View>
            {feedStatus === 'loading' ? (
              <Text style={styles.emptyText}>피드를 불러오는 중...</Text>
            ) : feedStatus === 'error' ? (
              <Text style={styles.emptyText}>{feedError ?? '피드를 불러올 수 없어요.'}</Text>
            ) : feedItems.length === 0 ? (
              <Text style={styles.emptyText}>등록된 기록이 없어요.</Text>
            ) : (
              <View style={styles.galleryGrid}>
                {feedItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.galleryItem, { width: galleryCardSize }]}
                    onPress={() => setSelectedPostId(item.id)}
                    accessibilityRole="button">
                    <Image source={item.image} style={styles.galleryImage} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      },
    [
      completedStampCount,
      bookAuthor,
      bookCoverSource,
      bookError,
      bookStatus,
      bookTag,
      bookTitle,
      feedItems,
      feedError,
      feedStatus,
      galleryCardSize,
      getEmojiForName,
      groupError,
      groupGoalDate,
      groupStartDate,
      groupStatus,
      handleAddReply,
      handleAddSentence,
      insets.bottom,
      isAddingSentence,
      myEmoji,
      memberAvatarCount,
      openReplyId,
      replyInputs,
      router,
      sentencePage,
      sentenceText,
      sentences,
      sentencesError,
      sentencesStatus,
      selectedWeek,
      setIsUploadOpen,
      setOpenReplyId,
      setSelectedPostId,
      setSelectedWeek,
      stampBottomPositions,
      stampBottomRow,
      stampItemWidth,
      stampRowOffset,
      stampTopPositions,
      stampTopRow,
      streakCount,
      weeklyStamps,
    ],
  );
  const gallery = useMemo(() => feedItems.map((item) => item.image), [feedItems]);
  const selectedPost = useMemo(
    () => (selectedPostId ? feedItems.find((item) => item.id === selectedPostId) ?? null : null),
    [feedItems, selectedPostId],
  );
  const selectedUploadSource = useMemo(() => {
    if (selectedUploadUri) {
      return { uri: selectedUploadUri };
    }
    if (selectedUploadImage) {
      return selectedUploadImage;
    }
    return null;
  }, [selectedUploadImage, selectedUploadUri]);

  const handleUploadFeed = () => {
    if (!selectedUploadImage && !selectedUploadUri) {
      Alert.alert('안내', '사진을 선택해 주세요.');
      return;
    }
    if (!uploadCaption.trim()) {
      Alert.alert('안내', '사진과 글을 모두 입력해 주세요.');
      return;
    }
    setFeedItems((prev) => [
      {
        id: `feed-${Date.now()}`,
        name: profile.nickname || '나',
        time: '방금',
        image: selectedUploadUri ? { uri: selectedUploadUri } : selectedUploadImage!,
        caption: uploadCaption.trim(),
        likes: 0,
        comments: [],
        createdAt: formatDateKey(new Date()),
        source: 'local',
      },
      ...prev,
    ]);
    setFeedStatus('success');
    setFeedError(null);
    setSelectedUploadImage(null);
    setSelectedUploadUri(null);
    setUploadCaption('');
    setIsUploadOpen(false);
  };

  const handleToggleLike = (postId: string) => {
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      const isLiked = next.has(postId);
      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      setFeedItems((items) =>
        items.map((item) =>
          item.id === postId
            ? { ...item, likes: Math.max(0, item.likes + (isLiked ? -1 : 1)) }
            : item,
        ),
      );
      return next;
    });
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진을 선택하려면 사진 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setSelectedUploadUri(uri);
        setSelectedUploadImage(null);
      }
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진을 촬영하려면 카메라 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setSelectedUploadUri(uri);
        setSelectedUploadImage(null);
      }
    }
  };


  const handleAddFeedComment = async () => {
    if (!selectedPostId || !feedCommentText.trim()) {
      Alert.alert('안내', '댓글을 입력해 주세요.');
      return;
    }
    const message = feedCommentText.trim();
    const target = feedItems.find((item) => item.id === selectedPostId);

    if (!target) {
      return;
    }

    if (target.source === 'remote' && target.recordId) {
      try {
        const created = await createRecordComment(target.recordId, { content: message });
        setFeedItems((prev) =>
          prev.map((item) =>
            item.id === selectedPostId
              ? {
                  ...item,
                  comments: [
                    ...(item.comments ?? []),
                    {
                      id: created.id,
                      name: created.userNickname,
                      time: formatRelativeTime(String(created.createdAt)),
                      text: created.content,
                    },
                  ],
                }
              : item,
          ),
        );
      } catch (error) {
        Alert.alert('안내', getErrorMessage(error, '댓글 등록에 실패했어요.'));
        return;
      }
    } else {
      setFeedItems((prev) =>
        prev.map((item) =>
          item.id === selectedPostId
            ? {
                ...item,
                comments: [
                  ...(item.comments ?? []),
                  { id: `fc-${Date.now()}`, name: '나', time: '방금', text: message },
                ],
              }
            : item,
        ),
      );
    }

    setFeedCommentText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <FlatList
          data={sections}
          keyExtractor={(item) => item}
          renderItem={renderSection}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          onScrollBeginDrag={Keyboard.dismiss}
        />
          {selectedPostId !== null && (
            <Modal visible transparent animationType="fade">
              <KeyboardAvoidingView
                style={styles.previewOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={insets.top}>
                <View style={styles.previewCard}>
                  <Pressable
                    style={styles.previewCloseIcon}
                    onPress={() => setSelectedPostId(null)}
                    accessibilityRole="button">
                    <Text style={styles.previewCloseIconText}>×</Text>
                  </Pressable>
                  <ScrollView
                    style={styles.previewScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    contentContainerStyle={[
                      styles.previewContent,
                      { paddingBottom: 160 + insets.bottom },
                    ]}>
                    {selectedPost && (
                      <View style={styles.previewHeaderRow}>
                        <View style={styles.previewUserAvatar}>
                          <Text style={styles.previewUserInitial}>
                            {getEmojiForName(selectedPost.name)}
                          </Text>
                        </View>
                        <View style={styles.previewUserMeta}>
                          <Text style={styles.previewUserName}>{selectedPost.name}</Text>
                          <Text style={styles.previewUserTime}>{selectedPost.time}</Text>
                        </View>
                      </View>
                    )}
                    {selectedPost && (
                      <Image
                        source={selectedPost.image}
                        style={[styles.previewImage, { height: previewImageHeight }]}
                      />
                    )}
                    {selectedPost && (
                      <>
                        <Text style={styles.feedCaption}>{selectedPost.caption}</Text>
                        <View style={styles.feedMetaRow}>
                          <Pressable
                            style={styles.likeButton}
                            onPress={() => handleToggleLike(selectedPost.id)}
                            accessibilityRole="button">
                            <Text
                              style={[
                                styles.likeButtonText,
                                likedPostIds.has(selectedPost.id) && styles.likeButtonTextActive,
                              ]}>
                              {likedPostIds.has(selectedPost.id) ? '♥' : '♡'}
                            </Text>
                          </Pressable>
                          <Text style={styles.feedMetaText}>좋아요 {selectedPost.likes}</Text>
                        </View>
                        <View style={styles.feedCommentList}>
                          {selectedPost.comments.length === 0 ? (
                            <Text style={styles.replyEmptyText}>첫 댓글을 남겨보세요.</Text>
                          ) : (
                            selectedPost.comments.map((comment) => (
                              <View key={comment.id} style={styles.replyRow}>
                                <View style={styles.replyAvatar}>
                                  <Text style={styles.replyAvatarText}>
                                    {getEmojiForName(comment.name)}
                                  </Text>
                                </View>
                                <View style={styles.replyBody}>
                                  <View style={styles.replyHeader}>
                                    <Text style={styles.replyName}>{comment.name}</Text>
                                    <Text style={styles.replyTime}>{comment.time}</Text>
                                  </View>
                                  <Text style={styles.replyText}>{comment.text}</Text>
                                </View>
                              </View>
                            ))
                          )}
                        </View>
                        <View style={[styles.replyInputRow, styles.previewReplyInputRow]}>
                          <TextInput
                            value={feedCommentText}
                            onChangeText={setFeedCommentText}
                            placeholder="댓글을 입력하세요..."
                            placeholderTextColor={Palette.textTertiary}
                            style={styles.replyInput}
                          />
                          <Pressable
                            style={[styles.sendButton, styles.previewSendButton]}
                            onPress={handleAddFeedComment}
                            accessibilityRole="button">
                            <Text style={[styles.sendButtonText, styles.previewSendButtonText]}>
                              ↗
                            </Text>
                          </Pressable>
                        </View>
                      </>
                    )}
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          )}

          {isUploadOpen && (
            <Modal visible transparent animationType="fade">
              <KeyboardAvoidingView
                style={[styles.previewOverlay, styles.uploadOverlay]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={insets.top}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                  <View style={[styles.uploadCard, { maxHeight: height * 0.8 }]}>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="interactive"
                      contentContainerStyle={{ paddingBottom: 160 + insets.bottom }}>
                      <View style={styles.uploadHero}>
                        <View style={styles.uploadHeroBadge}>
                          <Text style={styles.uploadHeroBadgeText}>📚</Text>
                        </View>
                        <View style={styles.uploadHeroText}>
                          <Text style={styles.uploadTitle}>독서 기록 업로드</Text>
                          <Text style={styles.uploadSubtitle}>
                            사진과 기록을 한 번에 정리해 공유해요.
                          </Text>
                        </View>
                      </View>

                      <View style={styles.uploadSection}>
                        <View style={styles.uploadHeaderRow}>
                          <Text style={styles.uploadSectionTitle}>사진 선택</Text>
                          <View style={styles.uploadActionsRow}>
                            <Pressable
                              onPress={handlePickPhoto}
                              style={[styles.uploadActionButton, styles.uploadActionPrimary]}
                              accessibilityRole="button">
                              <Text style={[styles.uploadActionText, styles.uploadActionTextPrimary]}>
                                내 사진
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={handleTakePhoto}
                              style={styles.uploadActionButton}
                              accessibilityRole="button">
                              <Text style={styles.uploadActionText}>직접 촬영</Text>
                            </Pressable>
                          </View>
                        </View>
                        <View style={styles.uploadPreviewCard}>
                          {selectedUploadSource ? (
                            <Image
                              source={selectedUploadSource}
                              style={styles.uploadPreview}
                            />
                          ) : (
                            <View style={styles.uploadEmptyState}>
                              <Text style={styles.uploadEmptyTitle}>기록할 사진을 선택하세요</Text>
                              <Text style={styles.uploadEmptyText}>
                                내 사진 또는 직접 촬영으로 업로드할 수 있어요.
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.uploadLabel}>추천 사진</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.uploadGalleryRow}>
                          {gallery.map((item, index) => {
                            const isActive = selectedUploadImage === item;
                            return (
                              <Pressable
                                key={`upload-${index}`}
                                onPress={() => {
                                  setSelectedUploadImage(item);
                                  setSelectedUploadUri(null);
                                }}
                                style={[styles.uploadImageOption, isActive && styles.uploadImageActive]}
                                accessibilityRole="button">
                                <Image source={item} style={styles.uploadImage} />
                                {isActive && (
                                  <View style={styles.uploadImageBadge}>
                                    <Text style={styles.uploadImageBadgeText}>✓</Text>
                                  </View>
                                )}
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>

                      <View style={styles.uploadSection}>
                        <Text style={styles.uploadSectionTitle}>글 작성</Text>
                        <View style={styles.uploadInputCard}>
                          <TextInput
                            value={uploadCaption}
                            onChangeText={setUploadCaption}
                            placeholder="독서 기록을 남겨보세요."
                            placeholderTextColor={Palette.textTertiary}
                            style={styles.uploadInput}
                            multiline
                            maxLength={200}
                          />
                          <View style={styles.uploadMetaRow}>
                            <Text style={styles.uploadHint}>
                              오늘 느낀 점, 인상 깊은 문장을 적어보세요.
                            </Text>
                            <Text style={styles.uploadCount}>
                              {uploadCaption.trim().length}/200
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.uploadActions}>
                        <Pressable
                          style={styles.uploadCancel}
                          onPress={() => setIsUploadOpen(false)}
                          accessibilityRole="button">
                          <Text style={styles.uploadCancelText}>취소</Text>
                        </Pressable>
                        <Pressable
                          style={styles.uploadSubmit}
                          onPress={handleUploadFeed}
                          accessibilityRole="button">
                          <Text style={styles.uploadSubmitText}>업로드</Text>
                        </Pressable>
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </Modal>
          )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  container: {
    padding: 22,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backIcon: {
    fontSize: 26,
    color: Palette.textSecondary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  bookCover: {
    width: 96,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  bookCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookCoverText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
    columnGap: 8,
    marginBottom: 6,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  bookAuthor: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  bookTagInline: {
    backgroundColor: Palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bookTagText: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: Palette.textTertiary,
  },
  infoValue: {
    fontSize: 12,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  memberAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  memberInitial: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  memberCount: {
    marginLeft: 8,
    fontSize: 11,
    color: Palette.textSecondary,
  },
  stampCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  stampHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  stampTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  stampControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekToggle: {
    flexDirection: 'row',
    backgroundColor: Palette.background,
    borderRadius: 999,
    padding: 4,
  },
  weekToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  weekToggleButtonActive: {
    backgroundColor: Palette.surface,
    ...Shadows.card,
  },
  weekToggleText: {
    fontSize: 11,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  weekToggleTextActive: {
    color: Palette.textPrimary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Palette.accentSoft,
  },
  streakLabel: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginRight: 6,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.accent,
  },
  stampLayout: {
    position: 'relative',
    height: 160,
    marginBottom: 8,
  },
  stampItemAbsolute: {
    position: 'absolute',
    alignItems: 'center',
  },
  stampBadge: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  stampBadgeRound: {
    borderRadius: 27,
  },
  stampBadgeSquare: {
    borderRadius: 16,
  },
  stampBadgeActive: {
    opacity: 1,
  },
  stampBadgeInactive: {
    opacity: 0.5,
  },
  stampBadgeToday: {
    borderColor: Palette.accent,
    shadowColor: Palette.accent,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  stampIcon: {
    fontSize: 22,
  },
  stampIconActive: {
    opacity: 1,
  },
  stampIconInactive: {
    opacity: 0.6,
  },
  stampDay: {
    marginTop: 6,
    fontSize: 11,
    color: Palette.textSecondary,
  },
  stampDayToday: {
    color: Palette.accent,
    fontWeight: '600',
  },
  stampNote: {
    marginTop: 6,
    fontSize: 11,
    color: Palette.textTertiary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedHeaderRow: {
    marginBottom: 12,
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonText: {
    color: Palette.textPrimary,
    fontSize: 20,
  },
  sentenceInputCard: {
    marginTop: 12,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sentenceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sentencePageInput: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 10,
    fontSize: 12,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  sentenceAddButton: {
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Palette.accent,
  },
  sentenceAddText: {
    fontSize: 12,
    color: Palette.surface,
    fontWeight: '600',
  },
  sentenceTextInput: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  sentenceCard: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    marginTop: 12,
  },
  pageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pageBadgeText: {
    fontSize: 10,
    color: Palette.textSecondary,
  },
  sentenceText: {
    marginTop: 10,
    fontSize: 13,
    color: Palette.textPrimary,
    lineHeight: 20,
  },
  sentenceMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  sentenceAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  sentenceAvatarText: {
    fontSize: 10,
    color: Palette.textSecondary,
  },
  sentenceName: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  replySection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 10,
  },
  replyRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  replyAvatarText: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  replyBody: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  replyTime: {
    fontSize: 10,
    color: Palette.textTertiary,
  },
  replyText: {
    marginTop: 4,
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  replyEmptyText: {
    fontSize: 12,
    color: Palette.textTertiary,
    marginBottom: 10,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  replyInput: {
    flex: 1,
    fontSize: 12,
    color: Palette.textPrimary,
  },
  replyToggleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Palette.accentSoft,
  },
  replyToggleText: {
    fontSize: 12,
    color: Palette.accent,
    fontWeight: '600',
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 12,
    color: Palette.surface,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryAdd: {
    borderRadius: 16,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  galleryAddText: {
    fontSize: 18,
    color: Palette.textSecondary,
    marginBottom: 6,
  },
  galleryAddLabel: {
    fontSize: 11,
    color: Palette.textTertiary,
  },
  feedUploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.textPrimary,
  },
  feedUploadText: {
    fontSize: 12,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  feedCaption: {
    marginTop: 14,
    fontSize: 14,
    color: Palette.textPrimary,
    lineHeight: 20,
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  likeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  likeButtonText: {
    fontSize: 14,
    color: Palette.accent,
  },
  feedMetaText: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  likeButtonTextActive: {
    color: '#E25555',
  },
  feedCommentList: {
    marginTop: 14,
    marginBottom: 12,
    backgroundColor: Palette.background,
    borderRadius: 16,
    padding: 12,
  },
  uploadCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Palette.surface,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  uploadHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  uploadHeroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadHeroBadgeText: {
    fontSize: 18,
  },
  uploadHeroText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  uploadSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  uploadActionPrimary: {
    backgroundColor: Palette.accentSoft,
    borderColor: 'transparent',
  },
  uploadActionText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  uploadActionTextPrimary: {
    color: Palette.accent,
  },
  uploadPreviewCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    marginBottom: 12,
    aspectRatio: 1,
    overflow: 'hidden',
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadEmptyState: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadEmptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  uploadEmptyText: {
    marginTop: 6,
    fontSize: 12,
    color: Palette.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  uploadLabel: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  uploadGalleryRow: {
    paddingBottom: 4,
  },
  uploadImageOption: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: 10,
    overflow: 'hidden',
  },
  uploadImageActive: {
    borderColor: Palette.accent,
  },
  uploadImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadImageBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageBadgeText: {
    fontSize: 11,
    color: Palette.surface,
    fontWeight: '700',
  },
  uploadInputCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    padding: 12,
  },
  uploadInput: {
    minHeight: 96,
    fontSize: 13,
    color: Palette.textPrimary,
    lineHeight: 19,
  },
  uploadMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadHint: {
    fontSize: 11,
    color: Palette.textTertiary,
  },
  uploadCount: {
    fontSize: 11,
    color: Palette.textTertiary,
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  uploadCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  uploadCancelText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  uploadSubmit: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.accent,
  },
  uploadSubmitText: {
    fontSize: 12,
    color: Palette.surface,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 12,
    color: Palette.textTertiary,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  uploadOverlay: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  previewCard: {
    width: '100%',
    height: '88%',
    maxHeight: '90%',
    borderRadius: 22,
    backgroundColor: Palette.surface,
    padding: 16,
    ...Shadows.card,
  },
  previewScroll: {
    flex: 1,
  },
  previewContent: {
    paddingTop: 10,
    paddingBottom: 16,
  },
  previewCloseIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewCloseIconText: {
    fontSize: 18,
    color: Palette.textSecondary,
    marginTop: -1,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewUserAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  previewUserInitial: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  previewUserMeta: {
    flex: 1,
  },
  previewUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  previewUserTime: {
    marginTop: 2,
    fontSize: 11,
    color: Palette.textTertiary,
  },
  previewImage: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Palette.accentSoft,
    resizeMode: 'cover',
  },
  previewReplyInputRow: {
    marginTop: 4,
  },
  previewSendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  previewSendButtonText: {
    fontSize: 13,
  },
});
