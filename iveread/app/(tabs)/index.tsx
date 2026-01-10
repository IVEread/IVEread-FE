import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';

const readingClubs = [
  {
    id: '1984',
    title: '1984',
    author: '조지 오웰',
    tag: '고전 디스토피아 소설 모임',
    progress: 0.6,
    members: '5명 중 3명 기록 완료',
    cover: require('../../assets/images/icon.png'),
  },
  {
    id: 'sapiens',
    title: '사피엔스',
    author: '유발 하라리',
    tag: '역사와 인류학 토론',
    progress: 0.35,
    members: '6명 중 2명 기록 완료',
    cover: require('../../assets/images/react-logo.png'),
  },
  {
    id: 'gatsby',
    title: '위대한 개츠비',
    author: 'F. 스콧 피츠제럴드',
    tag: '미국 문학 고전 읽기',
    progress: 0.8,
    members: '5명 중 5명 기록 완료',
    cover: require('../../assets/images/partial-react-logo.png'),
  },
];
// 추후 백엔드 연동 후 DB 연결

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
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>I&apos;ve Read</Text>
          <Text style={styles.subtitle}>내가 읽은 것, 우리가 읽은 것</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>진행 중인 교환독서</Text>
          {readingClubs.map((club) => (
            <Link key={club.id} href={`/book/${club.id}`} asChild>
              <Pressable style={styles.card} accessibilityRole="button">
                <Image source={club.cover} style={styles.cardIcon} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{club.title}</Text>
                  <Text style={styles.cardMeta}>{club.author}</Text>
                  <Text style={styles.cardTag}>{club.tag}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${club.progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{club.members}</Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
          <Link href="/create-group" asChild>
            <Pressable style={styles.newClubButton} accessibilityRole="button">
              <Text style={styles.newClubText}>＋ 새 교환독서 만들기</Text>
            </Pressable>
          </Link>
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
  cardMeta: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  cardTag: {
    fontSize: 12,
    color: Palette.textTertiary,
    marginTop: 8,
  },
  progressRow: {
    marginTop: 12,
  },
  progressTrack: {
    height: 5,
    backgroundColor: Palette.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    backgroundColor: Palette.accent,
    borderRadius: 999,
  },
  progressText: {
    ...Typography.caption,
    marginTop: 8,
    color: Palette.textSecondary,
  },
  newClubButton: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Palette.surface,
  },
  newClubText: {
    fontSize: 14,
    color: Palette.accent,
    fontWeight: '600',
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
