import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';

export default function SignupScreen() {
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.eyebrow}>회원가입</Text>
        <Text style={styles.title}>함께 읽는 시간을 시작해요</Text>
        <Text style={styles.subtitle}>기본 정보를 입력하고 계정을 만들어주세요.</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor={Palette.textSecondary}
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>아이디(이메일)</Text>
            <TextInput
              placeholder="example@iveread.app"
              placeholderTextColor={Palette.textSecondary}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={Palette.textSecondary}
              style={styles.input}
              secureTextEntry
              textContentType="oneTimeCode"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              placeholder="비밀번호를 다시 입력하세요"
              placeholderTextColor={Palette.textSecondary}
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
            onPress={() => router.replace('/login')}
            disabled={!isAgreed}
            accessibilityRole="button">
            <Text style={styles.primaryButtonText}>회원가입 완료</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace('/login')}
            accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>이미 계정이 있어요</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
