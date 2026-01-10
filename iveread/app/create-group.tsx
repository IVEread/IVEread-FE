import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';

export default function CreateGroupScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>교환독서 생성</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>교환독서 만들기</Text>
          <Text style={styles.description}>
            아직 생성 기능은 준비 중이에요. 대신 데모용 흐름을 위해 예시 정보를 확인할 수 있어요.
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>책 제목</Text>
            <Text style={styles.infoValue}>달과 6펜스</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>모집 인원</Text>
            <Text style={styles.infoValue}>4명</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>시작일</Text>
            <Text style={styles.infoValue}>2024.03.01</Text>
          </View>
        </View>

        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>준비 중인 기능입니다</Text>
          <Text style={styles.placeholderText}>
            실제 생성과 초대는 다음 업데이트에서 제공될 예정이에요. 데모에서는 기존 교환독서를
            탐색해 주세요.
          </Text>
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
    paddingBottom: 24,
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
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  backIcon: {
    fontSize: 20,
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
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  title: {
    ...Typography.sectionTitle,
  },
  description: {
    marginTop: 10,
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: Palette.textTertiary,
  },
  infoValue: {
    fontSize: 12,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  placeholderCard: {
    marginTop: 22,
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
});
