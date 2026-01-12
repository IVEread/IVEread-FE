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

import { Palette, Shadows, Typography } from '@/constants/ui';
import { ApiClientError } from '@/services/api-client';
import { signup } from '@/services/auth';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiClientError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
};

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isAgreed, setIsAgreed] = useState(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const nicknameRef = useRef<TextInput | null>(null);
  const emailRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const passwordConfirmRef = useRef<TextInput | null>(null);
  const [focusedField, setFocusedField] = useState<React.RefObject<TextInput | null> | null>(null);

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
        },
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

  const contentContainerStyle = useMemo(
    () => [styles.container, { paddingBottom: 160 + insets.bottom }],
    [insets.bottom],
  );

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    if (!isAgreed) {
      Alert.alert('안내', '약관에 동의해 주세요.');
      return;
    }
    if (!nickname.trim() || !email.trim() || !password) {
      Alert.alert('안내', '닉네임, 이메일, 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('안내', '비밀번호가 서로 다릅니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signup({ email: email.trim(), password, nickname: nickname.trim() });
      router.replace('/login');
    } catch (error) {
      Alert.alert('안내', getErrorMessage(error, '회원가입에 실패했어요.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isAgreed, isSubmitting, nickname, password, passwordConfirm, router]);

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
            <Text style={styles.eyebrow}>회원가입</Text>
            <Text style={styles.title}>함께 읽는 시간을 시작해요</Text>
            <Text style={styles.subtitle}>기본 정보를 입력하고 계정을 만들어주세요.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>닉네임</Text>
                <TextInput
                  ref={nicknameRef}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="닉네임을 입력해주세요"
                  placeholderTextColor={Palette.textSecondary}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setFocusedField(nicknameRef);
                    scrollToInput(nicknameRef);
                  }}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>아이디(이메일)</Text>
                <TextInput
                  ref={emailRef}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@iveread.app"
                  placeholderTextColor={Palette.textSecondary}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setFocusedField(emailRef);
                    scrollToInput(emailRef);
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor={Palette.textSecondary}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setFocusedField(passwordRef);
                    scrollToInput(passwordRef);
                  }}
                  onSubmitEditing={() => passwordConfirmRef.current?.focus()}
                  style={styles.input}
                  secureTextEntry
                  textContentType="oneTimeCode"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호 확인</Text>
                <TextInput
                  ref={passwordConfirmRef}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  placeholder="비밀번호를 다시 입력하세요"
                  placeholderTextColor={Palette.textSecondary}
                  returnKeyType="done"
                  blurOnSubmit
                  onFocus={() => {
                    setFocusedField(passwordConfirmRef);
                    scrollToInput(passwordConfirmRef);
                  }}
                  onSubmitEditing={Keyboard.dismiss}
                  style={styles.input}
                  secureTextEntry
                  textContentType="oneTimeCode"
                />
              </View>

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setIsAgreed((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isAgreed }}>
                <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]}>
                  {isAgreed && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>회원가입 약관 및 개인정보 처리방침 동의</Text>
              </Pressable>

              <Pressable
                style={[styles.primaryButton, !isAgreed && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={!isAgreed || isSubmitting}
                accessibilityRole="button">
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? '가입 중...' : '회원가입 완료'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.replace('/login')}
                accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>이미 계정이 있어요</Text>
              </Pressable>
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
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  eyebrow: {
    fontSize: 12,
    color: Palette.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Typography.subtitle,
    marginTop: 8,
  },
  form: {
    marginTop: 28,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Palette.textTertiary,
    color: Palette.textPrimary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Palette.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: Palette.surface,
  },
  checkboxChecked: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  checkboxMark: {
    fontSize: 12,
    color: Palette.surface,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: Palette.textSecondary,
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Shadows.card,
  },
  primaryButtonDisabled: {
    backgroundColor: Palette.accentSoft,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.accent,
  },
});
