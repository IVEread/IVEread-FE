import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { useCalendarRecords } from '@/contexts/calendar-context';
import { useProfile } from '@/contexts/profile-context';

const baseMembers = [
  { id: 'jimin', name: '지민', emoji: '🧑‍🎓' },
  { id: 'sejun', name: '서준', emoji: '👩‍💻' },
  { id: 'sua', name: '수아', emoji: '🧑‍🎨' },
  { id: 'minho', name: '민호', emoji: '👨‍🔬' },
] as const;
// 추후 백엔드 연동 후 DB 연결

type MemberId = 'me' | (typeof baseMembers)[number]['id'];
type Member = { id: MemberId; name: string; emoji: string };

export default function CalendarScreen() {
  const router = useRouter();
  const { recordsByOwner, addReaction } = useCalendarRecords();
  const { profile } = useProfile();
  const [selectedMemberId, setSelectedMemberId] = useState<MemberId>('me');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(3);
  const [reactionFriendIndex, setReactionFriendIndex] = useState(0);
  const members = useMemo<Member[]>(
    () => [
      {
        id: 'me',
        name: '나',
        emoji: profile.emoji || (profile.nickname ? profile.nickname.slice(0, 1) : '😊'),
      },
      ...baseMembers,
    ],
    [profile.emoji, profile.nickname]
  );
  const reactionFriends = useMemo(() => baseMembers, []);
  const reactionOptions = useMemo(() => ['👏', '😍', '🔥', '✨', '👍', '🥳'], []);

  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = new Date(year, monthIndex, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;
  const todayDate = isCurrentMonth ? today.getDate() : null;

  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return { key: `empty-${index}`, day: null };
    }
    return { key: `day-${dayNumber}`, day: dayNumber };
  });

  const selectedDateKey = selectedDay
    ? `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const recordsForMember = recordsByOwner[selectedMemberId] ?? {};
  const selectedEntry = selectedDateKey ? recordsForMember[selectedDateKey] : null;
  const monthLabel = `${year}년 ${monthIndex + 1}월`;

  const moveMonth = (direction: 'prev' | 'next') => {
    const nextMonth = direction === 'prev' ? monthIndex - 1 : monthIndex + 1;
    setCurrentMonth(new Date(year, nextMonth, 1));
    setSelectedDay(null);
  };

  const readingCount = useMemo(() => {
    const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
    return Object.keys(recordsForMember).filter((key) => key.startsWith(monthPrefix)).length;
  }, [recordsForMember, year, monthIndex]);

  const uniqueBookCount = useMemo(() => {
    const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
    const titles = new Set(
      Object.entries(recordsForMember)
        .filter(([key]) => key.startsWith(monthPrefix))
        .map(([, record]) => record.title)
        .filter(Boolean)
    );
    return titles.size;
  }, [recordsForMember, year, monthIndex]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>읽기 캘린더</Text>
          {selectedMemberId === 'me' && (
            <Pressable
              style={styles.addButton}
              onPress={() => {
                if (!selectedDay) {
                  Alert.alert('안내', '기록할 날짜를 먼저 선택해 주세요.');
                  return;
                }
                const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
                  selectedDay
                ).padStart(2, '0')}`;
                router.push({
                  pathname: '/add-record',
                  params: { date: dateKey, ownerId: selectedMemberId },
                });
              }}
              accessibilityRole="button">
              <Text style={styles.addButtonText}>＋</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberRow}>
          {members.map((member) => {
            const isActive = member.id === selectedMemberId;
            return (
              <Pressable
                key={member.id}
                onPress={() => setSelectedMemberId(member.id)}
                style={styles.memberItem}
                accessibilityRole="button">
                <View
                  style={[
                    styles.memberAvatar,
                    isActive && styles.memberAvatarActive,
                    !isActive && styles.memberAvatarInactive,
                  ]}>
                  <Text style={[styles.memberInitial, isActive && styles.memberInitialActive]}>
                    {member.emoji}
                  </Text>
                </View>
                <Text style={[styles.memberName, isActive && styles.memberNameActive]}>
                  {member.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.monthRow}>
          <Pressable
            onPress={() => moveMonth('prev')}
            accessibilityRole="button"
            style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{monthLabel}</Text>
          <Pressable
            onPress={() => moveMonth('next')}
            accessibilityRole="button"
            style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
            <Text key={label} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarCells.map((cell) => {
            if (!cell.day) {
              return <View key={cell.key} style={styles.dayCell} pointerEvents="none" />;
            }
            const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(
              cell.day
            ).padStart(2, '0')}`;
            const entry = recordsForMember[dateKey];
            const isSelected = cell.day === selectedDay;
            const isToday = todayDate === cell.day;
            return (
              <Pressable
                key={cell.key}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                ]}
                onPress={() => setSelectedDay(cell.day)}
                accessibilityRole="button">
                <View style={styles.dayHeader}>
                  {isToday ? (
                    <View style={styles.todayCircle}>
                      <Text
                        style={[
                          styles.dayText,
                          styles.dayTextToday,
                          isSelected && styles.dayTextSelected,
                        ]}>
                        {cell.day}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {cell.day}
                    </Text>
                  )}
                </View>
                <View style={styles.dayContent}>
                  {entry ? (
                    <Image source={entry.cover} style={styles.dayCover} />
                  ) : (
                    <View style={styles.emptyBadge} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>
            {selectedDay ? `${monthIndex + 1}월 ${selectedDay}일` : '날짜를 선택해 주세요'}
          </Text>
          {selectedEntry ? (
            <View style={styles.detailContent}>
              <Text style={styles.detailBook}>{selectedEntry.title}</Text>
              <Text style={styles.detailNote}>{selectedEntry.note}</Text>
              <View style={styles.reactionSection}>
                <Text style={styles.reactionTitle}>친구 반응</Text>
                {(selectedEntry.reactions ?? []).length > 0 ? (
                  <View style={styles.reactionList}>
                    {(selectedEntry.reactions ?? []).map((reaction) => (
                      <View key={reaction.id} style={styles.reactionChip}>
                        <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                        <Text style={styles.reactionName}>{reaction.name}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.reactionEmpty}>아직 반응이 없어요.</Text>
                )}
                <View style={styles.reactionButtons}>
                  {reactionOptions.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => {
                        if (!selectedDateKey) return;
                        if (selectedMemberId === 'me') {
                          addReaction(selectedMemberId, selectedDateKey, {
                            id: `${selectedDateKey}-${Date.now()}`,
                            emoji,
                            name: profile.nickname || '나',
                          });
                        } else {
                          addReaction(selectedMemberId, selectedDateKey, {
                            id: `${selectedDateKey}-${Date.now()}`,
                            emoji,
                            name: profile.nickname || '나',
                          });
                        }
                      }}
                      style={styles.reactionButton}
                      accessibilityRole="button">
                      <Text style={styles.reactionButtonText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.detailEmpty}>선택한 날짜에 기록이 없어요.</Text>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>이번 달 기록</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{readingCount}</Text>
                <Text style={styles.summaryLabel}>기록한 날</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>
                  {uniqueBookCount}
                </Text>
                <Text style={styles.summaryLabel}>참여한 책</Text>
              </View>
            </View>
          </View>
          <Text style={styles.summaryMonth}>{monthIndex + 1}월</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  addButtonText: {
    fontSize: 26,
    color: Palette.textSecondary,
  },
  memberRow: {
    paddingVertical: 2,
    paddingRight: 6,
    marginBottom: 22,
  },
  memberItem: {
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  memberAvatarInactive: {
    borderWidth: 1,
    borderColor: Palette.border,
  },
  memberAvatarActive: {
    borderWidth: 2,
    borderColor: Palette.accent,
    backgroundColor: Palette.accentSoft,
  },
  memberInitial: {
    fontSize: 18,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  memberInitialActive: {
    color: Palette.textPrimary,
  },
  memberName: {
    fontSize: 11,
    color: Palette.textTertiary,
  },
  memberNameActive: {
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  monthNavText: {
    fontSize: 22,
    color: Palette.textTertiary,
    fontWeight: '700',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 12,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
    borderRadius: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  dayHeader: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  dayCellSelected: {
    backgroundColor: Palette.accentSoft,
  },
  dayText: {
    color: Palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  dayTextToday: {
    color: Palette.accent,
  },
  todayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentSoft,
  },
  dayTextSelected: {
    color: Palette.accent,
    fontWeight: '600',
  },
  dayPlaceholder: {
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.border,
    opacity: 0.6,
  },
  dayCover: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: Palette.surface,
  },
  emptyBadge: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.border,
    opacity: 0.5,
  },
  detailCard: {
    marginTop: 14,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  detailContent: {
    marginTop: 10,
  },
  detailBook: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  detailNote: {
    marginTop: 6,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  reactionSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  reactionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  reactionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  reactionName: {
    fontSize: 11,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  reactionEmpty: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginBottom: 10,
  },
  reactionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentSoft,
  },
  reactionButtonText: {
    fontSize: 16,
  },
  detailEmpty: {
    marginTop: 8,
    fontSize: 12,
    color: Palette.textTertiary,
  },
  summaryCard: {
    marginTop: 28,
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: 10,
  },
  summaryItem: {
    marginRight: 18,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  summaryLabel: {
    ...Typography.caption,
  },
  summaryMonth: {
    fontSize: 12,
    color: Palette.textTertiary,
  },
});
