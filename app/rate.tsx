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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [existingRating, setExistingRating] = useState<{ score: number; review: string | null; watched_at?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchedAt, setWatchedAt] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
            setExistingRating({ score: existing.score, review: existing.review, watched_at: existing.watched_at });
            setScore(existing.score);
            setReview(existing.review || '');
            if (existing.watched_at) {
              setWatchedAt(new Date(existing.watched_at));
            }
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
          setExistingRating({ score: existing.score, review: existing.review, watched_at: existing.watched_at });
          setScore(existing.score);
          setReview(existing.review || '');
          if (existing.watched_at) {
            setWatchedAt(new Date(existing.watched_at));
          }
        } else {
          // Reset to today for new rating
          setWatchedAt(new Date());
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
      year,
      watchedAt
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

          {/* Watch Date */}
          <View style={styles.dateSection}>
            <Text style={styles.sectionLabel}>WHEN DID YOU WATCH IT?</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateButtonText}>
                {watchedAt.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
            {watchedAt.toDateString() !== new Date().toDateString() && (
              <Pressable
                style={styles.resetDateButton}
                onPress={() => setWatchedAt(new Date())}
              >
                <Text style={styles.resetDateText}>Reset to today</Text>
              </Pressable>
            )}
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

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Quick Select Options */}
            <View style={styles.quickDateOptions}>
              <Pressable
                style={styles.quickDateButton}
                onPress={() => {
                  setWatchedAt(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.quickDateText}>Today</Text>
              </Pressable>
              <Pressable
                style={styles.quickDateButton}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setWatchedAt(yesterday);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.quickDateText}>Yesterday</Text>
              </Pressable>
              <Pressable
                style={styles.quickDateButton}
                onPress={() => {
                  const lastWeek = new Date();
                  lastWeek.setDate(lastWeek.getDate() - 7);
                  setWatchedAt(lastWeek);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.quickDateText}>Last Week</Text>
              </Pressable>
            </View>

            {/* Month/Year Selector */}
            <View style={styles.monthYearSelector}>
              <Text style={styles.selectorLabel}>Month</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthScroll}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const monthDate = new Date(watchedAt.getFullYear(), i, 1);
                  const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = watchedAt.getMonth() === i;
                  const isFuture = new Date(watchedAt.getFullYear(), i, 1) > new Date();
                  return (
                    <Pressable
                      key={i}
                      style={[
                        styles.monthButton,
                        isSelected && styles.monthButtonSelected,
                        isFuture && styles.monthButtonDisabled,
                      ]}
                      onPress={() => {
                        if (!isFuture) {
                          const newDate = new Date(watchedAt);
                          newDate.setMonth(i);
                          // Ensure day is valid for new month
                          if (newDate.getDate() !== watchedAt.getDate()) {
                            newDate.setDate(0); // Last day of previous month
                          }
                          setWatchedAt(newDate);
                        }
                      }}
                      disabled={isFuture}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          isSelected && styles.monthButtonTextSelected,
                          isFuture && styles.monthButtonTextDisabled,
                        ]}
                      >
                        {monthName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.monthYearSelector}>
              <Text style={styles.selectorLabel}>Year</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthScroll}
              >
                {Array.from({ length: 20 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  const isSelected = watchedAt.getFullYear() === year;
                  return (
                    <Pressable
                      key={year}
                      style={[
                        styles.monthButton,
                        isSelected && styles.monthButtonSelected,
                      ]}
                      onPress={() => {
                        const newDate = new Date(watchedAt);
                        newDate.setFullYear(year);
                        // If future date after year change, set to today
                        if (newDate > new Date()) {
                          setWatchedAt(new Date());
                        } else {
                          setWatchedAt(newDate);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          isSelected && styles.monthButtonTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Day Selector */}
            <View style={styles.monthYearSelector}>
              <Text style={styles.selectorLabel}>Day</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthScroll}
              >
                {Array.from(
                  { length: new Date(watchedAt.getFullYear(), watchedAt.getMonth() + 1, 0).getDate() },
                  (_, i) => {
                    const day = i + 1;
                    const isSelected = watchedAt.getDate() === day;
                    const dateToCheck = new Date(watchedAt.getFullYear(), watchedAt.getMonth(), day);
                    const isFuture = dateToCheck > new Date();
                    return (
                      <Pressable
                        key={day}
                        style={[
                          styles.dayButton,
                          isSelected && styles.monthButtonSelected,
                          isFuture && styles.monthButtonDisabled,
                        ]}
                        onPress={() => {
                          if (!isFuture) {
                            const newDate = new Date(watchedAt);
                            newDate.setDate(day);
                            setWatchedAt(newDate);
                          }
                        }}
                        disabled={isFuture}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            isSelected && styles.monthButtonTextSelected,
                            isFuture && styles.monthButtonTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>

            <Pressable
              style={styles.datePickerDoneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  dateSection: {
    marginBottom: spacing.xl,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  resetDateButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  resetDateText: {
    fontSize: 13,
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  monthYearSelector: {
    marginBottom: spacing.md,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  monthScroll: {
    gap: spacing.xs,
  },
  monthButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  monthButtonSelected: {
    backgroundColor: colors.primary,
  },
  monthButtonDisabled: {
    opacity: 0.3,
  },
  monthButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  monthButtonTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  monthButtonTextDisabled: {
    color: colors.textMuted,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  datePickerDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
