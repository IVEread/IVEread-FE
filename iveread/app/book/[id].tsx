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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { useProfile } from '@/contexts/profile-context';

const bookDetails = {
  '1984': {
    title: '1984',
    author: '조지 오웰',
    tag: '고전 소설',
    progress: 0.67,
  },
  sapiens: {
    title: '사피엔스',
    author: '유발 하라리',
    tag: '인문학',
    progress: 0.42,
  },
  gatsby: {
    title: '위대한 개츠비',
    author: 'F. 스콧 피츠제럴드',
    tag: '미국 문학',
    progress: 0.8,
  },
  demian: {
    title: '데미안',
    author: '헤르만 헤세',
    tag: '성장 소설',
    progress: 1,
  },
  bird: {
    title: '어린왕자',
    author: '앙투안 드 생텍쥐페리',
    tag: '우화',
    progress: 1,
  },
  death: {
    title: '총, 균, 쇠',
    author: '재레드 다이아몬드',
    tag: '문명사',
    progress: 1,
  },
  cosmos: {
    title: '코스모스',
    author: '칼 세이건',
    tag: '과학',
    progress: 1,
  },
} as const;

type BookId = keyof typeof bookDetails;

const highlightSentencesSeed = [
  {
    id: 'p45',
    page: 'p. 45',
    text: '“전쟁은 평화, 자유는 예속, 무지는 힘이다.”',
    name: '지민',
  },
  {
    id: 'p89',
    page: 'p. 89',
    text: '“빅 브라더가 당신을 지켜보고 있다.”',
    name: '서준',
  },
  {
    id: 'p156',
    page: 'p. 156',
    text: '“과거를 지배하는 자가 미래를 지배하고, 현재를 지배하는 자가 과거를 지배한다.”',
    name: '나',
  },
];

const commentsSeed = [
  {
    id: 'c1',
    name: '지민',
    time: '2시간 전',
    text: '이 책 정말 무섭네요. 지금 우리 사회와 너무 비슷한 것 같아요.',
  },
  {
    id: 'c2',
    name: '서준',
    time: '1시간 전',
    text: '오웰의 통찰력이 정말 대단한 것 같아요. 70년 전에 쓴 책인데도 현재 사회를 예견한 듯해요.',
  },
];
// 추후 백엔드 연동 시 DB 반영 예정

const gallerySeed = [
  require('../../assets/images/react-logo.png'),
  require('../../assets/images/partial-react-logo.png'),
  require('../../assets/images/icon.png'),
  require('../../assets/images/splash-icon.png'),
];

