import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, getScoreColor, getGenreColor } from '../constants/theme';
import { getImageUrl } from '../lib/tmdb';
import { User, Rating, TasteStats } from '../types';

// ─── Card dimensions ───────────────────────────────────────
const CARD_W = 360;
const PROFILE_H = 400;
const RATING_H = 380;

// ─── Shared helpers ────────────────────────────────────────

function Initials({ name, size }: { name: string; size: number }) {
  const letters = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: size }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: '#0A0A0B' }}>{letters}</Text>
    </LinearGradient>
  );
}

// ─── Profile Share Card ────────────────────────────────────

interface ProfileShareCardProps {
  user: User;
  ratingsCount: number;
  avgScore: number | string;
  tasteStats?: TasteStats | null;
}

export const ProfileShareCard = forwardRef<View, ProfileShareCardProps>(
  ({ user, ratingsCount, avgScore, tasteStats }, ref) => {
    const allTimeFav = tasteStats?.topAllTime?.[0];
    const recentFav = tasteStats?.topRecent?.[0];
    const topGenre = tasteStats?.topGenres?.[0];
    const topActor = tasteStats?.topActors?.[0];

    return (
      <View ref={ref} collapsable={false} style={p.card}>
        <LinearGradient
          colors={['#0E0E0C', '#141210', '#0E0E0C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* ── Header: Avatar + Name + Stats ── */}
        <View style={p.header}>
          {/* Avatar */}
          <View style={p.avatarOuter}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={p.avatarRing}
            >
              <View style={p.avatarInner}>
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={p.avatarImg} />
                ) : (
                  <Initials name={user.display_name} size={56} />
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Name + meta */}
          <View style={p.headerInfo}>
            <Text style={p.displayName} numberOfLines={1}>{user.display_name}</Text>
            <Text style={p.username}>@{user.username}</Text>
            <View style={p.inlineStats}>
              <Text style={p.statHighlight}>{ratingsCount}</Text>
              <Text style={p.statMuted}> Rated  </Text>
              <View style={p.dot} />
              <Text style={p.statHighlight}>  {avgScore || '\u2014'}</Text>
              <Text style={p.statMuted}> Avg</Text>
            </View>
          </View>
        </View>

        {/* ── Bio (if present) ── */}
        {user.bio ? (
          <Text style={p.bio} numberOfLines={2}>&ldquo;{user.bio}&rdquo;</Text>
        ) : null}

        {/* ── 2x2 Taste Stats Grid ── */}
        <View style={p.grid}>
          {/* Row 1 */}
          <View style={p.gridRow}>
            <View style={p.gridCard}>
              {allTimeFav?.movie_poster ? (
                <Image source={{ uri: getImageUrl(allTimeFav.movie_poster, 'w92')! }} style={p.gridPoster} />
              ) : (
                <View style={[p.gridPoster, p.gridPosterEmpty]} />
              )}
              <View style={p.gridInfo}>
                <Text style={p.gridLabel}>ALL-TIME FAVORITE</Text>
                <Text style={p.gridValue} numberOfLines={1}>{allTimeFav?.movie_title || '\u2014'}</Text>
              </View>
            </View>
            <View style={p.gridCard}>
              {recentFav?.movie_poster ? (
                <Image source={{ uri: getImageUrl(recentFav.movie_poster, 'w92')! }} style={p.gridPoster} />
              ) : (
                <View style={[p.gridPoster, p.gridPosterEmpty]} />
              )}
              <View style={p.gridInfo}>
                <Text style={p.gridLabel}>RECENT FAVORITE</Text>
                <Text style={p.gridValue} numberOfLines={1}>{recentFav?.movie_title || '\u2014'}</Text>
              </View>
            </View>
          </View>

          {/* Row 2 */}
          <View style={p.gridRow}>
            <View style={p.gridCard}>
              <View style={[p.gridIcon, { backgroundColor: topGenre ? `${getGenreColor(topGenre.genre)}20` : colors.surfaceLight }]}>
                <Text style={{ fontSize: 14 }}>{topGenre ? '\uD83C\uDFAD' : '\uD83C\uDFAC'}</Text>
              </View>
              <View style={p.gridInfo}>
                <Text style={p.gridLabel}>TOP GENRE</Text>
                <Text style={p.gridValue} numberOfLines={1}>{topGenre?.genre || '\u2014'}</Text>
              </View>
            </View>
            <View style={p.gridCard}>
              {topActor?.profile_path ? (
                <Image source={{ uri: getImageUrl(topActor.profile_path, 'w92')! }} style={p.gridAvatar} />
              ) : (
                <View style={[p.gridAvatar, p.gridAvatarEmpty]}>
                  <Text style={{ fontSize: 14 }}>{'\u2B50'}</Text>
                </View>
              )}
              <View style={p.gridInfo}>
                <Text style={p.gridLabel}>TOP PERFORMER</Text>
                <Text style={p.gridValue} numberOfLines={1}>{topActor?.name || '\u2014'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Brand footer ── */}
        <View style={p.brandRow}>
          <View style={shared.brandDot} />
          <Text style={shared.brandText}>VISTA</Text>
        </View>
      </View>
    );
  },
);

// ─── Rating Share Card ─────────────────────────────────────

interface RatingShareCardProps {
  rating: Rating;
}

export const RatingShareCard = forwardRef<View, RatingShareCardProps>(
  ({ rating }, ref) => {
    const scoreColor = getScoreColor(rating.score);
    const posterUrl = getImageUrl(rating.movie_poster || null, 'w342');
    const title = rating.movie_title ?? 'A Movie';
    const year = rating.movie_year;

    const raterName = rating.user?.display_name ?? 'Someone';

    return (
      <View ref={ref} collapsable={false} style={r.card}>
        {/* Background: blurred poster tint */}
        <View style={StyleSheet.absoluteFill}>
          {posterUrl && (
            <Image source={{ uri: posterUrl }} style={r.bgPoster} blurRadius={50} />
          )}
          <LinearGradient
            colors={['rgba(10,10,11,0.7)', 'rgba(10,10,11,0.92)', 'rgba(10,10,11,1)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ── Poster + Score ── */}
        <View style={r.heroRow}>
          <View style={r.posterFrame}>
            {posterUrl ? (
              <Image source={{ uri: posterUrl }} style={r.poster} resizeMode="cover" />
            ) : (
              <View style={r.posterEmpty} />
            )}
          </View>

          <View style={r.heroMeta}>
            <Text style={r.movieTitle} numberOfLines={2}>{title}</Text>
            {year ? <Text style={r.movieYear}>{year}</Text> : null}

            {/* Score */}
            <View style={[r.scoreBadge, { borderColor: scoreColor, backgroundColor: `${scoreColor}20` }]}>
              <Text style={[r.scoreText, { color: scoreColor }]}>{rating.score}</Text>
              <Text style={[r.scoreSlash, { color: `${scoreColor}80` }]}>/100</Text>
            </View>
          </View>
        </View>

        {/* ── Review ── */}
        {rating.review ? (
          <View style={r.reviewContainer}>
            <View style={r.reviewAccent} />
            <Text style={r.reviewText} numberOfLines={3}>{rating.review}</Text>
          </View>
        ) : null}

        {/* ── Rater + Brand footer ── */}
        <View style={{ flex: 1 }} />
        <View style={r.footer}>
          <View style={r.raterSection}>
            <View style={r.raterAvatar}>
              {rating.user?.avatar_url ? (
                <Image source={{ uri: rating.user.avatar_url }} style={r.raterAvatarImg} />
              ) : (
                <Initials name={raterName} size={28} />
              )}
            </View>
            <View>
              <Text style={r.raterName}>{raterName}</Text>
              <Text style={r.ratedLabel}>rated this</Text>
            </View>
          </View>
          <View style={shared.brandRowSmall}>
            <View style={shared.brandDotSmall} />
            <Text style={shared.brandTextSmall}>VISTA</Text>
          </View>
        </View>
      </View>
    );
  },
);

// ─── Shared styles ─────────────────────────────────────────

const shared = StyleSheet.create({
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 3,
  },
  brandRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 5,
  },
  brandTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2.5,
  },
});

