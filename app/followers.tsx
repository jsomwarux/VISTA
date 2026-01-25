import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../src/constants/theme';
import { useSocial } from '../src/hooks/useSocial';
import { useAuth } from '../src/hooks/useAuth';
import { Avatar, LoadingSpinner, SegmentedControl } from '../src/components';
import { User } from '../src/types';

export default function FollowersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, tab } = useLocalSearchParams<{ userId: string; tab?: string }>();
  const { user: currentUser } = useAuth();
  const { getFollowers, getFollowing, followUser, unfollowUser, isFollowing, getUserById } = useSocial();

  const [activeTab, setActiveTab] = useState<string>(tab || 'followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [profileUser, setProfileUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;

    setLoading(true);
    const [followersResult, followingResult, userResult] = await Promise.all([
      getFollowers(userId),
      getFollowing(userId),
      getUserById(userId),
    ]);

    if (followersResult.data) {
      setFollowers(followersResult.data);
    }
    if (followingResult.data) {
      setFollowing(followingResult.data);
    }
    if (userResult.data) {
      setProfileUser(userResult.data);
    }

    // Check follow status for each user if logged in
    if (currentUser) {
      const allUsers = [...(followersResult.data || []), ...(followingResult.data || [])];
      const uniqueUsers = Array.from(new Set(allUsers.map(u => u.id)));
      const statusMap: Record<string, boolean> = {};

      await Promise.all(
        uniqueUsers.map(async (uid) => {
          if (uid !== currentUser.id) {
            const result = await isFollowing(currentUser.id, uid);
            statusMap[uid] = result.isFollowing;
          }
        })
      );

      setFollowingStatus(statusMap);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUser) return;

    const isCurrentlyFollowing = followingStatus[targetUserId];

    // Optimistic update
    setFollowingStatus(prev => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

    if (isCurrentlyFollowing) {
      const { error } = await unfollowUser(currentUser.id, targetUserId);
      if (error) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
      }
    } else {
      const { error } = await followUser(currentUser.id, targetUserId);
      if (error) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
      }
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isOwnProfile = currentUser?.id === item.id;
    const isFollowingUser = followingStatus[item.id];

    return (
      <Pressable
        style={styles.userItem}
        onPress={() => router.push(`/user/${item.id}`)}
      >
        <Avatar
          uri={item.avatar_url}
          name={item.display_name}
          size="medium"
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.display_name}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        {!isOwnProfile && currentUser && (
          <Pressable
            style={[
              styles.followButton,
              isFollowingUser && styles.followingButton,
            ]}
            onPress={() => handleToggleFollow(item.id)}
          >
            <Text style={[
              styles.followButtonText,
              isFollowingUser && styles.followingButtonText,
            ]}>
              {isFollowingUser ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  const currentList = activeTab === 'followers' ? followers : following;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
        size={48}
        color={colors.textMuted}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone'}
      </Text>
      <Text style={styles.emptyMessage}>
        {activeTab === 'followers'
          ? 'When people follow this profile, they\'ll appear here.'
          : 'When this profile follows people, they\'ll appear here.'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {profileUser?.display_name || 'User'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {profileUser?.display_name || 'User'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        <SegmentedControl
          segments={[
            { key: 'followers', label: `${followers.length} Followers` },
            { key: 'following', label: `${following.length} Following` },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <FlatList
        data={currentList}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  tabContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
  },
  followingButtonText: {
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
