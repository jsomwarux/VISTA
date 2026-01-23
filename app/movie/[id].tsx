import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, getScoreColor } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRatings } from '../../src/hooks/useRatings';
import { useWatchlist } from '../../src/hooks/useWatchlist';
import {
  MoviePoster,
  ScoreBadge,
  Avatar,
  LoadingSpinner,
  GradientButton,
} from '../../src/components';
import { Movie, Rating } from '../../src/types';
import { getMovieDetails, getImageUrl } from '../../src/lib/tmdb';

const { width: screenWidth } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getMovieRatings, getMovieAverageScore, getUserRatings } = useRatings();
  const { addToWatchlist, removeFromWatchlist, isOnWatchlist } = useWatchlist();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [vistaScore, setVistaScore] = useState<{ avgScore: number | null; count: number }>({ avgScore: null, count: 0 });
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [onWatchlist, setOnWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;

      try {
        const movieId = parseInt(id);
        const [movieData, ratingsData, scoreData] = await Promise.all([
          getMovieDetails(movieId),
          getMovieRatings(movieId),
          getMovieAverageScore(movieId),
        ]);

        setMovie(movieData);
        if (ratingsData.data) {
          setRatings(ratingsData.data);
        }
        setVistaScore(scoreData);

        // Check if user has rated this movie and watchlist status
        if (user) {
          const [userRatings, watchlistStatus] = await Promise.all([
            getUserRatings(user.id),
            isOnWatchlist(user.id, movieId),
          ]);
          if (userRatings.data) {
            const existing = userRatings.data.find(r => r.movie_id === movieId);
            if (existing) {
              setUserRating(existing);
            }
          }
          setOnWatchlist(watchlistStatus);
        }
      } catch (error) {
        console.error('Error loading movie:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [id, user]);

  const handleWatchlistToggle = async () => {
    if (!user || !movie || watchlistLoading) return;

    setWatchlistLoading(true);
    try {
      if (onWatchlist) {
        await removeFromWatchlist(user.id, movie.id);
        setOnWatchlist(false);
      } else {
        await addToWatchlist(user.id, movie.id, movie.title, movie.poster_path);
        setOnWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  const year = movie.release_date ? movie.release_date.split('-')[0] : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const directors = movie.credits?.crew?.filter(c => c.job === 'Director') || [];
  const topCast = movie.credits?.cast?.slice(0, 8) || [];

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerRight: () => (
            <Pressable
              style={styles.headerRateButton}
              onPress={() => router.push({ pathname: '/rate', params: { movieId: id } })}
            >
              <Text style={styles.headerRateIcon}>+</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Backdrop Hero with Premium Gradient */}
        <View style={styles.heroContainer}>
          {movie.backdrop_path ? (
            <Image
              source={{ uri: getImageUrl(movie.backdrop_path, 'w780') || '' }}
              style={styles.backdrop}
            />
          ) : (
            <View style={[styles.backdrop, styles.backdropPlaceholder]} />
          )}
          <LinearGradient
            colors={[
              'transparent',
              'rgba(10, 10, 11, 0.3)',
              'rgba(10, 10, 11, 0.6)',
              colors.background,
            ]}
            locations={[0, 0.4, 0.7, 1]}
            style={styles.heroGradient}
          />
        </View>

        {/* Movie Info */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <MoviePoster posterPath={movie.poster_path} size="large" style={styles.poster} />
            <View style={styles.titleSection}>
              <Text style={styles.title}>{movie.title}</Text>
              <Text style={styles.meta}>
                {year} {runtime && `• ${runtime}`}
              </Text>
              {movie.genres && (
                <Text style={styles.genres}>
                  {movie.genres.map(g => g.name).join(', ')}
                </Text>
              )}

              </View>
          </View>

          {/* Premium Score Comparison Card */}
          {(vistaScore.avgScore || userRating) && (
            <View style={styles.scoreCard}>
              <View style={styles.scoreCardContent}>
                {vistaScore.avgScore && (
                  <View style={styles.scoreColumn}>
                    <View style={styles.scoreIconRow}>
                      <Ionicons name="people" size={14} color={colors.primary} />
                      <Text style={styles.scoreCardLabel}>VISTA SCORE</Text>
                    </View>
                    <View style={styles.scoreBadgeRow}>
                      <ScoreBadge score={vistaScore.avgScore} size="large" showGlow />
                    </View>
                    <Text style={styles.scoreSubtext}>{vistaScore.count} rating{vistaScore.count !== 1 ? 's' : ''}</Text>
                  </View>
                )}
                {vistaScore.avgScore && userRating && (
                  <View style={styles.scoreDivider} />
                )}
                {userRating && (
                  <View style={styles.scoreColumn}>
                    <View style={styles.scoreIconRow}>
                      <Ionicons name="star" size={14} color={colors.amber} />
                      <Text style={styles.scoreCardLabel}>YOUR SCORE</Text>
                    </View>
                    <View style={styles.scoreBadgeRow}>
                      <ScoreBadge score={userRating.score} size="large" showGlow />
                    </View>
                    <Text style={styles.scoreSubtext}>
                      {userRating.score > (vistaScore.avgScore || 0) ? 'Above' : userRating.score < (vistaScore.avgScore || 0) ? 'Below' : 'Same as'} avg
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <GradientButton
              title={userRating ? 'Update Rating' : 'Rate This Movie'}
              onPress={() => router.push({ pathname: '/rate', params: { movieId: id } })}
              size="medium"
              icon={<Ionicons name="star" size={18} color={colors.background} />}
              style={styles.rateButton}
            />
            {user && (
              <Pressable
                style={({ pressed }) => [
                  styles.watchlistButton,
                  onWatchlist && styles.watchlistButtonActive,
                  pressed && styles.watchlistButtonPressed,
                ]}
                onPress={handleWatchlistToggle}
                disabled={watchlistLoading}
              >
                <Ionicons
                  name={onWatchlist ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={onWatchlist ? colors.primary : colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          {/* Overview */}
          {movie.overview && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>OVERVIEW</Text>
              <Text style={styles.overview}>{movie.overview}</Text>
            </View>
          )}

          {/* Directors */}
          {directors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {directors.length > 1 ? 'DIRECTORS' : 'DIRECTOR'}
              </Text>
              <View style={styles.crewRow}>
                {directors.map((director) => (
                  <View key={director.id} style={styles.crewItem}>
                    {director.profile_path ? (
                      <Image
                        source={{ uri: getImageUrl(director.profile_path, 'w185') || '' }}
                        style={styles.crewImage}
                      />
                    ) : (
                      <View style={[styles.crewImage, styles.crewPlaceholder]}>
                        <Text style={styles.crewInitial}>{director.name[0]}</Text>
                      </View>
                    )}
                    <Text style={styles.crewName}>{director.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cast */}
          {topCast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TOP CAST</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {topCast.map((actor) => (
                  <View key={actor.id} style={styles.castItem}>
                    {actor.profile_path ? (
                      <Image
                        source={{ uri: getImageUrl(actor.profile_path, 'w185') || '' }}
                        style={styles.castImage}
                      />
                    ) : (
                      <View style={[styles.castImage, styles.castPlaceholder]}>
                        <Text style={styles.castInitial}>{actor.name[0]}</Text>
                      </View>
                    )}
                    <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                    <Text style={styles.castCharacter} numberOfLines={1}>{actor.character}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* User Reviews */}
          {ratings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>REVIEWS ({ratings.length})</Text>
              {ratings.slice(0, 5).map((rating) => (
                <Pressable
                  key={rating.id}
                  style={styles.reviewCard}
                  onPress={() => router.push(`/rating/${rating.id}`)}
                >
                  <View style={styles.reviewHeader}>
                    <Pressable
                      style={styles.reviewUser}
                      onPress={() => router.push(`/user/${rating.user_id}`)}
                    >
                      <Avatar
                        uri={rating.user?.avatar_url || null}
                        name={rating.user?.display_name}
                        size="small"
                      />
                      <Text style={styles.reviewUserName}>
                        {rating.user?.display_name}
                      </Text>
                    </Pressable>
                    <ScoreBadge score={rating.score} size="small" />
                  </View>
                  {rating.review && (
                    <Text style={styles.reviewText} numberOfLines={3}>
                      {rating.review}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRateIcon: {
    fontSize: 20,
    color: colors.background,
    fontWeight: '300',
    marginTop: -1,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropPlaceholder: {
    backgroundColor: colors.surfaceLight,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    marginTop: -80,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
  },
  poster: {
    marginTop: -40,
  },
  titleSection: {
    flex: 1,
    marginLeft: spacing.md,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  genres: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Score Comparison Card
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  scoreCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  scoreCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  scoreBadgeRow: {
    marginBottom: spacing.xs,
  },
  scoreSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scoreDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  rateButton: {
    flex: 1,
  },
  watchlistButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  watchlistButtonActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  watchlistButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  overview: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  crewRow: {
    flexDirection: 'row',
  },
  crewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  crewImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  crewPlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewInitial: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  crewName: {
    fontSize: 15,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  castItem: {
    width: 80,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  castImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  castPlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  castName: {
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  castCharacter: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  reviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