// ─── Profile styles ────────────────────────────────────────

const p = StyleSheet.create({
  card: {
    width: CARD_W,
    height: PROFILE_H,
    backgroundColor: '#0A0A0B',
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOuter: {
    marginRight: 14,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: '#0A0A0B',
    padding: 1.5,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  headerInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  inlineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  statMuted: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },
  bio: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 12,
  },
  grid: {
    gap: 6,
    marginTop: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gridCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  gridPoster: {
    width: 30,
    height: 45,
    borderRadius: 4,
  },
  gridPosterEmpty: {
    backgroundColor: colors.surfaceLight,
  },
  gridAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  gridAvatarEmpty: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridInfo: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 14,
  },
});

// ─── Rating styles ─────────────────────────────────────────

const r = StyleSheet.create({
  card: {
    width: CARD_W,
    height: RATING_H,
    backgroundColor: '#0A0A0B',
    overflow: 'hidden',
    padding: 18,
  },
  bgPoster: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 16,
  },
  posterFrame: {
    width: 120,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterEmpty: {
    flex: 1,
    backgroundColor: colors.surfaceLighter,
  },
  heroMeta: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  movieYear: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  scoreSlash: {
    fontSize: 9,
    fontWeight: '600',
  },
  reviewContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  reviewAccent: {
    width: 2.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  reviewText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  raterSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  raterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 8,
  },
  raterAvatarImg: {
    width: '100%',
    height: '100%',
  },
  raterName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  ratedLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