export default function BookDetailScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const defaultId: BookId = '1984';
  const bookId = (id && id in bookDetails ? (id as BookId) : defaultId);
  const detail = bookDetails[bookId];
  const [sentences, setSentences] = useState(highlightSentencesSeed);
  const [isAddingSentence, setIsAddingSentence] = useState(false);
  const [sentenceText, setSentenceText] = useState('');
  const [sentencePage, setSentencePage] = useState('');
  const [commentList, setCommentList] = useState(commentsSeed);
  const [commentText, setCommentText] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const { width } = useWindowDimensions();
  const myEmoji = profile.emoji || (profile.nickname ? profile.nickname.slice(0, 1) : '😊');

  const gallery = useMemo(() => gallerySeed, []);
  const galleryCardSize = Math.floor((width - 22 * 2 - 14) / 2);

  const handleAddSentence = () => {
    if (!sentenceText.trim()) {
      Alert.alert('안내', '문장을 입력해 주세요.');
      return;
    }
    const pageLabel = sentencePage.trim() ? `p. ${sentencePage.trim()}` : 'p. ?';
    setSentences((prev) => [
      { id: `p-${Date.now()}`, page: pageLabel, text: sentenceText.trim(), name: '나' },
      ...prev,
    ]);
    setSentenceText('');
    setSentencePage('');
    setIsAddingSentence(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) {
      Alert.alert('안내', '댓글을 입력해 주세요.');
      return;
    }
    setCommentList((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: '나', time: '방금', text: commentText.trim() },
    ]);
    setCommentText('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>교환독서</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.bookCard}>
          <View style={styles.bookCover}>
            <Text style={styles.bookCoverText}>표지</Text>
          </View>
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{detail.title}</Text>
            <Text style={styles.bookAuthor}>{detail.author}</Text>
            <View style={styles.bookTag}>
              <Text style={styles.bookTagText}>{detail.tag}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>교환독서 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>시작일</Text>
              <Text style={styles.infoValue}>2024.01.03 시작</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>목표일</Text>
              <Text style={styles.infoValue}>2024.02.15 까지</Text>
            </View>
            <View style={styles.memberRow}>
              <View style={styles.memberAvatarStack}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>{myEmoji}</Text>
                </View>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>🧑‍🎓</Text>
                </View>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>👩‍💻</Text>
                </View>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>🧑‍🎨</Text>
                </View>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>👨‍🔬</Text>
                </View>
              </View>
              <Text style={styles.memberCount}>5명이 함께 읽고 있어요</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>독서 진행률</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>현재 진행률</Text>
              <Text style={styles.progressValue}>{Math.round(detail.progress * 100)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${detail.progress * 100}%` }]} />
            </View>
            <Text style={styles.progressNote}>5명 중 3명이 기록을 완료했어요.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>인상 깊었던 문장</Text>
            <Pressable
              style={styles.plusButton}
              onPress={() => setIsAddingSentence((prev) => !prev)}
              accessibilityRole="button">
              <Text style={styles.plusButtonText}>＋</Text>
            </Pressable>
          </View>
          {isAddingSentence && (
            <View style={styles.sentenceInputCard}>
              <View style={styles.sentenceInputRow}>
                <TextInput
                  value={sentencePage}
                  onChangeText={setSentencePage}
                  placeholder="페이지"
                  placeholderTextColor={Palette.textTertiary}
                  keyboardType="number-pad"
                  style={styles.sentencePageInput}
                />
                <Pressable
                  style={styles.sentenceAddButton}
                  onPress={handleAddSentence}
                  accessibilityRole="button">
                  <Text style={styles.sentenceAddText}>추가</Text>
                </Pressable>
              </View>
              <TextInput
                value={sentenceText}
                onChangeText={setSentenceText}
                placeholder="인상 깊었던 문장을 입력하세요"
                placeholderTextColor={Palette.textTertiary}
                multiline
                style={styles.sentenceTextInput}
              />
            </View>
          )}
          {sentences.length === 0 ? (
            <Text style={styles.emptyText}>아직 등록된 문장이 없어요.</Text>
          ) : (
            sentences.map((item) => (
              <View key={item.id} style={styles.sentenceCard}>
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>{item.page}</Text>
                </View>
                <Text style={styles.sentenceText}>{item.text}</Text>
                <View style={styles.sentenceMeta}>
                  <View style={styles.sentenceAvatar}>
                    <Text style={styles.sentenceAvatarText}>
                      {item.name === '나' ? myEmoji : item.name.slice(0, 1)}
                    </Text>
                  </View>
                  <Text style={styles.sentenceName}>{item.name}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>댓글</Text>
          <View style={styles.commentCard}>
            {commentList.length === 0 ? (
              <Text style={styles.emptyText}>첫 번째 댓글을 남겨보세요.</Text>
            ) : (
              commentList.map((comment, index) => (
                <View key={comment.id} style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {comment.name === '나' ? myEmoji : comment.name.slice(0, 1)}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentName}>{comment.name}</Text>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                  {index < commentList.length - 1 && <View style={styles.commentDivider} />}
                </View>
              ))
            )}
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="댓글을 입력하세요..."
                placeholderTextColor={Palette.textTertiary}
                style={styles.commentInput}
              />
              <Pressable
                style={styles.sendButton}
                onPress={handleAddComment}
                accessibilityRole="button">
                <Text style={styles.sendButtonText}>↗</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>독서 인증 갤러리</Text>
          <View style={styles.galleryGrid}>
            {gallery.map((item, index) => (
              <Pressable
                key={`photo-${index}`}
                style={[styles.galleryItem, { width: galleryCardSize, height: galleryCardSize }]}
                onPress={() => setPreviewIndex(index)}
                accessibilityRole="button">
                <Image source={item} style={styles.galleryImage} />
              </Pressable>
            ))}
            <Pressable
              style={[styles.galleryAdd, { width: galleryCardSize, height: galleryCardSize }]}
              onPress={() => Alert.alert('준비 중', '사진 추가 기능은 준비 중입니다.')}
              accessibilityRole="button">
              <Text style={styles.galleryAddText}>＋</Text>
              <Text style={styles.galleryAddLabel}>사진 추가</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={previewIndex !== null} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            {previewIndex !== null && (
              <Image source={gallery[previewIndex]} style={styles.previewImage} />
            )}
            <Pressable
              style={styles.previewClose}
              onPress={() => setPreviewIndex(null)}
              accessibilityRole="button">
              <Text style={styles.previewCloseText}>닫기</Text>
            </Pressable>
          </View>
        </View>
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
  bookCard: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  bookCover: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bookCoverText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  bookAuthor: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  bookTag: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 10,
  },
  bookTagText: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  memberAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  memberInitial: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  memberCount: {
    marginLeft: 8,
    fontSize: 11,
    color: Palette.textSecondary,
  },
  progressCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.accent,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Palette.accentSoft,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Palette.accent,
    borderRadius: 999,
  },
  progressNote: {
    marginTop: 10,
    fontSize: 11,
    color: Palette.textTertiary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonText: {
    color: Palette.textSecondary,
    fontSize: 16,
  },
  sentenceInputCard: {
    marginTop: 12,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sentenceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sentencePageInput: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 10,
    fontSize: 12,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  sentenceAddButton: {
    marginLeft: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Palette.accent,
  },
  sentenceAddText: {
    fontSize: 12,
    color: Palette.surface,
    fontWeight: '600',
  },
  sentenceTextInput: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  sentenceCard: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    marginTop: 12,
  },
  pageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pageBadgeText: {
    fontSize: 10,
    color: Palette.textSecondary,
  },
  sentenceText: {
    marginTop: 10,
    fontSize: 13,
    color: Palette.textPrimary,
    lineHeight: 20,
  },
  sentenceMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  sentenceAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  sentenceAvatarText: {
    fontSize: 10,
    color: Palette.textSecondary,
  },
  sentenceName: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  commentCard: {
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentName: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 10,
    color: Palette.textTertiary,
  },
  commentText: {
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  commentDivider: {
    height: 1,
    backgroundColor: Palette.border,
    marginTop: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  commentInput: {
    flex: 1,
    fontSize: 12,
    color: Palette.textPrimary,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 12,
    color: Palette.surface,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    borderRadius: 16,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryAdd: {
    borderRadius: 16,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  galleryAddText: {
    fontSize: 18,
    color: Palette.textSecondary,
    marginBottom: 6,
  },
  galleryAddLabel: {
    fontSize: 11,
    color: Palette.textTertiary,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 12,
    color: Palette.textTertiary,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  previewCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Palette.surface,
    padding: 16,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
  },
  previewClose: {
    marginTop: 14,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Palette.accent,
  },
  previewCloseText: {
    color: Palette.surface,
    fontSize: 12,
    fontWeight: '600',
  },
});
