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
import * as ImagePicker from 'expo-image-picker';

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
    replies: [
      { id: 'r-1', name: '서준', time: '1시간 전', text: '이 문장 진짜 소름...' },
    ],
  },
  {
    id: 'p89',
    page: 'p. 89',
    text: '“빅 브라더가 당신을 지켜보고 있다.”',
    name: '서준',
    replies: [],
  },
  {
    id: 'p156',
    page: 'p. 156',
    text: '“과거를 지배하는 자가 미래를 지배하고, 현재를 지배하는 자가 과거를 지배한다.”',
    name: '나',
    replies: [],
  },
];
// 추후 백엔드 연동 시 DB 반영 예정

const gallerySeed = [
  require('../../assets/images/react-logo.png'),
  require('../../assets/images/partial-react-logo.png'),
  require('../../assets/images/icon.png'),
  require('../../assets/images/splash-icon.png'),
];

const feedSeed = [
  {
    id: 'feed-1',
    name: '서준',
    time: '2시간 전',
    image: gallerySeed[0],
    caption: '오늘은 3장까지 읽고 핵심 문장을 정리했어요.',
    likes: 4,
    comments: [{ id: 'fc-1', name: '서준', time: '2시간 전', text: '문장 공유해줘!' }],
  },
  {
    id: 'feed-2',
    name: '지민',
    time: '어제',
    image: gallerySeed[1],
    caption: '모임 전에 밑줄친 문장 다시 읽기.',
    likes: 2,
    comments: [],
  },
  {
    id: 'feed-3',
    name: '나',
    time: '방금',
    image: gallerySeed[2],
    caption: '오늘 기록 완료. 다음 주는 4장까지!',
    likes: 6,
    comments: [{ id: 'fc-2', name: '지민', time: '방금', text: '고생했어!' }],
  },
  {
    id: 'feed-4',
    name: '민지',
    time: '3일 전',
    image: gallerySeed[3],
    caption: '독서 인증샷 📚',
    likes: 1,
    comments: [],
  },
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
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState(feedSeed);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [selectedUploadImage, setSelectedUploadImage] = useState<(typeof gallerySeed)[number] | null>(
    null,
  );
  const [selectedUploadUri, setSelectedUploadUri] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [feedCommentText, setFeedCommentText] = useState('');
  const { width, height } = useWindowDimensions();
  const myEmoji = profile.emoji || (profile.nickname ? profile.nickname.slice(0, 1) : '😊');

  const gallery = useMemo(() => gallerySeed, []);
  const selectedPost = useMemo(
    () => (selectedPostId ? feedItems.find((item) => item.id === selectedPostId) ?? null : null),
    [feedItems, selectedPostId],
  );
  const galleryCardSize = Math.floor((width - 22 * 2 - 14) / 2);
  const previewImageHeight = Math.min(Math.floor(width * 1.35), Math.floor(height * 0.68));

  const handleAddSentence = () => {
    if (!sentenceText.trim()) {
      Alert.alert('안내', '문장을 입력해 주세요.');
      return;
    }
    const pageLabel = sentencePage.trim() ? `p. ${sentencePage.trim()}` : 'p. ?';
    setSentences((prev) => [
      { id: `p-${Date.now()}`, page: pageLabel, text: sentenceText.trim(), name: '나', replies: [] },
      ...prev,
    ]);
    setSentenceText('');
    setSentencePage('');
    setIsAddingSentence(false);
  };

  const handleAddReply = (sentenceId: string) => {
    const message = replyInputs[sentenceId]?.trim();
    if (!message) {
      Alert.alert('안내', '답글을 입력해 주세요.');
      return;
    }
    setSentences((prev) =>
      prev.map((sentence) =>
        sentence.id === sentenceId
          ? {
              ...sentence,
              replies: [
                ...(sentence.replies ?? []),
                { id: `r-${Date.now()}`, name: '나', time: '방금', text: message },
              ],
            }
          : sentence,
      ),
    );
    setReplyInputs((prev) => ({ ...prev, [sentenceId]: '' }));
    setOpenReplyId(null);
  };

  const handleUploadFeed = () => {
    if (!selectedUploadImage && !selectedUploadUri) {
      Alert.alert('안내', '사진을 선택해 주세요.');
      return;
    }
    if (!uploadCaption.trim()) {
      Alert.alert('안내', '사진과 글을 모두 입력해 주세요.');
      return;
    }
    setFeedItems((prev) => [
      {
        id: `feed-${Date.now()}`,
        name: profile.nickname || '나',
        time: '방금',
        image: selectedUploadUri ? { uri: selectedUploadUri } : selectedUploadImage!,
        caption: uploadCaption.trim(),
        likes: 0,
        comments: [],
      },
      ...prev,
    ]);
    setSelectedUploadImage(null);
    setSelectedUploadUri(null);
    setUploadCaption('');
    setIsUploadOpen(false);
  };

  const handleToggleLike = (postId: string) => {
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      const isLiked = next.has(postId);
      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      setFeedItems((items) =>
        items.map((item) =>
          item.id === postId
            ? { ...item, likes: Math.max(0, item.likes + (isLiked ? -1 : 1)) }
            : item,
        ),
      );
      return next;
    });
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진을 선택하려면 사진 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setSelectedUploadUri(uri);
        setSelectedUploadImage(null);
      }
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진을 촬영하려면 카메라 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setSelectedUploadUri(uri);
        setSelectedUploadImage(null);
      }
    }
  };


  const handleAddFeedComment = () => {
    if (!selectedPostId || !feedCommentText.trim()) {
      Alert.alert('안내', '댓글을 입력해 주세요.');
      return;
    }
    const message = feedCommentText.trim();
    setFeedItems((prev) =>
      prev.map((item) =>
        item.id === selectedPostId
          ? {
              ...item,
              comments: [
                ...(item.comments ?? []),
                { id: `fc-${Date.now()}`, name: '나', time: '방금', text: message },
              ],
            }
          : item,
      ),
    );
    setFeedCommentText('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>교환독서 상세 페이지</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.bookCard}>
          <View style={styles.bookCover}>
            <Text style={styles.bookCoverText}>표지</Text>
          </View>
          <View style={styles.bookInfo}>
            <View style={styles.bookTitleRow}>
              <Text style={styles.bookTitle}>{detail.title}</Text>
              <View style={styles.bookTagInline}>
                <Text style={styles.bookTagText}>{detail.tag}</Text>
              </View>
            </View>
            <Text style={styles.bookAuthor}>{detail.author}</Text>
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
                <View style={styles.replySection}>
                  {item.replies && item.replies.length > 0 ? (
                    item.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyRow}>
                        <View style={styles.replyAvatar}>
                          <Text style={styles.replyAvatarText}>
                            {reply.name === '나' ? myEmoji : reply.name.slice(0, 1)}
                          </Text>
                        </View>
                        <View style={styles.replyBody}>
                          <View style={styles.replyHeader}>
                            <Text style={styles.replyName}>{reply.name}</Text>
                            <Text style={styles.replyTime}>{reply.time}</Text>
                          </View>
                          <Text style={styles.replyText}>{reply.text}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.replyEmptyText}>첫 번째 답글을 남겨보세요.</Text>
                  )}
                  {openReplyId === item.id ? (
                    <View style={styles.replyInputRow}>
                      <TextInput
                        value={replyInputs[item.id] ?? ''}
                        onChangeText={(value) =>
                          setReplyInputs((prev) => ({ ...prev, [item.id]: value }))
                        }
                        placeholder="답글을 입력하세요..."
                        placeholderTextColor={Palette.textTertiary}
                        style={styles.replyInput}
                      />
                      <Pressable
                        style={styles.sendButton}
                        onPress={() => handleAddReply(item.id)}
                        accessibilityRole="button">
                        <Text style={styles.sendButtonText}>↗</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.replyToggleButton}
                      onPress={() => setOpenReplyId(item.id)}
                      accessibilityRole="button">
                      <Text style={styles.replyToggleText}>답글 달기</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, styles.feedHeaderRow]}>
            <Text style={styles.sectionTitle}>독서 기록 피드</Text>
            <Pressable
              style={styles.feedUploadButton}
              onPress={() => setIsUploadOpen(true)}
              accessibilityRole="button">
              <Text style={styles.feedUploadText}>업로드</Text>
            </Pressable>
          </View>
          <View style={styles.galleryGrid}>
            {feedItems.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.galleryItem, { width: galleryCardSize }]}
                onPress={() => setSelectedPostId(item.id)}
                accessibilityRole="button">
                <Image source={item.image} style={styles.galleryImage} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={selectedPostId !== null} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <Pressable
              style={styles.previewCloseIcon}
              onPress={() => setSelectedPostId(null)}
              accessibilityRole="button">
              <Text style={styles.previewCloseIconText}>×</Text>
            </Pressable>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.previewContent}>
              {selectedPost && (
                <View style={styles.previewHeaderRow}>
                  <View style={styles.previewUserAvatar}>
                    <Text style={styles.previewUserInitial}>
                      {selectedPost.name === '나' ? myEmoji : selectedPost.name.slice(0, 1)}
                    </Text>
                  </View>
                  <View style={styles.previewUserMeta}>
                    <Text style={styles.previewUserName}>{selectedPost.name}</Text>
                    <Text style={styles.previewUserTime}>{selectedPost.time}</Text>
                  </View>
                </View>
              )}
              {selectedPost && (
                <Image
                  source={selectedPost.image}
                  style={[styles.previewImage, { height: previewImageHeight }]}
                />
              )}
              {selectedPost && (
                <>
                  <Text style={styles.feedCaption}>{selectedPost.caption}</Text>
                  <View style={styles.feedMetaRow}>
                    <Pressable
                      style={styles.likeButton}
                      onPress={() => handleToggleLike(selectedPost.id)}
                      accessibilityRole="button">
                      <Text
                        style={[
                          styles.likeButtonText,
                          likedPostIds.has(selectedPost.id) && styles.likeButtonTextActive,
                        ]}>
                        {likedPostIds.has(selectedPost.id) ? '♥' : '♡'}
                      </Text>
                    </Pressable>
                    <Text style={styles.feedMetaText}>좋아요 {selectedPost.likes}</Text>
                  </View>
                  <View style={styles.feedCommentList}>
                    {selectedPost.comments.length === 0 ? (
                      <Text style={styles.replyEmptyText}>첫 댓글을 남겨보세요.</Text>
                    ) : (
                      selectedPost.comments.map((comment) => (
                        <View key={comment.id} style={styles.replyRow}>
                          <View style={styles.replyAvatar}>
                            <Text style={styles.replyAvatarText}>
                              {comment.name === '나' ? myEmoji : comment.name.slice(0, 1)}
                            </Text>
                          </View>
                          <View style={styles.replyBody}>
                            <View style={styles.replyHeader}>
                              <Text style={styles.replyName}>{comment.name}</Text>
                              <Text style={styles.replyTime}>{comment.time}</Text>
                            </View>
                            <Text style={styles.replyText}>{comment.text}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                  <View style={[styles.replyInputRow, styles.previewReplyInputRow]}>
                    <TextInput
                      value={feedCommentText}
                      onChangeText={setFeedCommentText}
                      placeholder="댓글을 입력하세요..."
                      placeholderTextColor={Palette.textTertiary}
                      style={styles.replyInput}
                    />
                    <Pressable
                      style={[styles.sendButton, styles.previewSendButton]}
                      onPress={handleAddFeedComment}
                      accessibilityRole="button">
                      <Text style={[styles.sendButtonText, styles.previewSendButtonText]}>↗</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isUploadOpen} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.uploadCard}>
            <Text style={styles.uploadTitle}>독서 기록 업로드</Text>
            <View style={styles.uploadHeaderRow}>
              <Text style={styles.uploadLabel}>사진 선택</Text>
              <View style={styles.uploadActionsRow}>
                <Pressable onPress={handlePickPhoto} accessibilityRole="button">
                  <Text style={styles.uploadPickText}>내 사진</Text>
                </Pressable>
                <Pressable onPress={handleTakePhoto} accessibilityRole="button">
                  <Text style={styles.uploadPickText}>직접 촬영</Text>
                </Pressable>
              </View>
            </View>
            {selectedUploadUri && (
              <Image source={{ uri: selectedUploadUri }} style={styles.uploadPreview} />
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gallery.map((item, index) => {
                const isActive = selectedUploadImage === item;
                return (
                  <Pressable
                    key={`upload-${index}`}
                    onPress={() => {
                      setSelectedUploadImage(item);
                      setSelectedUploadUri(null);
                    }}
                    style={[styles.uploadImageOption, isActive && styles.uploadImageActive]}
                    accessibilityRole="button">
                    <Image source={item} style={styles.uploadImage} />
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.uploadLabel}>글 작성</Text>
            <TextInput
              value={uploadCaption}
              onChangeText={setUploadCaption}
              placeholder="독서 기록을 남겨보세요."
              placeholderTextColor={Palette.textTertiary}
              style={styles.uploadInput}
              multiline
            />
            <View style={styles.uploadActions}>
              <Pressable
                style={styles.uploadCancel}
                onPress={() => setIsUploadOpen(false)}
                accessibilityRole="button">
                <Text style={styles.uploadCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.uploadSubmit}
                onPress={handleUploadFeed}
                accessibilityRole="button">
                <Text style={styles.uploadSubmitText}>업로드</Text>
              </Pressable>
            </View>
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
    backgroundColor: 'transparent',
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
    width: 96,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  bookCoverText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
    columnGap: 8,
    marginBottom: 6,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  bookAuthor: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  bookTagInline: {
    backgroundColor: Palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
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
  feedHeaderRow: {
    marginBottom: 12,
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonText: {
    color: Palette.textPrimary,
    fontSize: 20,
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
  replySection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 10,
  },
  replyRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  replyAvatarText: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  replyBody: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  replyTime: {
    fontSize: 10,
    color: Palette.textTertiary,
  },
  replyText: {
    marginTop: 4,
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  replyEmptyText: {
    fontSize: 12,
    color: Palette.textTertiary,
    marginBottom: 10,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  replyInput: {
    flex: 1,
    fontSize: 12,
    color: Palette.textPrimary,
  },
  replyToggleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Palette.accentSoft,
  },
  replyToggleText: {
    fontSize: 12,
    color: Palette.accent,
    fontWeight: '600',
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
    aspectRatio: 1,
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
  feedUploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.textPrimary,
  },
  feedUploadText: {
    fontSize: 12,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  feedCaption: {
    marginTop: 14,
    fontSize: 14,
    color: Palette.textPrimary,
    lineHeight: 20,
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  likeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  likeButtonText: {
    fontSize: 14,
    color: Palette.accent,
  },
  feedMetaText: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  likeButtonTextActive: {
    color: '#E25555',
  },
  feedCommentList: {
    marginTop: 14,
    marginBottom: 12,
    backgroundColor: Palette.background,
    borderRadius: 16,
    padding: 12,
  },
  uploadCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Palette.surface,
    padding: 16,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 12,
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadLabel: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  uploadPickText: {
    fontSize: 12,
    color: Palette.accent,
    fontWeight: '600',
  },
  uploadPreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  uploadImageOption: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    marginRight: 10,
    overflow: 'hidden',
  },
  uploadImageActive: {
    borderColor: Palette.accent,
  },
  uploadImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadInput: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  uploadCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  uploadCancelText: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  uploadSubmit: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.accent,
  },
  uploadSubmitText: {
    fontSize: 12,
    color: Palette.surface,
    fontWeight: '600',
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
    padding: 8,
  },
  previewCard: {
    width: '100%',
    height: '88%',
    maxHeight: '90%',
    borderRadius: 22,
    backgroundColor: Palette.surface,
    padding: 16,
    ...Shadows.card,
  },
  previewContent: {
    paddingTop: 10,
    paddingBottom: 16,
  },
  previewCloseIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewCloseIconText: {
    fontSize: 18,
    color: Palette.textSecondary,
    marginTop: -1,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewUserAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  previewUserInitial: {
    fontSize: 14,
    color: Palette.textSecondary,
  },
  previewUserMeta: {
    flex: 1,
  },
  previewUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  previewUserTime: {
    marginTop: 2,
    fontSize: 11,
    color: Palette.textTertiary,
  },
  previewImage: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: Palette.accentSoft,
    resizeMode: 'cover',
  },
  previewReplyInputRow: {
    marginTop: 4,
  },
  previewSendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  previewSendButtonText: {
    fontSize: 13,
  },
});
