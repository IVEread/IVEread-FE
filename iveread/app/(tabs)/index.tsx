import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Shadows, Typography } from '@/constants/ui';
import { useReadingClubs } from '@/contexts/reading-clubs-context';

const completedBooks = [
  {
    id: 'demian',
    title: '데미안',
    date: '2023.11 완독',
    cover: require('../../assets/images/icon.png'),
  },
  {
    id: 'bird',
    title: '어린왕자',
    date: '2023.09 ~ 2023.08',
    cover: require('../../assets/images/react-logo.png'),
  },
  {
    id: 'death',
    title: '총, 균, 쇠',
    date: '2023.10 완독',
    cover: require('../../assets/images/partial-react-logo.png'),
  },
  {
    id: 'cosmos',
    title: '코스모스',
    date: '2023.07 완독',
    cover: require('../../assets/images/splash-icon.png'),
  },
];
// 추후 백엔드 연동 후 DB 연결
export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { clubs } = useReadingClubs();
  const heroIllustration = require('../../assets/images/image-Photoroom 1.png');

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    clubs.forEach((club) => {
      club.tags.forEach((tag) => tagSet.add(tag));
    });
    return ['전체', ...Array.from(tagSet)];
  }, [clubs]);

  const filteredClubs = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const filtered = clubs.filter((club) => {
      const titleMatch = club.title.toLowerCase().includes(keyword);
      const groupMatch = club.groupName.toLowerCase().includes(keyword);
      const tagMatch = selectedTag === '전체' || club.tags.includes(selectedTag);
      return (titleMatch || groupMatch || !keyword) && tagMatch;
    });
    return filtered;
  }, [searchQuery, selectedTag]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.searchLabel}>그룹 또는 책 이름으로 검색</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="예: 월요일 고전 읽기, 1984"
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
              <Text style={styles.searchHint}>검색 결과 {filteredClubs.length}개</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>진행 중인 교환독서</Text>
            <Text style={styles.sectionMeta}>진행 중</Text>
          </View>
          {filteredClubs.map((club) => (
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
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>완독한 책</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.completedRow}>
            {completedBooks.map((book) => (
              <Link key={book.id} href={`/book/${book.id}`} asChild>
                <Pressable style={styles.completedCard} accessibilityRole="button">
                  <Image source={book.cover} style={styles.completedCover} />
                  <View style={styles.completedMeta}>
                    <Text style={styles.completedTitle}>{book.title}</Text>
                    <Text style={styles.completedDate}>{book.date}</Text>
                  </View>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  completedRow: {
    paddingRight: 6,
  },
  completedCard: {
    width: 160,
    height: 220,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  completedCover: {
    flex: 1,
    width: '100%',
    borderRadius: 14,
    backgroundColor: Palette.accentSoft,
    resizeMode: 'cover',
  },
  completedMeta: {
    width: '100%',
    marginTop: 10,
  },
  completedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  completedDate: {
    ...Typography.caption,
    marginTop: 6,
  },
});
