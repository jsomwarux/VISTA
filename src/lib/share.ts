import { Platform, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Rating, User } from '../types';

const APP_SCHEME = 'vista';

/**
 * Capture a React Native view ref as a temporary PNG and open the
 * native share sheet with both the image and a text message that
 * includes the deep link.
 *
 * iOS:  Share.share() supports `url` (local file) + `message`.
 * Android: expo-sharing handles file-based sharing.
 */
async function shareWithImage(
  viewRef: React.RefObject<any>,
  message: string,
): Promise<void> {
  try {
    // Capture the card component as a PNG
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    if (Platform.OS === 'ios') {
      // iOS natively supports sharing image + text together
      await Share.share({
        url: uri,
        message,
      });
    } else {
      // Android: use expo-sharing for the image; text is baked into card
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share via VISTA',
        });
      } else {
        // Fallback to text-only share
        await Share.share({ message });
      }
    }
  } catch (_) {
    // User cancelled, capture failed, or share unavailable — nothing to handle
  }
}

/**
 * Share the current user's profile via the native share sheet
 * with a styled image card.
 */
export async function shareProfile(
  user: User,
  ratingsCount: number,
  avgScore: number | string,
  cardRef?: React.RefObject<any>,
): Promise<void> {
  const deepLink = `${APP_SCHEME}://user/${user.id}`;
  const message = [
    `Check out ${user.display_name} (@${user.username}) on VISTA!`,
    `${ratingsCount} films rated${avgScore ? ` \u00B7 ${avgScore} avg score` : ''}`,
    deepLink,
  ].join('\n');

  if (cardRef?.current) {
    return shareWithImage(cardRef, message);
  }

  // Fallback: text-only share
  try {
    await Share.share({ message });
  } catch (_) {
    // User cancelled or share failed
  }
}

/**
 * Share a specific rating via the native share sheet
 * with a styled image card.
 */
export async function shareRating(
  rating: Rating,
  cardRef?: React.RefObject<any>,
): Promise<void> {
  const deepLink = `${APP_SCHEME}://rating/${rating.id}`;
  const raterName = rating.user?.display_name ?? 'Someone';
  const movieInfo = rating.movie_year
    ? `${rating.movie_title} (${rating.movie_year})`
    : rating.movie_title ?? 'a movie';

  const lines: string[] = [
    `${raterName} rated ${movieInfo} a ${rating.score}/100 on VISTA`,
  ];

  if (rating.review) {
    const snippet =
      rating.review.length > 100
        ? rating.review.slice(0, 100).trimEnd() + '...'
        : rating.review;
    lines.push(`"${snippet}"`);
  }

  lines.push(deepLink);

  const message = lines.join('\n');

  if (cardRef?.current) {
    return shareWithImage(cardRef, message);
  }

  // Fallback: text-only share
  try {
    await Share.share({ message });
  } catch (_) {
    // User cancelled or share failed
  }
}
