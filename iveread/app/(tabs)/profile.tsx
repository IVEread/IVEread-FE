import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { useProfile } from '@/contexts/profile-context';

const profileSections = [
  { id: 'profile', title: '프로필', detail: '내 정보 수정 및 공개 범위' },
  { id: 'friends', title: '친구 목록', detail: '함께 읽는 친구들 보기' },
  { id: 'insights', title: '독서 인사이트', detail: '기록 기반 요약 리포트' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const avatarLabel = profile.emoji || (profile.nickname ? profile.nickname.slice(0, 1) : '?');

  const emojiCategories = useMemo(
    () => [
      {
        title: '책',
        items: [
          '📚',
          '📖',
          '📘',
          '📗',
          '📕',
          '📙',
          '📓',
          '📔',
          '📒',
          '📑',
          '🗂️',
          '📝',
          '📃',
          '📄',
          '📜',
        ],
      },
      {
        title: '무드',
        items: [
          '😊',
          '😄',
          '😌',
          '🤓',
          '🧐',
          '🥳',
          '🤔',
          '😴',
          '😮',
          '😅',
          '😇',
          '🥰',
          '🙂',
          '🙃',
          '😎',
        ],
      },
      {
        title: '아이콘',
        items: [
          '✨',
          '🌟',
          '🌙',
          '☀️',
          '⭐️',
          '🔥',
          '💡',
          '🎧',
          '🎵',
          '🎯',
          '🧠',
          '🧩',
          '🕯️',
          '🎈',
          '🎁',
        ],
      },
      {
        title: '자연',
        items: [
          '🌿',
          '🍀',
          '🌸',
          '🌼',
          '🌻',
          '🍃',
          '🌲',
          '🌵',
          '🌈',
          '🌊',
          '⛰️',
          '🍁',
          '🍂',
          '🌧️',
          '❄️',
        ],
      },
      {
        title: '기록',
        items: [
          '🖊️',
          '✒️',
          '✏️',
          '🗒️',
          '📌',
          '📎',
          '📍',
          '📅',
          '🗓️',
          '✅',
          '📊',
          '📈',
          '🧾',
          '🗃️',
          '📏',
        ],
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{avatarLabel}</Text>
            <Pressable
              style={styles.avatarEditButton}
              onPress={() => setIsEmojiPickerOpen(true)}
              accessibilityRole="button">
              <Text style={styles.avatarEditIcon}>✏️</Text>
            </Pressable>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.nickname}</Text>
            <Text style={styles.profileMeta}>오늘도 한 페이지, 꾸준한 독서 중</Text>
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>18</Text>
                <Text style={styles.statLabel}>기록</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>6</Text>
                <Text style={styles.statLabel}>완독</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>친구</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 정보</Text>
          {profileSections.map((section) => {
            const isProfile = section.id === 'profile';
            const isFriends = section.id === 'friends';
            return (
              <Pressable
                key={section.id}
                style={styles.sectionCard}
                onPress={() => {
                  if (isProfile) {
                    router.push('/profile-edit');
                    return;
                  }
                  if (isFriends) {
                    router.push('/friends');
                  }
                }}
                accessibilityRole={isProfile || isFriends ? 'button' : undefined}>
                <View>
                  <Text style={styles.sectionCardTitle}>{section.title}</Text>
                  <Text style={styles.sectionCardDetail}>{section.detail}</Text>
                </View>
                <Text style={styles.sectionCardArrow}>›</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={() => router.replace('/login')}
          accessibilityRole="button">
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={isEmojiPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEmojiPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsEmojiPickerOpen(false)}>
          <Pressable style={styles.emojiSheet} onPress={() => {}} accessibilityRole="menu">
            <SafeAreaView style={styles.emojiSheetContent} edges={['top', 'bottom']}>
              <View style={styles.emojiHeader}>
                <Pressable
                  onPress={() => setIsEmojiPickerOpen(false)}
                  style={styles.emojiBackButton}
                  accessibilityRole="button">
                  <Text style={styles.emojiBack}>뒤로</Text>
                </Pressable>
                <Text style={styles.emojiTitle}>이모티콘 변경</Text>
                <View style={styles.emojiHeaderSpacer} />
              </View>
              <ScrollView
                contentContainerStyle={styles.emojiScrollContent}
                showsVerticalScrollIndicator={false}>
                {emojiCategories.map((category) => (
                  <View key={category.title} style={styles.emojiSection}>
                    <Text style={styles.emojiSectionTitle}>{category.title}</Text>
                    <View style={styles.emojiGrid}>
                      {category.items.map((emoji) => (
                        <Pressable
                          key={emoji}
                          style={[
                            styles.emojiOption,
                            profile.emoji === emoji && styles.emojiOptionActive,
                          ]}
                          onPress={() => {
                            updateProfile({ emoji });
                            setIsEmojiPickerOpen(false);
                          }}
                          accessibilityRole="button">
                          <Text style={styles.emojiOptionText}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textSecondary,
    letterSpacing: 1,
  },
  avatarEditButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  profileMeta: {
    ...Typography.caption,
    marginTop: 4,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statItem: {
    marginRight: 16,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.accent,
  },
  statLabel: {
    ...Typography.caption,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    marginBottom: 10,
  },
  sectionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 12,
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  sectionCardDetail: {
    ...Typography.caption,
    marginTop: 4,
  },
  sectionCardArrow: {
    fontSize: 20,
    color: Palette.textTertiary,
  },
  logoutButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D65C5C',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D65C5C',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  emojiSheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  emojiSheetContent: {
    backgroundColor: Palette.surface,
  },
  emojiHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  emojiTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  emojiBackButton: {
    minWidth: 48,
    height: 36,
    justifyContent: 'center',
  },
  emojiBack: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  emojiHeaderSpacer: {
    minWidth: 48,
    height: 36,
  },
  emojiScrollContent: {
    padding: 18,
    paddingBottom: 52,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  emojiSection: {
    marginBottom: 16,
  },
  emojiSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginBottom: 10,
  },
  emojiOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  emojiOptionActive: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accentSoft,
  },
  emojiOptionText: {
    fontSize: 24,
  },
});
