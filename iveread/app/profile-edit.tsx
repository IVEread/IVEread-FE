import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
  UIManager,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { Palette, Shadows } from '@/constants/ui';
import { useProfile } from '@/contexts/profile-context';
import { ApiClientError } from '@/services/api-client';
import { getMe, updateMe } from '@/services/users';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiClientError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useProfile();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<React.RefObject<TextInput | null> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const nicknameRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const passwordConfirmRef = useRef<TextInput | null>(null);

  const scrollToInput = useCallback((inputRef: React.RefObject<TextInput | null>) => {
    const scrollView = scrollViewRef.current;
    const input = inputRef.current;
    if (!scrollView || !input) {
      return;
    }

    const scrollNode = (scrollView as any).getScrollableNode?.() ?? findNodeHandle(scrollView);
    const inputNode = findNodeHandle(input);
    if (!scrollNode || !inputNode) {
      return;
    }

    setTimeout(() => {
      UIManager.measureLayout(
        inputNode,
        scrollNode as number,
        () => {},
        (_x, y) => {
          scrollView.scrollTo({ y: Math.max(0, y - 24), animated: true });
        }
      );
    }, 50);
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (focusedField) {
        scrollToInput(focusedField);
      }
    });

    return () => subscription.remove();
  }, [focusedField, scrollToInput]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const me = await getMe();
        if (!isActive) return;
        setNickname(me.nickname ?? '');
        updateProfile({ nickname: me.nickname ?? '', emoji: me.emoji ?? '' });
      } catch (error) {
        if (!isActive) return;
        const message = getErrorMessage(error, '프로필 정보를 불러오지 못했어요.');
        setLoadError(message);
        Alert.alert('안내', message);
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [updateProfile]);

  const contentContainerStyle = useMemo(
    () => [styles.container, { paddingBottom: 180 + insets.bottom }],
    [insets.bottom]
  );

  const handleSave = async () => {
    if (isSaving) return;
    if (isLoading) {
      Alert.alert('안내', '프로필 정보를 불러오는 중이에요.');
      return;
    }
    if (loadError) {
      Alert.alert('안내', loadError);
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('안내', '닉네임을 입력해 주세요.');
      return;
    }
    if (password || passwordConfirm) {
      if (password !== passwordConfirm) {
        Alert.alert('안내', '비밀번호가 서로 다릅니다.');
        return;
      }
      Alert.alert('안내', '비밀번호 변경은 아직 지원되지 않습니다.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateMe({ nickname: nickname.trim() });
      updateProfile({ nickname: updated.nickname, emoji: updated.emoji ?? '' });
      router.back();
    } catch (error) {
      Alert.alert('안내', getErrorMessage(error, '프로필 수정에 실패했어요.'));
    } finally {
      setIsSaving(false);
    }
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
            ref={scrollViewRef}
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
              <Text style={styles.headerTitle}>프로필 수정</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.formCard}>
              <View style={styles.field}>
                <Text style={styles.label}>닉네임 수정</Text>
                <TextInput
                  ref={nicknameRef}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="닉네임"
                  placeholderTextColor={Palette.textTertiary}
                  editable={!isLoading}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setFocusedField(nicknameRef);
                    scrollToInput(nicknameRef);
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>비밀번호 수정</Text>
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호"
                  placeholderTextColor={Palette.textTertiary}
                  secureTextEntry
                  textContentType="oneTimeCode"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setFocusedField(passwordRef);
                    scrollToInput(passwordRef);
                  }}
                  onSubmitEditing={() => passwordConfirmRef.current?.focus()}
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>비밀번호 확인</Text>
                <TextInput
                  ref={passwordConfirmRef}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  placeholder="비밀번호 확인"
                  placeholderTextColor={Palette.textTertiary}
                  secureTextEntry
                  textContentType="oneTimeCode"
                  returnKeyType="done"
                  blurOnSubmit
                  onFocus={() => {
                    setFocusedField(passwordConfirmRef);
                    scrollToInput(passwordConfirmRef);
                  }}
                  onSubmitEditing={Keyboard.dismiss}
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable style={styles.saveButton} onPress={handleSave} accessibilityRole="button">
              <Text style={styles.saveButtonText}>{isSaving ? '저장 중...' : '저장'}</Text>
            </Pressable>
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
    paddingBottom: 180,
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
    marginRight: 36,
  },
  headerSpacer: {
    width: 36,
  },
  formCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  input: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  saveButton: {
    marginTop: 18,
    backgroundColor: Palette.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadows.card,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.surface,
  },
});
