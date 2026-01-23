import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, getScoreColor } from '../src/constants/theme';
import { useAuth } from '../src/hooks/useAuth';
import { useRatings } from '../src/hooks/useRatings';
import {
  SearchBar,
  MoviePoster,
  Button,
  LoadingSpinner,
} from '../src/components';
import { Movie } from '../src/types';
import { searchMovies, getMovieDetails } from '../src/lib/tmdb';

export default function RateScreen() {
  const { movieId } = useLocalSearchParams<{ movieId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createRating, getUserRatings, loading: ratingLoading } = useRatings();

  const [step, setStep] = useState<'search' | 'rate'>(movieId ? 'rate' : 'search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [score, setScore] = useState(50);
  const [review, setReview] = useState('');
  const [existingRating, setExistingRating] = useState<{ score: number; review: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (movieId) {
      loadMovieById(parseInt(movieId));
    }
  }, [movieId]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const results = await searchMovies(searchQuery);
          setSearchResults(results.results);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const loadMovieById = async (id: number) => {
    setLoading(true);
    try {
      const movie = await getMovieDetails(id);
      setSelectedMovie(movie);
      setStep('rate');

      // Check for existing rating
      if (user) {
        const { data: ratings } = await getUserRatings(user.id);
        if (ratings) {
          const existing = ratings.find(r => r.movie_id === id);
          if (existing) {
            setExistingRating({ score: existing.score, review: existing.review });
            setScore(existing.score);
            setReview(existing.review || '');
          }
        }
      }
    } catch (error) {
      console.error('Error loading movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMovie = async (movie: Movie) => {
    setSelectedMovie(movie);
    setStep('rate');
    setSearchQuery('');
    setSearchResults([]);

    // Check for existing rating
    if (user) {
      const { data: ratings } = await getUserRatings(user.id);
      if (ratings) {
        const existing = ratings.find(r => r.movie_id === movie.id);
        if (existing) {
          setExistingRating({ score: existing.score, review: existing.review });
          setScore(existing.score);
          setReview(existing.review || '');
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedMovie) {
      Alert.alert('Error', 'Please sign in to rate movies');
      return;
    }

    const year = selectedMovie.release_date ? selectedMovie.release_date.split('-')[0] : '';

    const { error } = await createRating(
      user.id,
      selectedMovie.id,
      score,
      review.trim() || null,
      selectedMovie.title,
      selectedMovie.poster_path,
      year
    );

    if (error) {
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    } else {
      router.back();
    }
  };

  const renderSearchResult = ({ item }: { item: Movie }) => {
    const year = item.release_date ? item.release_date.split('-')[0] : '';

    return (
      <Pressable
        style={styles.searchResult}
        onPress={() => handleSelectMovie(item)}
      >
        <MoviePoster posterPath={item.poster_path} size="small" />
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {year && <Text style={styles.searchResultYear}>{year}</Text>}
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === 'search' ? 'Search Movie' : existingRating ? 'Update Rating' : 'Rate Movie'}
        </Text>
        <View style={styles.closeButton} />
      </View>

      {step === 'search' ? (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for a movie..."
            onClear={() => setSearchQuery('')}
            autoFocus
          />

          {searching ? (
            <LoadingSpinner message="Searching..." />
          ) : searchQuery.length < 2 ? (
            <View style={styles.searchHint}>
              <Text style={styles.searchHintIcon}>🎬</Text>
              <Text style={styles.searchHintText}>
                Start typing to search for movies
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.searchHint}>
              <Text style={styles.searchHintIcon}>🤷</Text>
              <Text style={styles.searchHintText}>No movies found</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.searchResults}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : selectedMovie ? (
        <ScrollView
          style={styles.rateContainer}
          contentContainerStyle={styles.rateContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Movie Info */}
          <View style={styles.movieInfo}>
            <MoviePoster posterPath={selectedMovie.poster_path} size="medium" />
            <View style={styles.movieDetails}>
              <Text style={styles.movieTitle}>{selectedMovie.title}</Text>
              {selectedMovie.release_date && (
                <Text style={styles.movieYear}>
                  {selectedMovie.release_date.split('-')[0]}
                </Text>
              )}
              <Pressable onPress={() => setStep('search')}>
                <Text style={styles.changeMovie}>Change movie</Text>
              </Pressable>
            </View>
          </View>

          {/* Score Slider */}
          <View style={styles.scoreSection}>
            <Text style={styles.sectionLabel}>YOUR SCORE</Text>
            <View style={styles.scoreDisplay}>
              <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                {score}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>

            {/* Score Slider Track */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: `${score}%`,
                      backgroundColor: getScoreColor(score),
                    },
                  ]}
                />
              </View>

              {/* Quick Score Buttons */}
              <View style={styles.quickScores}>
                {[10, 25, 50, 75, 90].map((val) => (
                  <Pressable
                    key={val}
                    style={[
                      styles.quickScoreButton,
                      score === val && styles.quickScoreButtonActive,
                    ]}
                    onPress={() => setScore(val)}
                  >
                    <Text
                      style={[
                        styles.quickScoreText,
                        score === val && styles.quickScoreTextActive,
                      ]}
                    >
                      {val}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Fine-tune buttons */}
              <View style={styles.adjustButtons}>
                <Pressable
                  style={styles.adjustButton}
                  onPress={() => setScore(Math.max(1, score - 5))}
                >
                  <Text style={styles.adjustButtonText}>-5</Text>
                </Pressable>
                <Pressable
                  style={styles.adjustButton}
                  onPress={() => setScore(Math.max(1, score - 1))}
                >
                  <Text style={styles.adjustButtonText}>-1</Text>
                </Pressable>
                <Pressable
                  style={styles.adjustButton}
                  onPress={() => setScore(Math.min(100, score + 1))}
                >
                  <Text style={styles.adjustButtonText}>+1</Text>
                </Pressable>
                <Pressable
                  style={styles.adjustButton}
                  onPress={() => setScore(Math.min(100, score + 5))}
                >
                  <Text style={styles.adjustButtonText}>+5</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Review */}
          <View style={styles.reviewSection}>
            <Text style={styles.sectionLabel}>REVIEW (OPTIONAL)</Text>
            <TextInput
              style={styles.reviewInput}
              value={review}
              onChangeText={setReview}
              placeholder="Share your thoughts on this movie..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.reviewHint}>
              {review.length}/500 characters
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            title={existingRating ? 'Update Rating' : 'Save Rating'}
            onPress={handleSubmit}
            loading={ratingLoading}
            style={styles.submitButton}
          />

          {existingRating && (
            <Text style={styles.existingNote}>
              You previously rated this {existingRating.score}/100
            </Text>
          )}
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flex: 1,
    padding: spacing.md,
  },
  searchResults: {
    paddingTop: spacing.md,
  },
  searchResult: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  searchResultTitle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  searchResultYear: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  searchHintIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  searchHintText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rateContainer: {
    flex: 1,
  },
  rateContent: {
    padding: spacing.md,
  },
  movieInfo: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  movieDetails: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  movieYear: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  changeMovie: {
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  scoreSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.lg,
  },
  quickScoreButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  quickScoreButtonActive: {
    backgroundColor: colors.primary,
  },
  quickScoreText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  quickScoreTextActive: {
    color: colors.background,
  },
  adjustButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  adjustButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  adjustButtonText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  reviewSection: {
    marginBottom: spacing.xl,
  },
  reviewInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  submitButton: {
    marginBottom: spacing.md,
  },
  existingNote: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
