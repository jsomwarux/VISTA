import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  getScoreColor,
} from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRatings } from '../../src/hooks/useRatings';
import { MoviePoster, ScoreBadge, LoadingSpinner } from '../../src/components';
import { Rating, Person, PersonMovieCredit } from '../../src/types';
import {
  getPersonDetails,
  getPersonMovieCredits,
  getImageUrl,
} from '../../src/lib/tmdb';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 320;

// ── Helpers ────────────────────────────────────────────────

function getAge(birthday: string, deathday?: string | null): number {
  const end = deathday ? new Date(deathday) : new Date();
  const birth = new Date(birthday);
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}

function getYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.split('-')[0] || '';
}

// ── Component ──────────────────────────────────────────────

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getUserRatings } = useRatings();

  const [person, setPerson] = useState<Person | null>(null);
  const [credits, setCredits] = useState<{
    cast: PersonMovieCredit[];
    crew: PersonMovieCredit[];
  } | null>(null);
  const [userRatings, setUserRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      try {
        const personId = parseInt(id, 10);
        const [personData, creditsData] = await Promise.all([
          getPersonDetails(personId),
          getPersonMovieCredits(personId),
        ]);
        if (cancelled) return;
        setPerson(personData);
        setCredits(creditsData);

        if (user) {
          const result = await getUserRatings(user.id);
          if (!cancelled && result.data) {
            setUserRatings(result.data);
          }
        }
      } catch (err) {
        console.error('Error loading person:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  // Build O(1) lookup: movie_id → Rating
  const ratingsByMovie = useMemo(
    () => new Map(userRatings.map((r) => [r.movie_id, r])),
    [userRatings],
  );

  // Filmography: deduplicate cast + crew, sort newest first
  const filmography = useMemo(() => {
    if (!credits) return [];
    const movieMap = new Map<number, PersonMovieCredit & { character?: string; job?: string }>();

    for (const c of credits.cast || []) {
      if (!movieMap.has(c.id)) {
        movieMap.set(c.id, { ...c });
      }
    }
    for (const c of credits.crew || []) {
      if (!movieMap.has(c.id)) {
        movieMap.set(c.id, { ...c });
      }
    }

    return Array.from(movieMap.values())
      .filter((m) => m.release_date)
      .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
  }, [credits]);

  // Movies the user has rated that feature this person
  const myRatedMovies = useMemo(
    () => filmography.filter((m) => ratingsByMovie.has(m.id)),
    [filmography, ratingsByMovie],
  );

  // ── Loading / Error ────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>Person not found</Text>
      </View>
    );
  }

  // ── Derived values ─────────────────────────────────────────

  const profileUrl = getImageUrl(person.profile_path, 'w500');
  const hasBio = !!person.biography && person.biography.length > 0;
  const longBio = hasBio && person.biography.length > 200;

  let ageLabel = '';
  if (person.birthday) {
    const age = getAge(person.birthday, person.deathday);
    if (person.deathday) {
      ageLabel = `${getYear(person.birthday)}\u2013${getYear(person.deathday)} (aged ${age})`;
    } else {
      ageLabel = `Born ${getYear(person.birthday)} (age ${age})`;
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image */}
      <View style={styles.hero}>
        {profileUrl ? (
          <Image source={{ uri: profileUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[colors.surfaceLight, colors.background]}
            style={styles.heroPlaceholder}
          >
            <Ionicons name="person" size={80} color={colors.textMuted} />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(10,10,11,0.3)', 'rgba(10,10,11,0.7)', colors.background]}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.heroGradient}
        />
      </View>

      <View style={styles.content}>
        {/* Name + Meta */}
        <Text style={styles.name}>{person.name}</Text>
        <View style={styles.metaRow}>
          {person.known_for_department ? (
            <View style={styles.departmentPill}>
              <Text style={styles.departmentText}>{person.known_for_department}</Text>
            </View>
          ) : null}
          {ageLabel ? <Text style={styles.ageMeta}>{ageLabel}</Text> : null}
        </View>
        {person.place_of_birth ? (
          <Text style={styles.placeOfBirth}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            {'  '}{person.place_of_birth}
          </Text>
        ) : null}

        {/* Bio */}
        {hasBio && (
          <View style={styles.bioSection}>
            <Text
              style={styles.bioText}
              numberOfLines={bioExpanded ? undefined : 4}
            >
              {person.biography}
            </Text>
            {longBio && (
              <Pressable onPress={() => setBioExpanded(!bioExpanded)}>
                <Text style={styles.bioToggle}>
                  {bioExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* My Ratings Section */}
        {myRatedMovies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              MY RATINGS ({myRatedMovies.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ratedScroll}
            >
              {myRatedMovies.map((movie) => {
                const rating = ratingsByMovie.get(movie.id)!;
                return (
                  <Pressable
                    key={movie.id}
                    style={styles.ratedItem}
                    onPress={() => router.push(`/movie/${movie.id}`)}
                  >
                    <View style={styles.ratedPosterWrap}>
                      <View style={styles.ratedPosterInner}>
                        <MoviePoster posterPath={movie.poster_path} size="small" />
                      </View>
                      <View style={styles.ratedBadge}>
                        <View style={[styles.ratedScoreCircle, { backgroundColor: getScoreColor(rating.score) }]}>
                          <Text style={styles.ratedScoreText}>{rating.score}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.ratedTitle} numberOfLines={2}>
                      {movie.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Filmography Section */}
        {filmography.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              FILMOGRAPHY ({filmography.length})
            </Text>
            {filmography.map((movie) => {
              const rating = ratingsByMovie.get(movie.id);
              const year = getYear(movie.release_date);
              const subtitle = movie.character
                ? `as ${movie.character}`
                : movie.job || '';

              return (
                <Pressable
                  key={`${movie.id}-${movie.character || movie.job || ''}`}
                  style={styles.filmRow}
                  onPress={() => router.push(`/movie/${movie.id}`)}
                >
                  <MoviePoster posterPath={movie.poster_path} size="tiny" />
                  <View style={styles.filmInfo}>
                    <Text style={styles.filmTitle} numberOfLines={1}>
                      {movie.title}
                    </Text>
                    <Text style={styles.filmMeta} numberOfLines={1}>
                      {year}{subtitle ? ` \u00B7 ${subtitle}` : ''}
                    </Text>
                  </View>
                  {rating ? (
                    <ScoreBadge score={rating.score} size="small" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Empty filmography */}
        {filmography.length === 0 && !loading && (
          <View style={styles.emptySection}>
            <Ionicons name="film-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No filmography available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────

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
    gap: spacing.md,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 16,
  },

  // Hero
  hero: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // Content
  content: {
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  departmentPill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  departmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ageMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  placeOfBirth: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Bio
  bioSection: {
    marginTop: spacing.md,
  },
  bioText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bioToggle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },

  // Sections
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },

  // My Ratings (horizontal scroll)
  ratedScroll: {
    paddingRight: spacing.md,
    paddingTop: 12,
    paddingLeft: 2,
  },
  ratedItem: {
    width: 72,
    marginRight: spacing.sm,
  },
  ratedPosterWrap: {
    position: 'relative',
    overflow: 'visible',
  },
  ratedPosterInner: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  ratedBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 10,
  },
  ratedScoreCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.lg,
  },
  ratedScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.background,
  },
  ratedTitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  // Filmography rows
  filmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filmInfo: {
    flex: 1,
  },
  filmTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filmMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Empty
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
