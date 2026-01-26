import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/theme';
import { WatchProviders as WatchProvidersType, WatchProvider } from '../types';
import { getImageUrl } from '../lib/tmdb';

interface WatchProvidersProps {
  providers: WatchProvidersType | null;
  loading?: boolean;
  releaseDate?: string;
}

export const WatchProviders: React.FC<WatchProvidersProps> = ({ providers, loading, releaseDate }) => {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>WHERE TO WATCH</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Check if there are any providers
  const hasStreamingProviders = providers?.flatrate && providers.flatrate.length > 0;
  const hasFreeProviders = providers?.free && providers.free.length > 0;
  const hasRentProviders = providers?.rent && providers.rent.length > 0;
  const hasBuyProviders = providers?.buy && providers.buy.length > 0;
  const hasAnyProviders = hasStreamingProviders || hasRentProviders || hasBuyProviders || hasFreeProviders;

  // Check if movie is likely in theaters (released within last 4 months, no home options)
  const isInTheaters = (() => {
    if (hasAnyProviders) return false;
    if (!releaseDate) return false;

    const release = new Date(releaseDate);
    const now = new Date();
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    // Movie is in theaters if released between 4 months ago and today (or future)
    return release >= fourMonthsAgo && release <= now;
  })();

  if (!hasAnyProviders && !isInTheaters) {
    return null;
  }

  const handleOpenLink = () => {
    if (providers?.link) {
      Linking.openURL(providers.link);
    }
  };

  const renderProviderRow = (providerList: WatchProvider[], label: string) => {
    if (!providerList || providerList.length === 0) return null;

    return (
      <View style={styles.providerSection}>
        <Text style={styles.providerLabel}>{label}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.providerScroll}
        >
          {providerList
            .sort((a, b) => a.display_priority - b.display_priority)
            .map((provider) => (
              <Pressable
                key={provider.provider_id}
                style={styles.providerItem}
                onPress={handleOpenLink}
              >
                <Image
                  source={{ uri: getImageUrl(provider.logo_path, 'w92') || '' }}
                  style={styles.providerLogo}
                />
                <Text style={styles.providerName} numberOfLines={1}>
                  {provider.provider_name}
                </Text>
              </Pressable>
            ))}
        </ScrollView>
      </View>
    );
  };

  // Determine primary and secondary sections based on priority:
  // Stream (flatrate) > Free > Rent > Buy
  let primarySection: React.ReactNode = null;
  let secondarySections: React.ReactNode[] = [];
  let expandLabel = '';

  if (hasStreamingProviders || hasFreeProviders) {
    // Show streaming/free as primary
    primarySection = (
      <>
        {hasStreamingProviders && renderProviderRow(providers!.flatrate!, 'Stream')}
        {hasFreeProviders && renderProviderRow(providers!.free!, 'Free')}
      </>
    );
    // Rent and Buy are secondary (expandable)
    if (hasRentProviders) secondarySections.push(renderProviderRow(providers!.rent!, 'Rent'));
    if (hasBuyProviders) secondarySections.push(renderProviderRow(providers!.buy!, 'Buy'));
    if (hasRentProviders && hasBuyProviders) {
      expandLabel = 'Rent & Buy options';
    } else if (hasRentProviders) {
      expandLabel = 'Rent options';
    } else if (hasBuyProviders) {
      expandLabel = 'Buy options';
    }
  } else if (hasRentProviders) {
    // No streaming - show Rent as primary
    primarySection = renderProviderRow(providers!.rent!, 'Rent');
    // Buy is secondary
    if (hasBuyProviders) {
      secondarySections.push(renderProviderRow(providers!.buy!, 'Buy'));
      expandLabel = 'Buy options';
    }
  } else if (hasBuyProviders) {
    // Only Buy available - show it as primary
    primarySection = renderProviderRow(providers!.buy!, 'Buy');
  }

  const hasExpandableContent = secondarySections.length > 0;

  // Show "In Theaters" if no providers but movie is recent
  if (isInTheaters) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>WHERE TO WATCH</Text>
        <View style={styles.providersCard}>
          <View style={styles.inTheatersContainer}>
            <View style={styles.inTheatersIcon}>
              <Ionicons name="film" size={24} color={colors.primary} />
            </View>
            <View style={styles.inTheatersText}>
              <Text style={styles.inTheatersTitle}>In Theaters</Text>
              <Text style={styles.inTheatersSubtitle}>Check local showtimes</Text>
            </View>
          </View>
          <View style={styles.attribution}>
            <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
            <Text style={styles.attributionText}>Data provided by JustWatch</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>WHERE TO WATCH</Text>

      <View style={styles.providersCard}>
        {primarySection}

        {hasExpandableContent && (
          <>
            {expanded && (
              <View style={styles.expandedContent}>
                {secondarySections}
              </View>
            )}
            <Pressable
              style={styles.expandButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.expandButtonText}>
                {expanded ? 'Show less' : `Show ${expandLabel}`}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
          </>
        )}

        <View style={styles.attribution}>
          <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
          <Text style={styles.attributionText}>Data provided by JustWatch</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  providersCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerSection: {
    marginBottom: spacing.md,
  },
  providerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerScroll: {
    gap: spacing.sm,
  },
  providerItem: {
    alignItems: 'center',
    width: 56,
  },
  providerLogo: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  providerName: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  expandedContent: {
    marginTop: spacing.xs,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  expandButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  inTheatersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  inTheatersIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inTheatersText: {
    marginLeft: spacing.md,
  },
  inTheatersTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  inTheatersSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attributionText: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
