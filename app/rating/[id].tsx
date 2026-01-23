import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, gradients } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { useRatings } from '../../src/hooks/useRatings';
import { useSocial } from '../../src/hooks/useSocial';
import {
  Avatar,
  MoviePoster,
  ScoreBadge,
  LoadingSpinner,
  AnimatedHeart,
  AnimatedPressable,
} from '../../src/components';
import { Rating, Comment } from '../../src/types';

export default function RatingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getRatingWithDetails, deleteRating } = useRatings();
  const { getComments, addComment, likeRating, unlikeRating } = useSocial();

  const [rating, setRating] = useState<Rating | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const loadRating = async () => {
      if (!id) return;

      try {
        const [ratingResult, commentsResult] = await Promise.all([
          getRatingWithDetails(id),
          getComments(id),
        ]);

        if (ratingResult.data) {
          setRating(ratingResult.data);
          setHasLiked(ratingResult.data.has_liked || false);
          setLikesCount(ratingResult.data.likes_count || 0);
        }
        if (commentsResult.data) {
          setComments(commentsResult.data);
        }
      } catch (error) {
        console.error('Error loading rating:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRating();
  }, [id]);

  const handleLike = async () => {
    if (!user || !id) return;

    if (hasLiked) {
      await unlikeRating(id, user.id);
      setHasLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      await likeRating(id, user.id);
      setHasLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !id || !newComment.trim()) return;

    setSubmitting(true);
    const { data, error } = await addComment(id, user.id, newComment.trim());
    setSubmitting(false);

    if (data) {
      setComments(prev => [...prev, data]);
      setNewComment('');
    }
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Options',
      undefined,
      [
        {
          text: 'Edit Rating',
          onPress: () => {
            router.push({
              pathname: '/rate',
              params: { movieId: rating?.movie_id, editRatingId: rating?.id },
            });
          },
        },
        {
          text: 'Delete Rating',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Rating',
              'Are you sure you want to delete this rating?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    if (rating) {
                      await deleteRating(rating.id);
                      router.back();
                    }
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!rating) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Rating not found</Text>
      </View>
    );
  }

  const isOwnRating = user?.id === rating.user_id;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: '',
          headerRight: isOwnRating
            ? () => (
                <Pressable onPress={handleMenuPress} style={styles.menuButton}>
                  <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                </Pressable>
              )
            : undefined,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Poster Section */}
        <View style={styles.heroPosterSection}>
          <AnimatedPressable onPress={() => router.push(`/movie/${rating.movie_id}`)} scaleAmount={0.96}>
            <View style={styles.posterWrapper}>
              <MoviePoster posterPath={rating.movie_poster || null} size="large" />
            </View>
          </AnimatedPressable>

          <Pressable
            style={styles.movieMeta}
            onPress={() => router.push(`/movie/${rating.movie_id}`)}
          >
            <Text style={styles.movieTitle}>{rating.movie_title}</Text>
            <Text style={styles.movieSubtitle}>
              {rating.movie_year}
            </Text>
          </Pressable>
        </View>

        {/* User Rating Card */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingCardHeader}>
            <Pressable
              style={styles.ratingUserSection}
              onPress={() => router.push(`/user/${rating.user_id}`)}
            >
              <Avatar
                uri={rating.user?.avatar_url || null}
                name={rating.user?.display_name}
                size="medium"
              />
              <View style={styles.ratingUserInfo}>
                <View style={styles.ratingUserRow}>
                  <Text style={styles.ratingUserName}>{rating.user?.display_name}</Text>
                  <Text style={styles.ratingAction}> rated this</Text>
                </View>
                <Text style={styles.ratingMeta}>
                  @{rating.user?.username} • {getTimeAgo(new Date(rating.created_at))}
                </Text>
              </View>
            </Pressable>
            <ScoreBadge score={rating.score} size="large" showGlow />
          </View>

          {/* Review in quotes */}
          {rating.review && (
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewQuote}>"{rating.review}"</Text>
            </View>
          )}

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <View style={styles.actionButton}>
              <AnimatedHeart
                liked={hasLiked}
                onPress={handleLike}
                size={22}
              />
              <Text style={[styles.actionCount, hasLiked && styles.actionCountActive]}>
                {likesCount}
              </Text>
            </View>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
              <Text style={styles.actionCount}>{comments.length}</Text>
            </View>

            <Pressable style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="chatbubbles-outline" size={14} color={colors.primary} />
            {'  '}COMMENTS ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubble-outline" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
              <Text style={styles.emptyCommentsText}>Be the first to share your thoughts!</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <Pressable
                  style={styles.commentHeader}
                  onPress={() => router.push(`/user/${comment.user_id}`)}
                >
                  <Avatar
                    uri={comment.user?.avatar_url || null}
                    name={comment.user?.display_name}
                    size="small"
                  />
                  <View style={styles.commentUserInfo}>
                    <Text style={styles.commentUserName}>
                      {comment.user?.display_name}
                    </Text>
                    <Text style={styles.commentTime}>
                      {getTimeAgo(new Date(comment.created_at))}
                    </Text>
                  </View>
                </Pressable>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Comment Input */}
      {user && (
        <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              <Ionicons
                name={submitting ? 'ellipsis-horizontal' : 'arrow-up'}
                size={20}
                color={colors.background}
              />
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  menuButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  // Hero Poster Section
  heroPosterSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  posterWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  movieMeta: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  movieSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Rating Card
  ratingCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  ratingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingUserInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  ratingUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ratingUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  ratingAction: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  ratingMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Review
  reviewContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewQuote: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
  },
  actionCount: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  actionCountActive: {
    color: colors.coral,
  },

  // Comments Section
  commentsSection: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCommentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyCommentsText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  commentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  commentUserInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  commentText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Comment Input
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  commentInputWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  commentInput: {
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.md,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginLeft: spacing.sm,
    ...shadows.sm,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
});
