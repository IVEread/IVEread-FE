import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ApiClientError } from '@/services/api-client';
import {
  buildInsightsFallbackSummary,
  fetchInsights,
  fetchInsightsAISummary,
} from '@/services/insights';
import type { InsightsResponse } from '@/types/insights';

export default function ReadingInsightsScreen() {
  const router = useRouter();
  const [summaryText, setSummaryText] = useState('');
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadInsights = useCallback(async (isActiveRef?: { current: boolean }) => {
    setIsLoading(true);
    setInsightsError(null);
    setSummaryText('');
    try {
      const data = await fetchInsights();
      if (isActiveRef && !isActiveRef.current) return;
      setInsights(data);

      try {
        const aiSummary = await fetchInsightsAISummary(data);
        if (isActiveRef && !isActiveRef.current) return;
        const normalizedSummary = aiSummary.trim() || buildInsightsFallbackSummary(data);
        setSummaryText(normalizedSummary);
      } catch {
        if (isActiveRef && !isActiveRef.current) return;
        setSummaryText(buildInsightsFallbackSummary(data));
      }
    } catch (error) {
      if (isActiveRef && !isActiveRef.current) return;
      const message =
        error instanceof ApiClientError ? error.message : '인사이트를 불러오지 못했어요.';
      console.warn(message);
      setInsights(null);
      setInsightsError(message);
    } finally {
      if (!isActiveRef || isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const detailSections = insights
    ? [
        {
          title: '독서 습관 분석',
          items: [
            { label: '연속 기록', value: `${insights.habit.currentStreak}일` },
            { label: '주간 빈도', value: `${insights.habit.weeklyFrequency}일` },
          ],
        },
        {
          title: '완독 성과',
          items: [
            { label: '완독한 책', value: `${insights.completion.finishedBooks}권` },
            {
              label: '완독률',
              value: `${Math.round(insights.completion.completionRate * 100)}%`,
            },
          ],
        },
        {
          title: '기록 활동 요약',
          items: [
            { label: '기록 수', value: `${insights.activity.totalRecords}개` },
            { label: '문장 수', value: `${insights.activity.totalSentences}개` },
          ],
        },
      ]
    : [];

  useFocusEffect(
    useCallback(() => {
      const isActive = { current: true };
      loadInsights(isActive);
      return () => {
        isActive.current = false;
      };
    }, [loadInsights]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기">
            <IconSymbol size={20} name="chevron.left" color={Palette.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>독서 인사이트</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryEyebrow}>AI 독서 인사이트</Text>
              <Text style={styles.summaryTitle}>AI 요약 리포트</Text>
            </View>
            <View style={styles.aiBadge}>
              <View style={styles.aiSparkle} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.summaryBody}>
            {isLoading
              ? '요약을 불러오는 중이에요.'
              : insightsError
                ? insightsError
                : summaryText
                  ? summaryText
                  : '표시할 요약이 없어요.'}
          </Text>
          <Text style={styles.summaryFootnote}>기록을 바탕으로 한 차분한 해석이에요.</Text>
        </View>

        <View style={styles.section}>
          {isLoading ? (
            <Text style={styles.helperText}>지표를 불러오는 중이에요.</Text>
          ) : insightsError ? (
            <Text style={styles.helperText}>{insightsError}</Text>
          ) : detailSections.length ? (
            detailSections.map((section) => (
              <View key={section.title} style={styles.statCard}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item, index) => (
                  <View
                    key={item.label}
                    style={[styles.metricRow, index > 0 && styles.metricRowDivider]}>
                    <Text style={styles.metricLabel}>{item.label}</Text>
                    <Text style={styles.metricValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.helperText}>표시할 인사이트가 없어요.</Text>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    minWidth: 48,
    height: 36,
    justifyContent: 'center',
  },
  headerSpacer: {
    minWidth: 48,
    height: 36,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: Palette.accentSoft,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Palette.accent,
    marginBottom: 22,
    ...Shadows.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryEyebrow: {
    ...Typography.caption,
    color: Palette.textTertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  summaryBody: {
    ...Typography.body,
    color: Palette.textSecondary,
    lineHeight: 22,
  },
  summaryFootnote: {
    ...Typography.caption,
    color: Palette.textTertiary,
    marginTop: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  aiBadgeText: {
    ...Typography.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
  },
  aiSparkle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  statCard: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
    marginBottom: 6,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  metricLabel: {
    ...Typography.caption,
    color: Palette.textTertiary,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'right',
  },
  helperText: {
    ...Typography.caption,
  },
});
