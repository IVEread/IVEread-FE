import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { Palette, Shadows, Typography } from '@/constants/ui';
import { getPersonEmoji } from '@/constants/people';
import { useFriends } from '@/contexts/friends-context';

export default function FriendsScreen() {
  const router = useRouter();
  const { friends, addFriend } = useFriends();
  const [newFriend, setNewFriend] = useState('');
  const friendsIllustration = require('../assets/images/image-Photoroom3.png');

  const handleAddFriend = () => {
    const trimmed = newFriend.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('안내', '추가할 친구 아이디(이메일)를 입력해 주세요.');
      return;
    }
    const name = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
    addFriend({ name, email: trimmed });
    setNewFriend('');
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
          <Text style={styles.headerTitle}>친구 목록</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.addRow}>
            <Text style={styles.label}>친구 추가</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={newFriend}
                onChangeText={setNewFriend}
                placeholder="친구 아이디(이메일)"
                placeholderTextColor={Palette.textTertiary}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleAddFriend}
              />
            <Pressable
              style={styles.addAction}
              onPress={handleAddFriend}
              accessibilityRole="button">
              <Text style={styles.addActionText}>추가</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.illustrationCard}>
          <Image source={friendsIllustration} style={styles.illustrationImage} />
        </View>

        <View style={styles.list}>
          {friends.map((friend, index) => (
            <View key={`${friend.email}-${index}`} style={styles.friendCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getPersonEmoji(friend.name)}</Text>
              </View>
              <View>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendMeta}>{friend.email}</Text>
              </View>
            </View>
          ))}
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
  addRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Palette.textPrimary,
    backgroundColor: Palette.surface,
  },
  addAction: {
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Palette.accent,
    ...Shadows.card,
  },
  addActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.surface,
  },
  list: {
    gap: 12,
  },
  illustrationCard: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 10,
  },
  illustrationImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    borderRadius: 14,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  friendMeta: {
    ...Typography.caption,
    marginTop: 4,
  },
});
