import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { getPersonEmoji } from '@/constants/people';
import { useFriends } from '@/contexts/friends-context';
import { useProfile } from '@/contexts/profile-context';
import { ApiClientError } from '@/services/api-client';

export default function FriendsScreen() {
  const router = useRouter();
  const { friends, status, error, refreshFriends, addFriend, removeFriend } = useFriends();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  const [newFriend, setNewFriend] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [isCopied, setIsCopied] = useState(false);
  const friendsIllustration = require('../assets/images/image-Photoroom3.png');
  const contentContainerStyle = useMemo(
    () => [styles.container, { paddingBottom: 160 + insets.bottom }],
    [insets.bottom],
  );

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof ApiClientError) {
      return err.message || fallback;
    }
    if (err instanceof Error) {
      return err.message || fallback;
    }
    return fallback;
  };

  const handleAddFriend = async () => {
    const trimmed = newFriend.trim();
    if (!trimmed) {
      Alert.alert('안내', '추가할 친구 ID 또는 이메일을 입력해 주세요.');
      return;
    }
    try {
      setIsAdding(true);
      await addFriend(trimmed);
      setNewFriend('');
    } catch (err) {
      if (err instanceof ApiClientError && (err.status === 404 || err.code === 'USER_NOT_FOUND')) {
        Alert.alert('안내', '존재하지 않는 친구 ID예요. ID를 확인해 주세요.');
      } else {
        Alert.alert('안내', getErrorMessage(err, '친구 추가에 실패했어요.'));
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleCopyId = async () => {
    if (!profile.id) return;
    try {
      await Clipboard.setStringAsync(profile.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1200);
    } catch {
      Alert.alert('안내', '복사에 실패했어요.');
    }
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    Alert.alert('친구 삭제', `${name}님을 친구 목록에서 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setRemovingIds((prev) => new Set(prev).add(friendId));
          try {
            await removeFriend(friendId);
          } catch (err) {
            Alert.alert('안내', getErrorMessage(err, '친구 삭제에 실패했어요.'));
          } finally {
            setRemovingIds((prev) => {
              const next = new Set(prev);
              next.delete(friendId);
              return next;
            });
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.safeArea}>
          <Stack.Screen options={{ headerShown: false }} />
          <ScrollView
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button">
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>친구 목록</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.addRow}>
          <View style={styles.myIdCard}>
            <Text style={styles.myIdLabel}>내 ID</Text>
            <View style={styles.myIdRow}>
              <Text style={styles.myIdValue}>{profile.id || '불러오는 중...'}</Text>
              <Pressable
                style={styles.copyButton}
                onPress={handleCopyId}
                accessibilityRole="button"
                disabled={!profile.id}>
                <Text style={styles.copyButtonText}>{isCopied ? '복사됨' : '복사'}</Text>
              </Pressable>
            </View>
          </View>
            <Text style={styles.label}>친구 추가</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={newFriend}
                onChangeText={setNewFriend}
                placeholder="친구 ID 또는 이메일"
                placeholderTextColor={Palette.textTertiary}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleAddFriend}
                editable={!isAdding}
              />
            <Pressable
              style={styles.addAction}
              onPress={handleAddFriend}
              disabled={isAdding}
              accessibilityRole="button">
              <Text style={styles.addActionText}>{isAdding ? '추가 중' : '추가'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.illustrationCard}>
          <Image source={friendsIllustration} style={styles.illustrationImage} />
        </View>

        <View style={styles.list}>
          {status === 'loading' && (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>불러오는 중…</Text>
              <Text style={styles.stateMessage}>친구 목록을 가져오고 있어요.</Text>
            </View>
          )}
          {status === 'error' && (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>불러오기 실패</Text>
              <Text style={styles.stateMessage}>{error ?? '친구 목록을 불러오지 못했어요.'}</Text>
              <Pressable
                style={styles.stateAction}
                onPress={refreshFriends}
                accessibilityRole="button">
                <Text style={styles.stateActionText}>다시 시도</Text>
              </Pressable>
            </View>
          )}
          {status === 'success' && friends.length === 0 && (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>아직 친구가 없어요</Text>
              <Text style={styles.stateMessage}>이메일로 친구를 추가해 보세요.</Text>
            </View>
          )}
          {status === 'success' &&
            friends.map((friend) => {
              const displayName = friend.nickname?.trim() || friend.email || '친구';
              const avatarEmoji = friend.userProfileEmoji || getPersonEmoji(displayName);
              const isRemoving = Boolean(friend.id && removingIds.has(friend.id));
              return (
                <View key={friend.id ?? friend.email} style={styles.friendCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{avatarEmoji}</Text>
                  </View>
                  <View style={styles.friendBody}>
                    <Text style={styles.friendName}>{displayName}</Text>
                    <Text style={styles.friendMeta}>{friend.email}</Text>
                  </View>
                  {friend.id ? (
                    <Pressable
                      style={[styles.removeButton, isRemoving && styles.removeButtonDisabled]}
                      onPress={() => handleRemoveFriend(friend.id, displayName)}
                      accessibilityRole="button"
                      disabled={isRemoving}>
                      <Text style={styles.removeButtonText}>
                        {isRemoving ? '삭제 중' : '삭제'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
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
    paddingBottom: 120,
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
    borderWidth: 0,
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
  addRow: {
    marginBottom: 20,
  },
  myIdCard: {
    backgroundColor: Palette.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 10,
  },
  myIdLabel: {
    fontSize: 11,
    color: Palette.textTertiary,
    marginBottom: 4,
  },
  myIdValue: {
    fontSize: 12,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  myIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  copyButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Palette.accentSoft,
  },
  copyButtonText: {
    fontSize: 11,
    color: Palette.textSecondary,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Palette.textPrimary,
    backgroundColor: Palette.surface,
  },
  addAction: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Palette.accent,
    ...Shadows.card,
  },
  addActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.surface,
  },
  list: {
    gap: 12,
  },
  stateCard: {
    backgroundColor: Palette.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 6,
  },
  stateMessage: {
    ...Typography.caption,
  },
  stateAction: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Palette.accent,
  },
  stateActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.surface,
  },
  illustrationCard: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 10,
  },
  illustrationImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    borderRadius: 14,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  friendMeta: {
    ...Typography.caption,
    marginTop: 4,
  },
  friendBody: {
    flex: 1,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Palette.accentSoft,
  },
  removeButtonDisabled: {
    opacity: 0.6,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
});
