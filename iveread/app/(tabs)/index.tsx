import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Shadows, Typography } from '@/constants/ui';
import { ApiClientError } from '@/services/api-client';
import { getBookByIsbn, searchBooks } from '@/services/books';
import { getFinishedBooks, getGroups, joinGroup, searchGroups } from '@/services/groups';
import type { FinishedGroup, Group } from '@/types/group';

const FALLBACK_AUTHOR = '지은이 정보 없음';
const FALLBACK_PUBLISHER = '출판사 정보 없음';
type LoadState = 'loading' | 'success' | 'error';
type FinishedLoadState = LoadState;
type SearchState = 'idle' | LoadState;

type GroupCard = {
  id: string;
  groupName: string;
  title: string;
  author: string;
  tag: string;
  tags: string[];
  lastActive: string;
  cover: ImageSourcePropType;
  memberCount: number;
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

const mapGroupToCard = async (
  group: Group,
  options: { enrich?: boolean } = {},
): Promise<GroupCard> => {
  const shouldEnrich = options.enrich !== false;
  let author = FALLBACK_AUTHOR;
  let tag = FALLBACK_PUBLISHER;
  let tags: string[] = [];
  let cover: ImageSourcePropType = { uri: group.bookCover };

  if (shouldEnrich) {
    try {
      const book = await getBookByIsbn(group.bookIsbn);
      author = book.author || FALLBACK_AUTHOR;
      tag = book.publisher || FALLBACK_PUBLISHER;
      tags = book.publisher ? [book.publisher] : [];
      if (book.coverImage) {
        cover = { uri: book.coverImage };
      }
    } catch {
      try {
        const search = await searchBooks(group.bookTitle, 1, 1);
        const book = search.items[0];
        if (book) {
          author = book.author || FALLBACK_AUTHOR;
          tag = book.publisher || FALLBACK_PUBLISHER;
          tags = book.publisher ? [book.publisher] : [];
          if (book.coverImage) {
            cover = { uri: book.coverImage };
          }
        }
      } catch {
        // ignore search errors; fallback to group data only
      }
    }
  }

  return {
    id: group.id,
    groupName: group.name,
    title: group.bookTitle,
    author,
    tag,
    tags,
    lastActive: formatRelativeTime(String(group.createdAt)),
    cover,
    memberCount: group.memberCount,
  };
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

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [groupCards, setGroupCards] = useState<GroupCard[]>([]);
  const [groupStatus, setGroupStatus] = useState<LoadState>('loading');
  const [groupError, setGroupError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GroupCard[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [joiningGroupIds, setJoiningGroupIds] = useState<string[]>([]);
  const [finishedBooks, setFinishedBooks] = useState<FinishedGroup[]>([]);
  const [finishedStatus, setFinishedStatus] = useState<FinishedLoadState>('loading');
  const [finishedError, setFinishedError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const heroIllustration = require('../../assets/images/image-Photoroom1.png');

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    groupCards.forEach((club) => {
      club.tags.forEach((tag) => tagSet.add(tag));
    });
    return ['전체', ...Array.from(tagSet)];
  }, [groupCards]);

  const finishedGroupIds = useMemo(
    () => new Set(finishedBooks.map((item) => item.groupId)),
    [finishedBooks],
  );

  const filteredClubs = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const filtered = groupCards.filter((club) => {
      if (finishedGroupIds.has(club.id)) return false;
      const titleMatch = club.title.toLowerCase().includes(keyword);
      const groupMatch = club.groupName.toLowerCase().includes(keyword);
      const tagMatch = selectedTag === '전체' || club.tags.includes(selectedTag);
      return (titleMatch || groupMatch || !keyword) && tagMatch;
    });
    return filtered;
  }, [finishedGroupIds, groupCards, searchQuery, selectedTag]);

  const loadGroups = useCallback(async (isActiveRef?: { current: boolean }) => {
    setGroupStatus('loading');
    setGroupError(null);
    try {
      const groups = await getGroups();
      const cards = await Promise.all(groups.map((group) => mapGroupToCard(group)));
      if (isActiveRef && !isActiveRef.current) return;
      setGroupCards(cards);
      setGroupStatus('success');
    } catch (error) {
      if (isActiveRef && !isActiveRef.current) return;
      setGroupCards([]);
      setGroupStatus('error');
      setGroupError(getErrorMessage(error, '교환독서 목록을 불러오지 못했어요.'));
    }
  }, []);

  const loadFinishedBooks = useCallback(async (isActiveRef?: { current: boolean }) => {
    setFinishedStatus('loading');
    setFinishedError(null);
    try {
      const books = await getFinishedBooks();
      if (isActiveRef && !isActiveRef.current) return;
      setFinishedBooks(books);
      setFinishedStatus('success');
    } catch (error) {
      if (isActiveRef && !isActiveRef.current) return;
      setFinishedBooks([]);
      setFinishedStatus('error');
      setFinishedError(getErrorMessage(error, '완독한 책을 불러오지 못했어요.'));
    }
  }, []);

  useEffect(() => {
    const isActive = { current: true };
    loadGroups(isActive);
    loadFinishedBooks(isActive);
    return () => {
      isActive.current = false;
    };
  }, [loadFinishedBooks, loadGroups]);

  useFocusEffect(
    useCallback(() => {
      const isActive = { current: true };
      loadFinishedBooks(isActive);
      return () => {
        isActive.current = false;
      };
    }, [loadFinishedBooks]),
  );

  useEffect(() => {
    if (selectedTag !== '전체' && !tagOptions.includes(selectedTag)) {
      setSelectedTag('전체');
    }
  }, [selectedTag, tagOptions]);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchResults([]);
      setSearchStatus('idle');
      setSearchError(null);
      return;
    }

    const keyword = searchQuery.trim();
    if (!keyword) {
      setSearchResults([]);
      setSearchStatus('idle');
      setSearchError(null);
      return;
    }

    let isActive = true;
    setSearchStatus('loading');
    setSearchError(null);
    const debounceId = setTimeout(() => {
      searchGroups(keyword)
        .then((groups) => Promise.all(groups.map((group) => mapGroupToCard(group, { enrich: false }))))
        .then((cards) => {
          if (!isActive) return;
          setSearchResults(cards);
          setSearchStatus('success');
        })
        .catch((error) => {
          if (!isActive) return;
          setSearchResults([]);
          setSearchStatus('error');
          setSearchError(getErrorMessage(error, '검색 결과를 불러오지 못했어요.'));
        });
    }, 400);

    return () => {
      isActive = false;
      clearTimeout(debounceId);
    };
  }, [isSearchOpen, searchQuery]);

  const handleJoinGroup = useCallback(
    async (groupId: string) => {
      if (joiningGroupIds.includes(groupId)) return;
      setJoiningGroupIds((prev) => [...prev, groupId]);
      try {
        await joinGroup(groupId);
        setSearchResults((prev) => prev.filter((group) => group.id !== groupId));
        await loadGroups();
        Alert.alert('안내', '그룹에 가입했어요.');
      } catch (error) {
        Alert.alert('안내', getErrorMessage(error, '그룹 가입에 실패했어요.'));
      } finally {
        setJoiningGroupIds((prev) => prev.filter((id) => id !== groupId));
      }
    },
    [joiningGroupIds, loadGroups],
  );
  const contentContainerStyle = useMemo(
    () => [styles.container, { paddingBottom: 140 + insets.bottom }],
    [insets.bottom],
  );
  const trimmedQuery = searchQuery.trim();

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>I&apos;ve Read</Text>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setIsSearchOpen((prev) => !prev)}
                style={styles.headerIconButton}
                accessibilityRole="button">
                <IconSymbol
                  name="magnifyingglass"
                  size={20}
                  color={isSearchOpen ? Palette.accent : Palette.textSecondary}
                />
              </Pressable>
              <Link href="/create-group" asChild>
                <Pressable style={styles.headerIconButton} accessibilityRole="button">
                  <IconSymbol name="plus" size={20} color={Palette.textSecondary} />
                </Pressable>
              </Link>
            </View>
          </View>
          <Text style={styles.subtitle}>내가 읽은 것, 우리가 읽은 것</Text>
        </View>

        <Image source={heroIllustration} style={styles.heroIllustration} />

        {isSearchOpen && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>교환독서 검색</Text>
            <View style={styles.searchCard}>
              <Text style={styles.searchLabel}>그룹 이름으로 검색</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="예: 월요일 고전 읽기"
                placeholderTextColor={Palette.textTertiary}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagRow}>
                {tagOptions.map((tag) => {
                  const isActive = tag === selectedTag;
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => setSelectedTag(tag)}
                      style={[styles.tagChip, isActive && styles.tagChipActive]}>
                      <Text style={[styles.tagText, isActive && styles.tagTextActive]}>{tag}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={styles.searchHint}>
                {groupStatus === 'loading'
                  ? '진행 중 교환독서 불러오는 중'
                  : `진행 중 ${filteredClubs.length}개`}
              </Text>
            </View>

            <View style={styles.searchResultsSection}>
              <Text style={styles.searchResultsTitle}>가입 가능한 교환독서</Text>
              {!trimmedQuery ? (
                <Text style={styles.searchResultEmpty}>
                  검색어를 입력하면 가입 가능한 그룹을 보여드려요.
                </Text>
              ) : searchStatus === 'loading' ? (
                <Text style={styles.searchResultEmpty}>검색 중...</Text>
              ) : searchStatus === 'error' ? (
                <Text style={styles.searchResultEmpty}>
                  {searchError ?? '검색 결과를 불러올 수 없어요.'}
                </Text>
              ) : searchResults.length === 0 ? (
                <Text style={styles.searchResultEmpty}>검색 결과가 없어요.</Text>
              ) : (
                searchResults.map((club) => {
                  const isJoining = joiningGroupIds.includes(club.id);
                  return (
                    <View key={club.id} style={styles.searchResultCard}>
                      <Image source={club.cover} style={styles.searchResultCover} />
                      <View style={styles.searchResultBody}>
                        <Text style={styles.searchResultTitle}>{club.title}</Text>
                        <Text style={styles.searchResultMeta}>
                          {club.groupName} · {club.memberCount}명 참여
                        </Text>
                        <Text style={styles.searchResultMeta}>{club.author}</Text>
                        <Text style={styles.searchResultTag}>{club.tag}</Text>
                      </View>
                      <Pressable
                        onPress={() => handleJoinGroup(club.id)}
                        style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                        accessibilityRole="button"
                        disabled={isJoining}>
                        <Text
                          style={[
                            styles.joinButtonText,
                            isJoining && styles.joinButtonTextDisabled,
                          ]}>
                          {isJoining ? '가입 중' : '가입'}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>진행 중인 교환독서</Text>
            <Text style={styles.sectionMeta}>진행 중</Text>
          </View>
          {groupStatus === 'loading' ? (
            <Text style={styles.emptyText}>교환독서를 불러오는 중...</Text>
          ) : groupStatus === 'error' ? (
            <Text style={styles.emptyText}>
              {groupError ?? '교환독서를 불러올 수 없어요.'}
            </Text>
          ) : filteredClubs.length === 0 ? (
            <Text style={styles.emptyText}>진행 중인 교환독서가 없어요.</Text>
          ) : (
            filteredClubs.map((club) => (
              <Link key={club.id} href={`/book/${club.id}`} asChild>
                <Pressable style={styles.card} accessibilityRole="button">
                  <Image source={club.cover} style={styles.cardIcon} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{club.title}</Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardMeta}>{club.groupName}</Text>
                      <Text style={styles.cardMetaDivider}>·</Text>
                      <Text style={styles.cardMeta}>{club.lastActive}</Text>
                    </View>
                    <Text style={styles.cardMeta}>{club.author}</Text>
                    <Text style={styles.cardTag}>{club.tag}</Text>
                    <View style={styles.cardTagRow}>
                      {club.tags.map((tag) => (
                        <View key={tag} style={styles.cardTagChip}>
                          <Text style={styles.cardTagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>완독한 책</Text>
            <Text style={styles.sectionMeta}>완독</Text>
          </View>
          {finishedStatus === 'loading' ? (
            <Text style={styles.emptyText}>완독한 책을 불러오는 중...</Text>
          ) : finishedStatus === 'error' ? (
            <Text style={styles.emptyText}>
              {finishedError ?? '완독한 책을 불러올 수 없어요.'}
            </Text>
          ) : finishedBooks.length === 0 ? (
            <Text style={styles.emptyText}>아직 완독한 책이 없어요.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.finishedRow}>
              {finishedBooks.map((item) => {
                const finishedAt = formatDisplayDate(item.finishedAt);
                return (
                  <Link key={item.id} href={`/book/${item.groupId}`} asChild>
                    <Pressable style={styles.finishedCard} accessibilityRole="button">
                      <View style={styles.finishedCoverFrame}>
                        {item.bookCoverImage ? (
                          <Image
                            source={{ uri: item.bookCoverImage }}
                            style={styles.finishedCover}
                          />
                        ) : (
                          <View style={styles.finishedCoverFallback}>
                            <Text style={styles.finishedCoverText}>📖</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.finishedBody}>
                        <Text style={styles.finishedTitle}>{item.bookTitle}</Text>
                        <Text style={styles.finishedDate}>
                          {finishedAt ? `${finishedAt} 완독` : ''}
                        </Text>
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </ScrollView>
          )}
        </View>

          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
  },
  heroIllustration: {
    width: '100%',
    height: 170,
    borderRadius: 18,
    marginBottom: 18,
    resizeMode: 'contain',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  eyebrow: {
    fontSize: 12,
    color: Palette.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.subtitle,
    marginTop: 6,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionMeta: {
    fontSize: 12,
    color: Palette.textTertiary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 12,
    color: Palette.textTertiary,
  },
  searchCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  searchLabel: {
    fontSize: 12,
    color: Palette.textTertiary,
    marginBottom: 10,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  searchHint: {
    marginTop: 10,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  searchResultsSection: {
    marginTop: 16,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 10,
  },
  searchResultEmpty: {
    fontSize: 12,
    color: Palette.textTertiary,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  searchResultCover: {
    width: 46,
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: Palette.accentSoft,
    marginRight: 12,
    resizeMode: 'cover',
  },
  searchResultBody: {
    flex: 1,
    marginRight: 12,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  searchResultMeta: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  searchResultTag: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginTop: 6,
  },
  joinButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.accent,
  },
  joinButtonDisabled: {
    backgroundColor: Palette.border,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  joinButtonTextDisabled: {
    color: Palette.textTertiary,
  },
  tagRow: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.background,
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: Palette.accentSoft,
    borderColor: Palette.accent,
  },
  tagText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  tagTextActive: {
    color: Palette.accent,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  cardIcon: {
    width: 54,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: Palette.accentSoft,
    marginRight: 12,
    resizeMode: 'cover',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  cardMetaDivider: {
    marginHorizontal: 6,
    fontSize: 12,
    color: Palette.textTertiary,
  },
  cardTag: {
    fontSize: 12,
    color: Palette.textTertiary,
    marginTop: 8,
  },
  cardTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cardTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Palette.accentSoft,
    marginRight: 6,
    marginBottom: 6,
  },
  cardTagText: {
    fontSize: 11,
    color: Palette.accent,
  },
  finishedRow: {
    paddingRight: 12,
  },
  finishedCard: {
    width: 150,
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    ...Shadows.card,
  },
  finishedCoverFrame: {
    height: 120,
    borderRadius: 18,
    backgroundColor: '#F2F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  finishedCover: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    resizeMode: 'contain',
  },
  finishedCoverFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedCoverText: {
    fontSize: 24,
    color: Palette.textSecondary,
  },
  finishedBody: {
    gap: 6,
  },
  finishedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  finishedDate: {
    fontSize: 9,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
});
