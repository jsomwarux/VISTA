import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRatings } from '../../src/hooks/useRatings';
import { useSocial } from '../../src/hooks/useSocial';
import { RatingCard, LoadingSpinner, Avatar, GradientButton } from '../../src/components';
import { Rating, User } from '../../src/types';
import { dataCache } from '../../src/lib/cache';

export default function FriendsTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { getFeedRatings } = useRatings();
  const { searchUsers, likeRating, unlikeRating } = useSocial();

  const [feedRatings, setFeedRatings] = useState<Rating[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const loadFeed = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Check cache first
    if (!forceRefresh) {
      const cachedFeed = dataCache.get<Rating[]>(`feed_${user.id}`);
      if (cachedFeed) {
        setFeedRatings(cachedFeed);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const result = await getFeedRatings(user.id);
    if (result.data) {
      setFeedRatings(result.data);
      dataCache.set(`feed_${user.id}`, result.data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed(true); // Force refresh bypasses cache
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const result = await searchUsers(searchQuery.trim());
    if (result.data) {
      setSearchResults(result.data.filter(u => u.id !== user?.id));
    }
    setSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLike = async (rating: Rating) => {
    if (!user) return;

    if (rating.has_liked) {
      await unlikeRating(rating.id, user.id);
      setFeedRatings(prev =>
        prev.map(r =>
          r.id === rating.id
            ? { ...r, has_liked: false, likes_count: (r.likes_count || 1) - 1 }
            : r
        )
      );
    } else {
      await likeRating(rating.id, user.id);
      setFeedRatings(prev =>
        prev.map(r =>
          r.id === rating.id
            ? { ...r, has_liked: true, likes_count: (r.likes_count || 0) + 1 }
            : r
        )
      );
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Logged out state
  if (!user) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
        </View>
        <Text style={styles.title}>See what friends are watching</Text>
        <Text style={styles.subtitle}>Sign in to follow friends and see their ratings</Text>
        <GradientButton
          title="Sign In"
          onPress={() => router.push('/(auth)/login')}
          style={styles.ctaButton}
        />
      </View>
    );
  }

  // Show search results when searching
  const showSearchResults = searchQuery.length > 0;

  const renderSearchResults = () => {
    if (searching) {
      return (
        <View style={styles.searchResultsLoading}>
          <LoadingSpinner />
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery) {
      return (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={32} color={colors.textMuted} />
          <Text style={styles.noResultsText}>No users found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.userList}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.userItem,
              pressed && styles.userItemPressed,
            ]}
            onPress={() => {
              clearSearch();
              router.push(`/user/${item.id}`);
            }}
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
            <View style={styles.viewProfileButton}>
              <Text style={styles.viewProfileText}>View</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </Pressable>
        )}
      />
    );
  };

  const renderFeed = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      );
    }

    if (feedRatings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyMessage}>
            Follow some friends to see their ratings here. Use the search bar above to find people!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={feedRatings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <RatingCard
            rating={item}
            showUser
            onPress={() => router.push(`/rating/${item.id}`)}
            onUserPress={() => router.push(`/user/${item.user_id}`)}
            onMoviePress={() => router.push(`/movie/${item.movie_id}`)}
            onLike={() => handleLike(item)}
            onComment={() => router.push(`/rating/${item.id}`)}
          />
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused,
        ]}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for friends..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => !searchQuery && setIsSearchFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {showSearchResults ? renderSearchResults() : renderFeed()}
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  ctaButton: {
    minWidth: 180,
  },

  // Search bar
  searchWrapper: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.xs,
  },

  // Feed
  feedList: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Search results
  searchResultsLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  noResultsText: {
    fontSize: 15,
    color: colors.textMuted,
  },

  // User list
  userList: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  userItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 2,
  },
});
