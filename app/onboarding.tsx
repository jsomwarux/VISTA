import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Animated,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  gradients,
  getScoreColor,
} from '../src/constants/theme';
import { useAuth } from '../src/hooks/useAuth';
import { useRatings } from '../src/hooks/useRatings';
import { getPopularMovies, getTopRatedMovies, searchMovies, getMovieDetails } from '../src/lib/tmdb';
import { getImageUrl } from '../src/lib/tmdb';
import {
  SearchBar,
  SegmentedControl,
  GradientButton,
  LoadingSpinner,
} from '../src/components';
import { QuickRateCard } from '../src/components/QuickRateCard';
import { Movie } from '../src/types';

const TARGET_RATINGS = 8;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fromSignup } = useLocalSearchParams<{ fromSignup?: string }>();
  const { user } = useAuth();
  const { createRating, getUserRatings } = useRatings();

  const [mode, setMode] = useState<string>('popular');
  const [ratedCount, setRatedCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Popular mode state
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [popularPage, setPopularPage] = useState(1);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // Search mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedSearchMovie, setSelectedSearchMovie] = useState<Movie | null>(null);

  // Rating state
  const [score, setScore] = useState(75);
  const [seenRecently, setSeenRecently] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Already rated movie IDs
  const [ratedMovieIds, setRatedMovieIds] = useState<Set<number>>(new Set());

  // Celebration animation
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Load existing ratings to filter them out
  useEffect(() => {
    if (user) {
      loadExistingRatings();
    }
  }, [user]);

  // Load popular movies
  useEffect(() => {
    loadPopularMovies(1);
  }, []);

  const loadExistingRatings = async () => {
    if (!user) return;
    const { data } = await getUserRatings(user.id);
    if (data) {
      const ids = new Set(data.map(r => r.movie_id));
      setRatedMovieIds(ids);
      setRatedCount(data.length >= TARGET_RATINGS ? TARGET_RATINGS : data.length);
      if (data.length >= TARGET_RATINGS) {
        setCompleted(true);
      }
    }
  };

  const loadPopularMovies = async (page: number) => {
    try {
      setLoadingPopular(true);

      // Fetch both popular (current) and top-rated (all-time) in parallel
      const [popularResult, topRatedResult] = await Promise.all([
        getPopularMovies(page),
        getTopRatedMovies(page),
      ]);

      // Interleave: top-rated, popular, top-rated, popular...
      // This gives a mix of classics and recent movies for diverse scores
      const interleaved: Movie[] = [];
      const seenIds = new Set<number>();
      const maxLen = Math.max(topRatedResult.results.length, popularResult.results.length);

      for (let i = 0; i < maxLen; i++) {
        if (i < topRatedResult.results.length) {
          const m = topRatedResult.results[i];
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            interleaved.push(m);
          }
        }
        if (i < popularResult.results.length) {
          const m = popularResult.results[i];
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            interleaved.push(m);
          }
        }
      }

      // Fetch full details for genres
      const moviesWithDetails = await Promise.all(
        interleaved.map(async (m) => {
          try {
            return await getMovieDetails(m.id);
          } catch {
            return m;
          }
        })
      );

      if (page === 1) {
        setPopularMovies(moviesWithDetails);
      } else {
        setPopularMovies(prev => [...prev, ...moviesWithDetails]);
      }
      setPopularPage(page);
    } catch (error) {
      console.error('Failed to load popular movies:', error);
    } finally {
      setLoadingPopular(false);
    }
  };

  // Get the current movie (filter out already-rated)
  const getAvailableMovies = useCallback(() => {
    return popularMovies.filter(m => !ratedMovieIds.has(m.id));
  }, [popularMovies, ratedMovieIds]);

  const currentMovie = getAvailableMovies()[currentMovieIndex] || null;

  // Load more popular movies when running low
  useEffect(() => {
    const available = getAvailableMovies();
    if (available.length > 0 && currentMovieIndex >= available.length - 3 && !loadingPopular) {
      loadPopularMovies(popularPage + 1);
    }
  }, [currentMovieIndex, popularMovies, ratedMovieIds]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoadingSearch(true);
    try {
      const result = await searchMovies(query);
      // Filter out already-rated movies
      setSearchResults(result.results.filter(m => !ratedMovieIds.has(m.id)));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectSearchMovie = async (movie: Movie) => {
    try {
      // Fetch full details for genres
      const details = await getMovieDetails(movie.id);
      setSelectedSearchMovie(details);
      setScore(75);
      setSeenRecently(false);
    } catch {
      setSelectedSearchMovie(movie);
      setScore(75);
      setSeenRecently(false);
    }
  };

  const handleRate = async () => {
    if (!user) return;

    const movieToRate = mode === 'popular' ? currentMovie : selectedSearchMovie;
    if (!movieToRate) return;

    setSubmitting(true);
    const year = movieToRate.release_date ? movieToRate.release_date.substring(0, 4) : '';

    // If not seen recently, set watched_at to 90 days ago so it won't appear in "Recent Favorites"
    const watchedAt = seenRecently ? new Date() : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      return d;
    })();

    const { error } = await createRating(
      user.id,
      movieToRate.id,
      score,
      null, // no review in quick rate
      movieToRate.title,
      movieToRate.poster_path,
      year,
      watchedAt,
    );
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    // Update state
    const newRatedIds = new Set(ratedMovieIds);
    newRatedIds.add(movieToRate.id);
    setRatedMovieIds(newRatedIds);

    const newCount = ratedCount + 1;
    setRatedCount(newCount);

    if (newCount >= TARGET_RATINGS) {
      // Show celebration
      setCompleted(true);
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Move to next movie
      setScore(75);
      setSeenRecently(false);
      if (mode === 'popular') {
        setCurrentMovieIndex(prev => prev + 1);
      } else {
        setSelectedSearchMovie(null);
        // Remove from search results
        setSearchResults(prev => prev.filter(m => m.id !== movieToRate.id));
      }
    }
  };

  const handleSkip = () => {
    if (mode === 'popular') {
      setCurrentMovieIndex(prev => prev + 1);
      setScore(75);
      setSeenRecently(false);
    } else {
      setSelectedSearchMovie(null);
    }
  };

  const handleSkipOnboarding = () => {
    Alert.alert(
      'Skip for now?',
      'You can always come back to this from your profile.',
      [
        { text: 'Keep Rating', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            if (fromSignup === '1') {
              router.replace('/(tabs)');
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleFinish = () => {
    if (fromSignup === '1') {
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };

  // Render celebration screen
  if (completed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            },
          ]}
        >
          <Text style={styles.celebrationEmoji}>🎬</Text>
          <Text style={styles.celebrationTitle}>Your Taste Profile{'\n'}is Ready!</Text>
          <Text style={styles.celebrationSubtitle}>
            You rated {ratedCount >= TARGET_RATINGS ? TARGET_RATINGS : ratedCount} movies
          </Text>
          <Text style={styles.celebrationDescription}>
            Your profile now shows your unique cinematic taste — genres, actors, directors, and more.
          </Text>
          <GradientButton
            title="View Your Profile"
            onPress={handleFinish}
            size="large"
            style={styles.celebrationButton}
          />
        </Animated.View>
      </View>
    );
  }

  // Render search results list
  const renderSearchResult = ({ item }: { item: Movie }) => {
    const posterUrl = getImageUrl(item.poster_path, 'w154');
    const year = item.release_date ? item.release_date.substring(0, 4) : '';

    return (
      <Pressable style={styles.searchResultItem} onPress={() => handleSelectSearchMovie(item)}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.searchResultPoster} />
        ) : (
          <View style={[styles.searchResultPoster, styles.searchResultPosterPlaceholder]} />
        )}
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title}</Text>
          {year ? <Text style={styles.searchResultYear}>{year}</Text> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Build Your Taste Profile</Text>
          <Pressable onPress={handleSkipOnboarding} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(ratedCount / TARGET_RATINGS) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {ratedCount} of {TARGET_RATINGS} rated
          </Text>
        </View>

        {/* Mode Toggle */}
        <SegmentedControl
          segments={[
            { key: 'popular', label: 'Popular' },
            { key: 'search', label: 'Search' },
          ]}
          activeKey={mode}
          onChange={(key) => {
            setMode(key);
            setSelectedSearchMovie(null);
            setScore(75);
            setSeenRecently(false);
          }}
        />
      </View>

      {/* Content */}
      {mode === 'popular' ? (
        <View style={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          {loadingPopular && popularMovies.length === 0 ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner />
              <Text style={styles.loadingText}>Loading movies...</Text>
            </View>
          ) : currentMovie ? (
            <QuickRateCard
              movie={currentMovie}
              score={score}
              onScoreChange={setScore}
              onRate={handleRate}
              onSkip={handleSkip}
              loading={submitting}
              seenRecently={seenRecently}
              onSeenRecentlyChange={setSeenRecently}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Finding more movies...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.searchContainer}>
          {/* Search Input */}
          <View style={styles.searchBarContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search for a movie..."
              onClear={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              autoFocus={false}
            />
          </View>

          {selectedSearchMovie ? (
            <View style={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
              <Pressable
                style={styles.backToSearch}
                onPress={() => setSelectedSearchMovie(null)}
              >
                <Text style={styles.backToSearchText}>← Back to results</Text>
              </Pressable>
              <QuickRateCard
                movie={selectedSearchMovie}
                score={score}
                onScoreChange={setScore}
                onRate={handleRate}
                onSkip={handleSkip}
                loading={submitting}
                seenRecently={seenRecently}
                onSeenRecentlyChange={setSeenRecently}
              />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSearchResult}
              contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
              ListEmptyComponent={
                loadingSearch ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.primary} size="small" />
                  </View>
                ) : searchQuery.length >= 2 ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>No movies found</Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>Search for movies you've seen</Text>
                  </View>
                )
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceLighter,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  // Search mode
  searchContainer: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  searchResultPoster: {
    width: 50,
    height: 75,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  searchResultPosterPlaceholder: {
    backgroundColor: colors.surfaceLighter,
  },
  searchResultInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  searchResultYear: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  backToSearch: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backToSearchText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  // Celebration
  celebrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  celebrationEmoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 40,
  },
  celebrationSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  celebrationDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  celebrationButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
