import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  getScoreColor,
  getGenreColor,
  getGenreIcon,
} from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRatings } from '../../src/hooks/useRatings';
import { useSocial } from '../../src/hooks/useSocial';
import {
  Avatar,
  MoviePoster,
  LoadingSpinner,
  SegmentedControl,
  GenrePill,
  RatingDistribution,
  TasteMatchBadge,
} from '../../src/components';
import { Rating, TasteStats, User, TasteMatchResult } from '../../src/types';
import { getImageUrl } from '../../src/lib/tmdb';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SortOption = 'recent' | 'highest' | 'lowest';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { getUserRatings, getUserTasteStats, getTasteMatch } = useRatings();
  const { getUserById, getFollowCounts, isFollowing, followUser, unfollowUser, blockUser, reportContent } = useSocial();

  const [user, setUser] = useState<User | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [tasteStats, setTasteStats] = useState<TasteStats | null>(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [tasteMatch, setTasteMatch] = useState<TasteMatchResult>({
    score: null,
    overlapCount: 0,
    status: 'loading',
  });

  // Tab and filter state
  const [activeTab, setActiveTab] = useState<string>('ratings');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterScore, setFilterScore] = useState<number | null>(null);

  const isOwnProfile = currentUser?.id === id;

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      const [userData, ratingsResult, stats, counts] = await Promise.all([
        getUserById(id),
        getUserRatings(id, 'watched_at', 'desc'),
        getUserTasteStats(id),
        getFollowCounts(id),
      ]);

      if (userData.data) {
        setUser(userData.data);
      }
      if (ratingsResult.data) {
        setRatings(ratingsResult.data);
      }
      setTasteStats(stats);
      setFollowCounts(counts);

      // Check if current user follows this user and calculate taste match
      if (currentUser && currentUser.id !== id) {
        const [followResult, matchResult] = await Promise.all([
          isFollowing(currentUser.id, id),
          getTasteMatch(currentUser.id, id),
        ]);
        setIsFollowingUser(followResult.isFollowing);
        setTasteMatch(matchResult);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!currentUser || !id) return;

    setFollowLoading(true);
    if (isFollowingUser) {
      await unfollowUser(currentUser.id, id);
      setIsFollowingUser(false);
      setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
    } else {
      await followUser(currentUser.id, id);
      setIsFollowingUser(true);
      setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
    }
    setFollowLoading(false);
  };

  const handleBlockUser = () => {
    if (!currentUser || !id || isOwnProfile) return;

    Alert.alert(
      'Block User',
      `Block ${user?.display_name}? They won't be able to see your content, and their content will be hidden from your feed. You will also unfollow each other.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            const { error } = await blockUser(currentUser.id, id);
            if (error) {
              Alert.alert('Error', 'Failed to block user. Please try again.');
            } else {
              setIsFollowingUser(false);
              Alert.alert('User Blocked', `${user?.display_name} has been blocked.`);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleReportUser = () => {
    if (!currentUser || !id) return;

    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Spam', onPress: () => submitUserReport('Spam') },
        { text: 'Harassment', onPress: () => submitUserReport('Harassment') },
        { text: 'Inappropriate Content', onPress: () => submitUserReport('Inappropriate content') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitUserReport = async (reason: string) => {
    if (!currentUser || !id) return;

    const { error } = await reportContent(currentUser.id, reason, { userId: id });
    if (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } else {
      Alert.alert('Report Submitted', 'Thank you for reporting. We will review this within 24 hours.');
    }
  };

  // Get top genre for avatar ring color
  const topGenre = tasteStats?.topGenres?.[0]?.genre;

  // Filter and sort ratings
  const getFilteredAndSortedRatings = useCallback(() => {
    let filtered = [...ratings];

    // Apply score filter
    if (filterScore !== null) {
      if (filterScore === 90) {
        filtered = filtered.filter(r => r.score >= 90);
      } else if (filterScore === 70) {
        filtered = filtered.filter(r => r.score >= 70 && r.score < 90);
      } else if (filterScore === 50) {
        filtered = filtered.filter(r => r.score >= 50 && r.score < 70);
      } else {
        filtered = filtered.filter(r => r.score < 50);
      }
    }

    // Apply sorting
    if (sortBy === 'highest') {
      filtered.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.score - b.score);
    } else {
      // recent - sort by watched_at descending (when the movie was actually seen)
      filtered.sort((a, b) => {
        const dateA = new Date(a.watched_at || a.created_at).getTime();
        const dateB = new Date(b.watched_at || b.created_at).getTime();
        return dateB - dateA;
      });
    }

    return filtered;
  }, [ratings, filterScore, sortBy]);

  const filteredRatings = getFilteredAndSortedRatings();

  // Get top 4 movie posters for background collage
  const topMoviePosters = ratings
    .slice(0, 4)
    .map(r => r.movie_poster)
    .filter((poster): poster is string => poster !== null && poster !== undefined);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const renderHeaderBackground = () => {
    if (topMoviePosters.length >= 4) {
      return (
        <View style={styles.headerBgContainer}>
          <View style={styles.posterCollage}>
            {topMoviePosters.map((poster, index) => (
              <Image
                key={index}
                source={{ uri: getImageUrl(poster, 'w342') || '' }}
                style={styles.collageImage}
                blurRadius={20}
              />
            ))}
          </View>
          <LinearGradient
            colors={['rgba(10, 10, 11, 0.85)', colors.background]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      );
    }

    return (
      <LinearGradient
        colors={['rgba(245, 158, 11, 0.08)', colors.background]}
        style={styles.headerBgContainer}
      />
    );
  };

  // Header stats grid (2x2)
  const renderHeaderStatsGrid = () => {
    if (!tasteStats || tasteStats.totalRated === 0) return null;

    const allTimeFavorite = tasteStats.topAllTime[0];
    const recentFavorite = tasteStats.topRecent[0];
    const topGenreData = tasteStats.topGenres[0];
    const topPerformer = tasteStats.topActors[0];

    return (
      <View style={styles.statsGrid}>
        {/* Row 1 */}
        <View style={styles.statsRow}>
          {/* All Time Favorite */}
          <Pressable
            style={styles.statCard}
            onPress={() => allTimeFavorite && router.push(`/movie/${allTimeFavorite.movie_id}`)}
            disabled={!allTimeFavorite}
          >
            {allTimeFavorite?.movie_poster ? (
              <Image
                source={{ uri: getImageUrl(allTimeFavorite.movie_poster, 'w92') || '' }}
                style={styles.statPoster}
              />
            ) : (
              <View style={[styles.statPoster, styles.statPosterPlaceholder]}>
                <Ionicons name="film-outline" size={20} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>All-Time Favorite</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {allTimeFavorite?.movie_title || '—'}
              </Text>
            </View>
          </Pressable>

          {/* Recent Favorite */}
          <Pressable
            style={styles.statCard}
            onPress={() => recentFavorite && router.push(`/movie/${recentFavorite.movie_id}`)}
            disabled={!recentFavorite}
          >
            {recentFavorite?.movie_poster ? (
              <Image
                source={{ uri: getImageUrl(recentFavorite.movie_poster, 'w92') || '' }}
                style={styles.statPoster}
              />
            ) : (
              <View style={[styles.statPoster, styles.statPosterPlaceholder]}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Recent Favorite</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {recentFavorite?.movie_title || '—'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Row 2 */}
        <View style={styles.statsRow}>
          {/* Top Genre */}
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: topGenreData ? getGenreColor(topGenreData.genre) + '20' : colors.surface }]}>
              <Ionicons
                name={(topGenreData ? getGenreIcon(topGenreData.genre) : 'layers') as any}
                size={20}
                color={topGenreData ? getGenreColor(topGenreData.genre) : colors.textMuted}
              />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Top Genre</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {topGenreData?.genre || '—'}
              </Text>
            </View>
          </View>

          {/* Top Performer */}
          <Pressable
            style={styles.statCard}
            onPress={() => topPerformer && router.push(`/person/${topPerformer.id}`)}
            disabled={!topPerformer}
          >
            {topPerformer?.profile_path ? (
              <Image
                source={{ uri: getImageUrl(topPerformer.profile_path, 'w92') || '' }}
                style={styles.statAvatar}
              />
            ) : (
              <View style={[styles.statAvatar, styles.statAvatarPlaceholder]}>
                <Ionicons name="person" size={18} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Top Performer</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {topPerformer?.name || '—'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {renderHeaderBackground()}

      {/* Horizontal Profile Header */}
      <View style={styles.profileHorizontal}>
        {/* Avatar with glowing ring - LEFT side */}
        <Avatar
          uri={user.avatar_url}
          name={user.display_name}
          size="profile"
          showRing
          ringColor={topGenre ? getGenreColor(topGenre) : undefined}
        />

        {/* Info section - RIGHT side */}
        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{user.display_name}</Text>
          <Text style={styles.username}>@{user.username}</Text>

          {/* Compact inline stats */}
          <View style={styles.inlineStatsRow}>
            <Text style={styles.inlineStats}>
              {tasteStats?.totalRated || 0} Rated  •  {tasteStats?.avgScore || '—'} Avg
            </Text>
            <Text style={styles.inlineStatsDot}>  •  </Text>
            <Pressable onPress={() => router.push(`/followers?userId=${id}&tab=followers`)}>
              <Text style={styles.inlineStatsLink}>{followCounts.followers} Followers</Text>
            </Pressable>
            <Text style={styles.inlineStatsDot}>  •  </Text>
            <Pressable onPress={() => router.push(`/followers?userId=${id}&tab=following`)}>
              <Text style={styles.inlineStatsLink}>{followCounts.following} Following</Text>
            </Pressable>
          </View>

          {/* Follow button and Taste Match for other users */}
          {!isOwnProfile && currentUser && (
            <View style={styles.actionRow}>
              <TasteMatchBadge result={tasteMatch} />
              <Pressable
                style={[
                  styles.followButton,
                  isFollowingUser && styles.followingButton,
                ]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <Text style={[
                    styles.followButtonText,
                    isFollowingUser && styles.followingButtonText,
                  ]}>
                    {isFollowingUser ? 'Following' : 'Follow'}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Bio if present */}
      {user.bio && (
        <Text style={styles.bio}>"{user.bio}"</Text>
      )}

      {/* Header Stats Grid */}
      {renderHeaderStatsGrid()}

      {/* Segmented tab control - "Taste" instead of "My Taste" for other users */}
      <View style={styles.tabContainer}>
        <SegmentedControl
          segments={[
            { key: 'ratings', label: 'Ratings', icon: '▦' },
            { key: 'taste', label: 'Taste', icon: '✨' },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </View>
    </View>
  );

  const renderRatingsEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="film-outline" size={64} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No ratings yet</Text>
      <Text style={styles.emptyMessage}>
        {user.display_name} hasn't rated any movies yet
      </Text>
    </View>
  );

  const renderRatingsGrid = () => {
    if (ratings.length === 0) {
      return renderRatingsEmpty();
    }

    const scoreFilters = [
      { value: null, label: 'All' },
      { value: 90, label: '90+' },
      { value: 70, label: '70-89' },
      { value: 50, label: '50-69' },
      { value: 0, label: '<50' },
    ];

    const sortOptions = [
      { value: 'recent', label: 'Recent' },
      { value: 'highest', label: 'Highest' },
      { value: 'lowest', label: 'Lowest' },
    ];

    return (
      <View style={styles.ratingsContainer}>
        {/* Filter & Sort Controls */}
        <View style={styles.controlsContainer}>
          {/* Score filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {scoreFilters.map((filter) => (
              <Pressable
                key={filter.label}
                style={[
                  styles.filterPill,
                  filterScore === filter.value && styles.filterPillActive,
                ]}
                onPress={() => setFilterScore(filter.value)}
              >
                <Text style={[
                  styles.filterPillText,
                  filterScore === filter.value && styles.filterPillTextActive,
                ]}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Sort options */}
          <View style={styles.sortContainer}>
            <Ionicons name="swap-vertical" size={14} color={colors.textMuted} />
            {sortOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() => setSortBy(option.value as typeof sortBy)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ratings count */}
        <View style={styles.ratingsHeader}>
          <Text style={styles.ratingsCount}>
            {filteredRatings.length === ratings.length
              ? `${ratings.length} Films Rated`
              : `${filteredRatings.length} of ${ratings.length} Films`}
          </Text>
        </View>

        {/* Empty filter state */}
        {filteredRatings.length === 0 && ratings.length > 0 && (
          <View style={styles.emptyFilterContainer}>
            <Ionicons name="filter-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyFilterText}>No films match this filter</Text>
            <Pressable onPress={() => setFilterScore(null)}>
              <Text style={styles.clearFilterText}>Clear filter</Text>
            </Pressable>
          </View>
        )}

        {/* Ratings grid - 3 columns with score on poster, title below */}
        <View style={styles.ratingsGrid}>
          {filteredRatings.map((rating) => (
            <Pressable
              key={rating.id}
              style={({ pressed }) => [
                styles.ratingItem,
                pressed && styles.ratingItemPressed,
              ]}
              onPress={() => router.push(`/movie/${rating.movie_id}`)}
            >
              <View style={styles.posterContainer}>
                <View style={styles.posterInner}>
                  <MoviePoster posterPath={rating.movie_poster || null} size="small" />
                </View>
                {/* Score badge on poster - top right, overlapping edge */}
                <View style={styles.scoreBadgeOverlay}>
                  <View style={[
                    styles.scoreCircle,
                    { backgroundColor: getScoreColor(rating.score) }
                  ]}>
                    <Text style={styles.scoreText}>{rating.score}</Text>
                  </View>
                </View>
              </View>
              {/* Title below poster */}
              <Text style={styles.ratingMovieTitle} numberOfLines={1}>
                {rating.movie_title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderTasteEmpty = () => {
    const ratedCount = tasteStats?.totalRated || 0;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="sparkles-outline" size={64} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Taste profile coming soon</Text>
        <Text style={styles.emptyMessage}>
          {user.display_name} needs to rate {Math.max(0, 5 - ratedCount)} more movie{Math.max(0, 5 - ratedCount) !== 1 ? 's' : ''} to unlock their taste profile
        </Text>
      </View>
    );
  };

  // Tiered Favorites Component
  const renderTieredFavorites = (movies: Rating[], title: string, icon: string) => {
    if (!movies || movies.length === 0) return null;

    const top3 = movies.slice(0, 3);

    return (
      <View style={styles.tieredSection}>
        <Text style={styles.tasteSectionTitle}>
          <Ionicons name={icon as any} size={16} color={colors.primary} /> {title}
        </Text>
        <View style={styles.tieredContainer}>
          {/* #1 - Large (left side) */}
          <Pressable
            style={styles.tieredPrimary}
            onPress={() => router.push(`/movie/${top3[0].movie_id}`)}
          >
            <View style={styles.tieredPrimaryPoster}>
              <MoviePoster posterPath={top3[0].movie_poster || null} size="large" />
              <View style={styles.tieredPrimaryBadge}>
                <View style={[styles.tieredScoreCircleLg, { backgroundColor: getScoreColor(top3[0].score) }]}>
                  <Text style={styles.tieredScoreTextLg}>{top3[0].score}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.tieredPrimaryTitle} numberOfLines={2}>
              {top3[0].movie_title}
            </Text>
            <Text style={styles.tieredPrimaryYear}>{top3[0].movie_year}</Text>
          </Pressable>

          {/* #2 and #3 - Stacked on right */}
          {top3.length > 1 && (
            <View style={styles.tieredSecondaryStack}>
              {/* #2 */}
              <Pressable
                style={styles.tieredSecondaryItem}
                onPress={() => router.push(`/movie/${top3[1].movie_id}`)}
              >
                <View style={styles.tieredSecondaryPoster}>
                  <MoviePoster posterPath={top3[1].movie_poster || null} size="medium" />
                  <View style={styles.tieredSecondaryBadge}>
                    <View style={[styles.tieredScoreCircleMd, { backgroundColor: getScoreColor(top3[1].score) }]}>
                      <Text style={styles.tieredScoreTextMd}>{top3[1].score}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.tieredSecondaryTitle} numberOfLines={1}>
                  {top3[1].movie_title}
                </Text>
              </Pressable>

              {/* #3 */}
              {top3[2] && (
                <Pressable
                  style={styles.tieredTertiaryItem}
                  onPress={() => router.push(`/movie/${top3[2].movie_id}`)}
                >
                  <View style={styles.tieredTertiaryPoster}>
                    <MoviePoster posterPath={top3[2].movie_poster || null} size="small" />
                    <View style={styles.tieredTertiaryBadge}>
                      <View style={[styles.tieredScoreCircleSm, { backgroundColor: getScoreColor(top3[2].score) }]}>
                        <Text style={styles.tieredScoreTextSm}>{top3[2].score}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.tieredTertiaryTitle} numberOfLines={1}>
                    {top3[2].movie_title}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTasteSection = () => {
    if (!tasteStats || tasteStats.totalRated < 5) {
      return renderTasteEmpty();
    }

    return (
      <View style={styles.tasteContainer}>
        {/* All-Time Favorites (Tiered) */}
        {renderTieredFavorites(tasteStats.topAllTime, 'All-Time Favorites', 'trophy')}

        {/* Recent Favorites (Tiered) - only show if there are recent ratings */}
        {tasteStats.topRecent.length > 0 && renderTieredFavorites(tasteStats.topRecent, 'Recent Favorites', 'time')}

        {/* Top Genres */}
        {tasteStats.topGenres.length > 0 && (
          <View style={styles.tasteSection}>
            <Text style={styles.tasteSectionTitle}>
              <Ionicons name="layers" size={16} color={colors.primary} /> Top Genres
            </Text>
            <View style={styles.genrePillsContainer}>
              {tasteStats.topGenres.map((genre) => (
                <GenrePill
                  key={genre.genre}
                  genre={genre.genre}
                  score={genre.avgScore}
                  count={genre.count}
                />
              ))}
            </View>
          </View>
        )}

        {/* Favorite Actors */}
        {tasteStats.topActors.length > 0 && (
          <View style={styles.tasteSection}>
            <Text style={styles.tasteSectionTitle}>
              <Ionicons name="people" size={16} color={colors.primary} /> Favorite Actors
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.peopleScroll}
            >
              {tasteStats.topActors.map((actor) => (
                <Pressable key={actor.id} style={styles.personCard} onPress={() => router.push(`/person/${actor.id}`)}>
                  <Avatar
                    uri={actor.profile_path ? getImageUrl(actor.profile_path, 'w185') : null}
                    name={actor.name}
                    size="large"
                  />
                  <Text style={styles.personName} numberOfLines={1}>
                    {actor.name}
                  </Text>
                  <Text style={[styles.personScore, { color: getScoreColor(actor.avgScore) }]}>
                    {actor.avgScore}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Favorite Directors */}
        {tasteStats.topDirectors.length > 0 && (
          <View style={styles.tasteSection}>
            <Text style={styles.tasteSectionTitle}>
              <Ionicons name="videocam" size={16} color={colors.primary} /> Favorite Directors
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.peopleScroll}
            >
              {tasteStats.topDirectors.map((director) => (
                <Pressable key={director.id} style={styles.personCard} onPress={() => router.push(`/person/${director.id}`)}>
                  <Avatar
                    uri={director.profile_path ? getImageUrl(director.profile_path, 'w185') : null}
                    name={director.name}
                    size="large"
                  />
                  <Text style={styles.personName} numberOfLines={1}>
                    {director.name}
                  </Text>
                  <Text style={[styles.personScore, { color: getScoreColor(director.avgScore) }]}>
                    {director.avgScore}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Rating Distribution */}
        <View style={styles.tasteSection}>
          <Text style={styles.tasteSectionTitle}>
            <Ionicons name="bar-chart" size={16} color={colors.primary} /> Rating Distribution
          </Text>
          <RatingDistribution ratings={ratings} />
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: user.display_name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: !isOwnProfile && currentUser
            ? () => (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Options',
                      '',
                      [
                        { text: 'Report User', onPress: handleReportUser },
                        { text: 'Block User', style: 'destructive', onPress: handleBlockUser },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                  style={styles.headerMenuButton}
                >
                  <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                </Pressable>
              )
            : undefined,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderHeader()}
        {activeTab === 'ratings' ? renderRatingsGrid() : renderTasteSection()}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  headerMenuButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  // Header styles
  header: {
    position: 'relative',
    paddingBottom: spacing.md,
  },
  headerBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  posterCollage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    opacity: 0.12,
  },
  collageImage: {
    width: '50%',
    height: '50%',
  },
  profileHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 1,
  },
  inlineStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  inlineStats: {
    fontSize: 13,
    color: colors.textMuted,
  },
  inlineStatsDot: {
    fontSize: 13,
    color: colors.textMuted,
  },
  inlineStatsLink: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bio: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: colors.surface,
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

  // Header Stats Grid (2x2)
  statsGrid: {
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  statPoster: {
    width: 36,
    height: 54,
    borderRadius: borderRadius.sm,
  },
  statPosterPlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statAvatarPlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },

  tabContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },

  // Empty states
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    marginBottom: spacing.lg,
    lineHeight: 22,
  },

  // Ratings grid
  ratingsContainer: {
    paddingTop: spacing.sm,
  },
  controlsContainer: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  filterPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.background,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  sortOption: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sortOptionActive: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  sortOptionTextActive: {
    color: colors.primary,
  },
  ratingsHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  ratingsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptyFilterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyFilterText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  ratingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
  },
  ratingItem: {
    width: '33.33%',
    padding: spacing.xs,
    alignItems: 'center',
  },
  ratingItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  posterContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'visible',
    ...shadows.sm,
  },
  posterInner: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  scoreBadgeOverlay: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 10,
  },
  scoreCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.lg,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.background,
  },
  ratingMovieTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },

  // Taste section
  tasteContainer: {
    padding: spacing.md,
  },
  tasteSection: {
    marginBottom: spacing.lg,
  },
  tasteSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Tiered Favorites
  tieredSection: {
    marginBottom: spacing.xl,
  },
  tieredContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tieredPrimary: {
    flex: 2,
  },
  tieredPrimaryPoster: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.lg,
    overflow: 'visible',
    ...shadows.lg,
  },
  tieredPrimaryBadge: {
    position: 'absolute',
    top: -12,
    right: -8,
    zIndex: 10,
  },
  tieredPrimaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  tieredPrimaryYear: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  tieredSecondaryStack: {
    flex: 1,
    gap: spacing.sm,
  },
  tieredSecondaryItem: {
    flex: 1,
  },
  tieredSecondaryPoster: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.md,
    overflow: 'visible',
    ...shadows.md,
  },
  tieredSecondaryBadge: {
    position: 'absolute',
    top: -8,
    right: -6,
    zIndex: 10,
  },
  tieredSecondaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  tieredTertiaryItem: {
    flex: 1,
  },
  tieredTertiaryPoster: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.md,
    overflow: 'visible',
    ...shadows.sm,
  },
  tieredTertiaryBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    zIndex: 10,
  },
  tieredTertiaryTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  // Solid score circles for tiered favorites (matching ratings grid style)
  tieredScoreCircleLg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.lg,
  },
  tieredScoreTextLg: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.background,
  },
  tieredScoreCircleMd: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.lg,
  },
  tieredScoreTextMd: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.background,
  },
  tieredScoreCircleSm: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.lg,
  },
  tieredScoreTextSm: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.background,
  },

  genrePillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  peopleScroll: {
    paddingRight: spacing.md,
  },
  personCard: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 80,
  },
  personName: {
    fontSize: 12,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  personScore: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
