import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>다시 시작하기</Text>
        <Text style={styles.title}>다시 만나서 반가워요</Text>
        <Text style={styles.subtitle}>교환독서 기록을 이어가세요.</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
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
