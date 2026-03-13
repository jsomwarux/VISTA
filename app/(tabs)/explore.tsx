import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, gradients } from '../../src/constants/theme';
import { getTrendingMovies, searchMovies, getNowPlayingMovies, getImageUrl } from '../../src/lib/tmdb';
import { MoviePoster, LoadingSpinner } from '../../src/components';
import { Movie } from '../../src/types';
import { dataCache } from '../../src/lib/cache';
import { tabEvents } from '../../src/lib/tabEvents';

const HERO_HEIGHT = 280;

export default function ExploreTab() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const heroScrollRef = useRef<FlatList>(null);
  const heroIndex = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const searchListRef = useRef<FlatList>(null);

  // Scroll to top when tab is re-tapped
  useEffect(() => {
    return tabEvents.on('scrollToTop:explore', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      searchListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, []);

  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cachedTrending = dataCache.get<Movie[]>('trending_movies');
      const cachedNowPlaying = dataCache.get<Movie[]>('now_playing_movies');

      if (cachedTrending && cachedNowPlaying) {
        setTrendingMovies(cachedTrending);
        setNowPlayingMovies(cachedNowPlaying);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const [trending, nowPlaying] = await Promise.all([
        getTrendingMovies('week'),
        getNowPlayingMovies(),
      ]);
      const trendingResults = trending || [];
      const nowPlayingResults = nowPlaying?.results || [];
      setTrendingMovies(trendingResults);
      setNowPlayingMovies(nowPlayingResults);

      // Cache the results
      dataCache.set('trending_movies', trendingResults);
      dataCache.set('now_playing_movies', nowPlayingResults);
    } catch (error) {
      console.error('Error loading movies:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-advance hero carousel
  useEffect(() => {
    if (trendingMovies.length === 0) return;

    const timer = setInterval(() => {
      const maxIndex = Math.min(trendingMovies.length, 5) - 1;
      if (maxIndex < 0) return;
      heroIndex.current = (heroIndex.current + 1) % (maxIndex + 1);
      try {
        heroScrollRef.current?.scrollToIndex({
          index: heroIndex.current,
          animated: true,
        });
      } catch {
        // scrollToIndex can fail if layout hasn't completed (e.g., iPad rotation)
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [trendingMovies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true); // Force refresh bypasses cache
    setRefreshing(false);
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchMovies(searchQuery.trim());
      setSearchResults(results.results);
    } catch (error) {
      console.error('Error searching movies:', error);
    }
    setSearching(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const renderHeroCarousel = () => {
    const heroMovies = trendingMovies.slice(0, 5);

    return (
      <View style={styles.heroContainer}>
        <FlatList
          ref={heroScrollRef}
          horizontal
          pagingEnabled
          data={heroMovies}
          keyExtractor={(item) => `hero-${item.id}`}
          showsHorizontalScrollIndicator={false}
          onScrollToIndexFailed={() => {
            // Gracefully handle failed scrollToIndex (can happen on iPad rotation)
          }}
          onMomentumScrollEnd={(e) => {
            heroIndex.current = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          }}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.heroItem, { width: screenWidth }]}
              onPress={() => router.push(`/movie/${item.id}`)}
            >
              <ImageBackground
                source={{ uri: getImageUrl(item.backdrop_path || item.poster_path, 'w780') || '' }}
                style={styles.heroImage}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(10, 10, 11, 0.4)',
                    'rgba(10, 10, 11, 0.7)',
                    'rgba(10, 10, 11, 0.95)',
                    colors.background,
                  ]}
                  locations={[0, 0.3, 0.5, 0.7, 1]}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <Text style={styles.heroTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.heroMeta}>
                      {item.release_date?.split('-')[0] || 'Coming Soon'}
                    </Text>
                    <View style={styles.heroAction}>
                      <View style={styles.viewButton}>
                        <Ionicons name="play" size={14} color={colors.background} />
                        <Text style={styles.viewButtonText}>View Details</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </Pressable>
          )}
        />
        {/* Pagination dots */}
        <View style={styles.heroPagination}>
          {heroMovies.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === heroIndex.current && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderMovieRow = (movies: Movie[], title: string, icon: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FlatList
        horizontal
        data={movies}
        keyExtractor={(item) => `${title}-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.movieRow}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.movieItem,
              pressed && styles.movieItemPressed,
            ]}
            onPress={() => router.push(`/movie/${item.id}`)}
          >
            <View style={styles.posterWrapper}>
              <MoviePoster posterPath={item.poster_path} size="medium" />
            </View>
            <Text style={styles.movieTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.movieYear}>
              {item.release_date?.split('-')[0] || 'TBA'}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );

  const renderSearchResults = () => {
    if (searching) {
      return (
        <View style={styles.centered}>
          <LoadingSpinner />
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="film-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No movies found</Text>
          <Text style={styles.emptyMessage}>Try a different search term</Text>
        </View>
      );
    }

    return (
      <FlatList
        ref={searchListRef}
        data={searchResults}
        keyExtractor={(item) => `search-${item.id}`}
        numColumns={3}
        contentContainerStyle={styles.searchGrid}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.searchItem,
              pressed && styles.searchItemPressed,
            ]}
            onPress={() => router.push(`/movie/${item.id}`)}
          >
            <View style={styles.searchPosterWrapper}>
              <MoviePoster posterPath={item.poster_path} size="small" />
            </View>
            <Text style={styles.searchMovieTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {searchQuery ? (
        renderSearchResults()
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {renderHeroCarousel()}
          {renderMovieRow(trendingMovies.slice(5), 'Trending This Week', '🔥')}
          {renderMovieRow(nowPlayingMovies, 'Now Playing', '🎬')}
        </ScrollView>
      )}
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
  },

  // Search
  searchWrapper: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
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

  // Hero carousel
  heroContainer: {
    height: HERO_HEIGHT,
    marginBottom: spacing.lg,
  },
  heroItem: {
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  heroContent: {
    gap: spacing.xs,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  heroMeta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  heroAction: {
    marginTop: spacing.sm,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
  },
  heroPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    gap: spacing.sm,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    opacity: 1,
    width: 20,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  movieRow: {
    paddingHorizontal: spacing.md,
  },
  movieItem: {
    marginRight: spacing.md,
    width: 110,
  },
  movieItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  posterWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  movieYear: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Search results
  searchGrid: {
    padding: spacing.sm,
    paddingBottom: 120,
  },
  searchItem: {
    width: '33.33%',
    padding: spacing.xs,
  },
  searchItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  searchPosterWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  searchMovieTitle: {
    fontSize: 12,
    color: colors.text,
    marginTop: spacing.xs,
  },

  // Empty state
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
  },
});
