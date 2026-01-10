import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { useCalendarRecords } from '@/contexts/calendar-context';

const bookOptions = [
  { title: '1984', cover: require('../assets/images/icon.png') },
  { title: '사피엔스', cover: require('../assets/images/react-logo.png') },
  { title: '위대한 개츠비', cover: require('../assets/images/partial-react-logo.png') },
  { title: '데미안', cover: require('../assets/images/splash-icon.png') },
];

export default function AddRecordScreen() {
  const router = useRouter();
  const { date, ownerId } = useLocalSearchParams<{ date?: string; ownerId?: string }>();
  const { addRecord } = useCalendarRecords();
  const initialDate = useMemo(() => {
    if (!date) return null;
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return null;
    return { year, month, day };
  }, [date]);
  const today = new Date();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    initialDate?.year ?? today.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialDate?.month ?? today.getMonth() + 1
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDate?.day ?? null);
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<(typeof bookOptions)[number] | null>(null);
  const [note, setNote] = useState('');

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const selectedDateKeyFromPicker =
    selectedDay !== null
      ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(
          2,
          '0'
        )}`
      : null;

  const displayDate = useMemo(() => {
    if (!selectedDateKeyFromPicker) return '날짜 미지정';
    const [dYear, dMonth, dDay] = selectedDateKeyFromPicker.split('-');
    return `${dYear}년 ${Number(dMonth)}월 ${Number(dDay)}일`;
  }, [selectedDateKeyFromPicker]);

  const isValid =
    (selectedBook?.title?.trim().length ?? 0) > 0 &&
    note.trim().length > 0 &&
    !!selectedDateKeyFromPicker;

  const handleSubmit = () => {
    if (!selectedDateKeyFromPicker) {
      Alert.alert('안내', '날짜를 선택해 주세요.');
      return;
    }
    addRecord(ownerId ?? 'me', {
      date: selectedDateKeyFromPicker,
      title: selectedBook ? selectedBook.title : '',
      note: note.trim(),
      cover: selectedBook ? selectedBook.cover : bookOptions[0].cover,
      reactions: [],
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button">
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>기록하기</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.dateLabel}>{displayDate}</Text>

        <View style={styles.formCard}>
          <View style={[styles.field, styles.calendarField]}>
            <Text style={styles.label}>날짜 선택</Text>
            <Pressable
              style={styles.pickerButton}
              onPress={() => setIsDatePickerOpen(true)}
              accessibilityRole="button">
              <Text
                style={[
                  styles.pickerText,
                  !selectedDateKeyFromPicker && styles.pickerPlaceholder,
                ]}>
                {selectedDateKeyFromPicker ? displayDate : '날짜를 선택하세요'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>책 제목</Text>
            <Pressable
              style={styles.pickerButton}
              onPress={() => setIsBookPickerOpen(true)}
              accessibilityRole="button">
              <Text
                style={[
                  styles.pickerText,
                  !selectedBook && styles.pickerPlaceholder,
                ]}>
                {selectedBook ? selectedBook.title : '책 제목을 선택하세요'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>한 줄 코멘트</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="한 줄 코멘트를 입력하세요"
              placeholderTextColor={Palette.textTertiary}
              style={styles.input}
              multiline
            />
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
          accessibilityRole="button">
          <Text style={styles.submitButtonText}>기록 저장</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={isBookPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBookPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsBookPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}} accessibilityRole="menu">
            <Text style={styles.pickerTitle}>책 제목 선택</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}>
              {bookOptions.map((book) => {
                const isActive = selectedBook?.title === book.title;
                return (
                  <Pressable
                    key={book.title}
                    style={[styles.pickerItem, isActive && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedBook(book);
                      setIsBookPickerOpen(false);
                    }}
                    accessibilityRole="button">
                    <Image source={book.cover} style={styles.pickerCover} />
                    <Text style={styles.pickerItemText}>{book.title}</Text>
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
              <Text style={styles.pickerTitle}>날짜 선택</Text>
              <Pressable
                onPress={() => setIsDatePickerOpen(false)}
                accessibilityRole="button">
                <Text style={styles.pickerDone}>완료</Text>
              </Pressable>
            </View>
            <View style={styles.datePickerRow}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => {
                  const isActive = year === selectedYear;
                  return (
                    <Pressable
                      key={year}
                      style={[styles.dateOption, isActive && styles.dateOptionActive]}
                      onPress={() => setSelectedYear(year)}
                      accessibilityRole="button">
                      <Text style={styles.dateOptionText}>{year}년</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView showsVerticalScrollIndicator={false}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                  const isActive = month === selectedMonth;
                  return (
                    <Pressable
                      key={month}
                      style={[styles.dateOption, isActive && styles.dateOptionActive]}
                      onPress={() => {
                        setSelectedMonth(month);
                        setSelectedDay(null);
                      }}
                      accessibilityRole="button">
                      <Text style={styles.dateOptionText}>{month}월</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView showsVerticalScrollIndicator={false}>
                {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                  const isActive = day === selectedDay;
                  return (
                    <Pressable
                      key={day}
                      style={[styles.dateOption, isActive && styles.dateOptionActive]}
                      onPress={() => setSelectedDay(day)}
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
    color: Palette.textTertiary,
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
  dateLabel: {
    ...Typography.sectionTitle,
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  field: {
    marginBottom: 10,
  },
  calendarField: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: 4,
  },
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  pickerButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  pickerText: {
    fontSize: 13,
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
  pickerCover: {
    width: 32,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
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
    gap: 10,
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
  submitButton: {
    marginTop: 18,
    backgroundColor: Palette.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadows.card,
  },
  submitButtonDisabled: {
    backgroundColor: Palette.accentSoft,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.surface,
  },
});
