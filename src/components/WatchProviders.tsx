import React from 'react';
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
import { colors, spacing, borderRadius, shadows } from '../constants/theme';
import { WatchProviders as WatchProvidersType, WatchProvider } from '../types';
import { getImageUrl } from '../lib/tmdb';

interface WatchProvidersProps {
  providers: WatchProvidersType | null;
  loading?: boolean;
}

export const WatchProviders: React.FC<WatchProvidersProps> = ({ providers, loading }) => {
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
  const hasRentProviders = providers?.rent && providers.rent.length > 0;
  const hasBuyProviders = providers?.buy && providers.buy.length > 0;
  const hasFreeProviders = providers?.free && providers.free.length > 0;
  const hasAnyProviders = hasStreamingProviders || hasRentProviders || hasBuyProviders || hasFreeProviders;

  if (!hasAnyProviders) {
    return null; // Hide section if no providers available
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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>WHERE TO WATCH</Text>

      <View style={styles.providersCard}>
        {hasStreamingProviders && renderProviderRow(providers!.flatrate!, 'Stream')}
        {hasFreeProviders && renderProviderRow(providers!.free!, 'Free')}
        {hasRentProviders && renderProviderRow(providers!.rent!, 'Rent')}
        {hasBuyProviders && renderProviderRow(providers!.buy!, 'Buy')}

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
