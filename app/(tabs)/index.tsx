import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  gradients,
  getScoreColor,
  getGenreColor,
  getGenreIcon,
} from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRatings } from '../../src/hooks/useRatings';
import {
  Avatar,
  MoviePoster,
  LoadingSpinner,
  GradientButton,
  Button,
  SegmentedControl,
  GenrePill,
  RatingDistribution,
} from '../../src/components';
import { Rating, TasteStats } from '../../src/types';
import { getImageUrl } from '../../src/lib/tmdb';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileTab() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { getUserRatings, getUserTasteStats } = useRatings();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [tasteStats, setTasteStats] = useState<TasteStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ratings');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [filterScore, setFilterScore] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [ratingsResult, statsResult] = await Promise.all([
      getUserRatings(user.id),
      getUserTasteStats(user.id),
    ]);

    if (ratingsResult.data) {
      setRatings(ratingsResult.data);
    }
    setTasteStats(statsResult);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      // recent - sort by created_at descending
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [ratings, filterScore, sortBy]);

  const filteredRatings = getFilteredAndSortedRatings();

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <LoadingSpinner />
      </View>
    );
  }

  // Logged out state - premium landing
  if (!user) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.1)', 'transparent']}
          style={styles.logoGlow}
        />
        <Text style={styles.logo}>VISTA</Text>
        <Text style={styles.tagline}>Own your taste.</Text>
        <View style={styles.authButtons}>
          <GradientButton
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            size="large"
            style={styles.authButton}
          />
          <Button
            title="Create Account"
            onPress={() => router.push('/(auth)/signup')}
            variant="outline"
            style={styles.authButton}
          />
        </View>
      </View>
    );
  }

  // Get top 4 movie posters for background collage
  const topMoviePosters = ratings
    .slice(0, 4)
    .map(r => r.movie_poster)
    .filter((poster): poster is string => poster !== null && poster !== undefined);

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
          <View style={styles.statCard}>
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
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {renderHeaderBackground()}

      {/* Settings icon in corner */}
      <Pressable style={styles.settingsIcon} onPress={() => router.push('/(auth)/edit-profile')}>
        <Ionicons name="settings-outline" size={20} color={colors.textMuted} />
      </Pressable>

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
          <Text style={styles.inlineStats}>
            {tasteStats?.totalRated || 0} Rated  •  {tasteStats?.avgScore || '—'} Avg  •  0 Following
          </Text>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.editButton}
              onPress={() => router.push('/(auth)/edit-profile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
            <Pressable style={styles.shareButton}>
              <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Bio if present */}
      {user.bio && (
        <Text style={styles.bio}>"{user.bio}"</Text>
      )}

      {/* Header Stats Grid */}
      {renderHeaderStatsGrid()}

      {/* Segmented tab control */}
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
      <Text style={styles.emptyTitle}>Your movie journey starts here</Text>
      <Text style={styles.emptyMessage}>
        Rate your first film to begin building your profile
      </Text>
      <GradientButton
        title="Rate a Movie"
        onPress={() => router.push('/rate')}
        style={styles.emptyCta}
        icon={<Ionicons name="add" size={20} color={colors.background} />}
      />
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
              onPress={() => router.push(`/rating/${rating.id}`)}
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
    const remaining = Math.max(0, 5 - ratedCount);

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="sparkles-outline" size={64} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Your taste profile is brewing</Text>
        <Text style={styles.emptyMessage}>
          Rate {remaining} more movie{remaining !== 1 ? 's' : ''} to unlock your taste DNA
        </Text>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${(ratedCount / 5) * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{ratedCount} of 5 movies rated</Text>
        </View>

        {/* Progress circles */}
        <View style={styles.progressCircles}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.progressCircle,
                i <= ratedCount && styles.progressCircleFilled,
              ]}
            >
              {i <= ratedCount && (
                <Ionicons name="checkmark" size={12} color={colors.background} />
              )}
            </View>
          ))}
        </View>

        <GradientButton
          title="Rate Movies"
          onPress={() => router.push('/rate')}
          style={styles.emptyCta}
        />
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
                <View key={actor.id} style={styles.personCard}>
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
                </View>
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
                <View key={director.id} style={styles.personCard}>
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
                </View>
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {renderHeader()}
      {activeTab === 'ratings' ? renderRatingsGrid() : renderTasteSection()}
    </ScrollView>
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
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: '30%',
  },
  logo: {
    fontSize: 56,
    fontWeight: '200',
    color: colors.primary,
    letterSpacing: 16,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    letterSpacing: 1,
  },
  authButtons: {
    width: '100%',
    maxWidth: 300,
  },
  authButton: {
    marginBottom: spacing.md,
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
  settingsIcon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(21, 21, 24, 0.6)',
    borderRadius: borderRadius.full,
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
  inlineStats: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  editButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  shareButton: {
    padding: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
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
  emptyCta: {
    marginTop: spacing.md,
    minWidth: 180,
  },
  progressContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  progressCircles: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
