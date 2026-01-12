import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  UIManager,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const heroHeight = Math.min(Math.floor(height * 0.38), 320);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const emailRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
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

  const contentContainerStyle = useMemo(
    () => [styles.container, { paddingBottom: 160 + insets.bottom }],
    [insets.bottom]
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}>
            <View style={styles.brandRow}>
              <Image
                source={require('../assets/images/iveread-people-Photoroom.png')}
                style={[styles.brandImage, { height: heroHeight }]}
              />
            </View>
            <Text style={styles.title}>IVEread</Text>
            <Text style={styles.subtitle}>교환독서에 온 걸 환영해요.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                  ref={emailRef}
                  placeholder="example@iveread.app"
                  placeholderTextColor={Palette.textSecondary}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => {
                    setFocusedField(emailRef);
                    scrollToInput(emailRef);
                  }}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호</Text>
                <TextInput
                  ref={passwordRef}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor={Palette.textSecondary}
                  style={styles.input}
                  secureTextEntry
                  textContentType="oneTimeCode"
                  returnKeyType="done"
                  blurOnSubmit
                  onFocus={() => {
                    setFocusedField(passwordRef);
                    scrollToInput(passwordRef);
                  }}
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.replace('/(tabs)')}
                accessibilityRole="button">
                <Text style={styles.primaryButtonText}>로그인</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push('/signup')}
                accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>회원가입</Text>
              </Pressable>
            </View>

            <View style={styles.helperRow}>
              <Text style={styles.helperText}>계정을 잊으셨나요?</Text>
              <Pressable
                onPress={() => router.push('/password-reset')}
                accessibilityRole="button"
                hitSlop={8}>
                <Text style={styles.helperLink}>비밀번호 재설정</Text>
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
    justifyContent: 'flex-start',
    flexGrow: 1,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brandImage: {
    width: '100%',
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  brandTagline: {
    marginTop: 4,
    fontSize: 12,
    color: Palette.textSecondary,
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
  primaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Shadows.card,
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
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  helperText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  helperLink: {
    fontSize: 12,
    color: Palette.accent,
    marginLeft: 6,
  },
});
