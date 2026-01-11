import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { useReadingClubs } from '@/contexts/reading-clubs-context';

const memberOptions = Array.from({ length: 11 }, (_, index) => index + 2);

export default function CreateGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string; tag?: string }>();
  const tagParam = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const today = new Date();
  const { addClub } = useReadingClubs();
  const [form, setForm] = useState({
    groupName: '',
    bookTitle: '',
    description: '',
    startDate: '',
    memberLimit: '',
    tags: tagParam ?? '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const groupIllustration = require('../assets/images/image-Photoroom 4.png');

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const selectedDateKeyFromPicker =
    selectedDay !== null
      ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
      : null;

  const displayStartDate = useMemo(() => {
    if (!selectedDateKeyFromPicker) return '시작일을 선택하세요';
    const [dYear, dMonth, dDay] = selectedDateKeyFromPicker.split('-');
    return `${dYear}.${dMonth}.${dDay}`;
  }, [selectedDateKeyFromPicker]);

  const formatDateLabel = (year: number, month: number, day: number) =>
    `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (
      !form.groupName.trim() ||
      !form.bookTitle.trim() ||
      !selectedDateKeyFromPicker ||
      !form.memberLimit.trim()
    ) {
      setErrorMessage('그룹 이름, 책 제목, 시작일, 모집 인원은 필수 입력이에요.');
      return;
    }
    const memberLimit = Number(form.memberLimit);
    const normalizedTags = form.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter(Boolean);
    const labelTag = normalizedTags.length > 0 ? normalizedTags[0] : '교환독서';
    const memberLabel = `${form.memberLimit}명 중 1명 기록 완료`;

    addClub({
      groupName: form.groupName.trim(),
      title: form.bookTitle.trim(),
      author: '작자 미상',
      tag: `${labelTag} 교환독서`,
      tags: normalizedTags,
      progress: 0,
      members: memberLabel,
      memberCount: 1,
      memberLimit,
      lastActive: '오늘',
      lastActiveDays: 0,
      activityScore: 80,
    });
    setErrorMessage(null);
    router.replace('/(tabs)');
  };

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
          <Image source={groupIllustration} style={styles.illustrationImage} />
          <Text style={styles.title}>교환독서 만들기</Text>
          <Text style={styles.description}>필수 정보를 입력하면 그룹 미리보기와 초대 링크가 준비돼요.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>그룹 이름</Text>
            <TextInput
              value={form.groupName}
              onChangeText={(value) => updateForm('groupName', value)}
              placeholder="그룹 이름을 입력해 주세요"
              placeholderTextColor={Palette.textTertiary}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>책 제목</Text>
            <TextInput
              value={form.bookTitle}
              onChangeText={(value) => updateForm('bookTitle', value)}
              placeholder="책 제목을 입력해 주세요"
              placeholderTextColor={Palette.textTertiary}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>모집 인원</Text>
            <Pressable
              style={styles.pickerButton}
              onPress={() => setIsMemberPickerOpen(true)}
              accessibilityRole="button">
              <Text style={[styles.pickerText, !form.memberLimit && styles.pickerPlaceholder]}>
                {form.memberLimit ? `${form.memberLimit}명` : '모집 인원을 선택하세요'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>시작일</Text>
            <Pressable
              style={styles.pickerButton}
              onPress={() => setIsDatePickerOpen(true)}
              accessibilityRole="button">
              <Text style={[styles.pickerText, !selectedDateKeyFromPicker && styles.pickerPlaceholder]}>
                {selectedDateKeyFromPicker ? displayStartDate : '시작일을 선택하세요'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>태그</Text>
            <TextInput
              value={form.tags}
              onChangeText={(value) => updateForm('tags', value)}
              placeholder="예: 고전, 토론, 소설"
              placeholderTextColor={Palette.textTertiary}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>소개</Text>
            <TextInput
              value={form.description}
              onChangeText={(value) => updateForm('description', value)}
              placeholder="그룹의 분위기나 진행 방식을 알려주세요."
              placeholderTextColor={Palette.textTertiary}
              style={[styles.input, styles.multilineInput]}
              multiline
            />
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <Pressable onPress={handleSubmit} style={styles.submitButton} accessibilityRole="button">
            <Text style={styles.submitButtonText}>그룹 생성하기</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={isMemberPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMemberPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsMemberPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}} accessibilityRole="menu">
            <Text style={styles.pickerTitle}>모집 인원 선택</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerList}>
              {memberOptions.map((count) => {
                const isActive = Number(form.memberLimit) === count;
                return (
                  <Pressable
                    key={count}
                    style={[styles.pickerItem, isActive && styles.pickerItemActive]}
                    onPress={() => {
                      updateForm('memberLimit', String(count));
                      setIsMemberPickerOpen(false);
                    }}
                    accessibilityRole="button">
                    <Text style={styles.pickerItemText}>{count}명</Text>
                    {isActive && <Text style={styles.pickerCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsDatePickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}} accessibilityRole="menu">
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>시작일 선택</Text>
              <Pressable onPress={() => setIsDatePickerOpen(false)} accessibilityRole="button">
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>
            <View style={styles.datePickerRow}>
              <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false}>
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => {
                  const isActive = year === selectedYear;
                  return (
                    <Pressable
                      key={year}
                      style={[styles.dateOption, isActive && styles.dateOptionActive]}
                      onPress={() => {
                        setSelectedYear(year);
                        if (selectedDay !== null) {
                          updateForm('startDate', formatDateLabel(year, selectedMonth, selectedDay));
                        }
                      }}
                      accessibilityRole="button">
                      <Text style={styles.dateOptionText}>{year}년</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView style={styles.dateColumn} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                  const isActive = month === selectedMonth;
                  return (
                    <Pressable
                      key={month}
                      style={[styles.dateOption, isActive && styles.dateOptionActive]}
                      onPress={() => {
                        setSelectedMonth(month);
                        setSelectedDay(null);
                        updateForm('startDate', '');
                      }}
                      accessibilityRole="button">
                      <Text style={styles.dateOptionText}>{month}월</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView style={styles.dateColumnLast} showsVerticalScrollIndicator={false}>
                {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                  const isActive = day === selectedDay;
                  return (
                    <Pressable
                      key={day}
                      style={[styles.dateOption, isActive && styles.dateOptionActive]}
                      onPress={() => {
                        setSelectedDay(day);
                        updateForm('startDate', formatDateLabel(selectedYear, selectedMonth, day));
                      }}
                      accessibilityRole="button">
                      <Text style={styles.dateOptionText}>{day}일</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
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
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  illustrationImage: {
    width: '100%',
    height: 170,
    resizeMode: 'contain',
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'center',
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
  field: {
    marginTop: 14,
  },
  label: {
    fontSize: 12,
    color: Palette.textTertiary,
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  pickerButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  pickerText: {
    fontSize: 14,
    color: Palette.textPrimary,
  },
  pickerPlaceholder: {
    color: Palette.textTertiary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerDone: {
    fontSize: 12,
    color: Palette.accent,
    fontWeight: '600',
  },
  pickerList: {
    paddingBottom: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 10,
    backgroundColor: Palette.surface,
  },
  pickerItemActive: {
    backgroundColor: Palette.accentSoft,
  },
  pickerItemText: {
    flex: 1,
    fontSize: 14,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  pickerCheck: {
    fontSize: 14,
    color: Palette.accent,
    fontWeight: '700',
  },
  datePickerRow: {
    flexDirection: 'row',
  },
  dateColumn: {
    flex: 1,
    marginRight: 12,
  },
  dateColumnLast: {
    flex: 1,
  },
  dateOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: Palette.background,
    alignItems: 'center',
  },
  dateOptionActive: {
    backgroundColor: Palette.accentSoft,
  },
  dateOptionText: {
    fontSize: 13,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  multilineInput: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    color: '#C04B3A',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: Palette.accent,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
