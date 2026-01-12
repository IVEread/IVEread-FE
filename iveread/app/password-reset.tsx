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
  UIManager,
  View,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { useProfile } from '@/contexts/profile-context';

export default function PasswordResetScreen() {
  const router = useRouter();
  const { updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
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

  const handleReset = () => {
    if (!email.trim()) {
      Alert.alert('안내', '아이디(이메일)를 입력해 주세요.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('안내', '비밀번호를 입력해 주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('안내', '비밀번호가 서로 다릅니다.');
      return;
    }
    updateProfile({ password: password.trim() });
    Alert.alert('완료', '비밀번호가 변경되었습니다.', [
      { text: '확인', onPress: () => router.replace('/login') },
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
          <Text style={styles.headerTitle}>비밀번호 재설정</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>새 비밀번호를 설정해 주세요</Text>
        <Text style={styles.subtitle}>새로운 비밀번호를 입력하고 확인해 주세요.</Text>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>아이디(이메일)</Text>
            <TextInput
              ref={emailRef}
              value={email}
              onChangeText={setEmail}
              placeholder="example@iveread.app"
              placeholderTextColor={Palette.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              blurOnSubmit={false}
              onFocus={() => {
                setFocusedField(emailRef);
                scrollToInput(emailRef);
              }}
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>새 비밀번호</Text>
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

        <Pressable style={styles.saveButton} onPress={handleReset} accessibilityRole="button">
          <Text style={styles.saveButtonText}>비밀번호 변경</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Typography.subtitle,
    marginTop: 8,
    marginBottom: 18,
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
