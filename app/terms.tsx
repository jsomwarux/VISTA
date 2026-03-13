import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../src/constants/theme';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Terms of Use',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text style={styles.lastUpdated}>Last Updated: February 4, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By creating an account or using VISTA, you agree to be bound by these Terms of Use. If you do not agree to these terms, do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>2. User Accounts</Text>
        <Text style={styles.body}>
          You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and all activity under it. You must be at least 13 years old to use VISTA.
        </Text>

        <Text style={styles.sectionTitle}>3. User-Generated Content</Text>
        <Text style={styles.body}>
          You may post movie ratings, reviews, and comments on VISTA. You retain ownership of your content but grant VISTA a non-exclusive, worldwide license to display it within the app.
        </Text>

        <Text style={styles.sectionTitle}>4. Prohibited Content and Conduct</Text>
        <Text style={styles.body}>
          VISTA has a zero-tolerance policy for objectionable content and abusive behavior. You agree NOT to post content that:{'\n\n'}
          {'\u2022'} Is hateful, threatening, or promotes violence{'\n'}
          {'\u2022'} Contains slurs, discrimination, or harassment targeting any individual or group{'\n'}
          {'\u2022'} Is sexually explicit or pornographic{'\n'}
          {'\u2022'} Promotes self-harm or suicide{'\n'}
          {'\u2022'} Is spam, deceptive, or misleading{'\n'}
          {'\u2022'} Infringes on intellectual property rights{'\n'}
          {'\u2022'} Contains personal or private information of others{'\n'}
          {'\u2022'} Impersonates another person or entity{'\n\n'}
          You also agree NOT to:{'\n\n'}
          {'\u2022'} Harass, bully, or intimidate other users{'\n'}
          {'\u2022'} Use the app for any illegal purpose{'\n'}
          {'\u2022'} Attempt to circumvent content moderation systems{'\n'}
          {'\u2022'} Create multiple accounts to evade bans or blocks
        </Text>

        <Text style={styles.sectionTitle}>5. Content Moderation and Enforcement</Text>
        <Text style={styles.body}>
          VISTA reserves the right to review, remove, or disable access to any content that violates these terms, at our sole discretion. We use automated filtering and manual review to enforce our policies.{'\n\n'}
          Users can report objectionable content and abusive users through the app. We will review all reports within 24 hours.{'\n\n'}
          Violations may result in:{'\n\n'}
          {'\u2022'} Content removal{'\n'}
          {'\u2022'} Temporary account suspension{'\n'}
          {'\u2022'} Permanent account termination{'\n\n'}
          Serious or repeated violations will result in immediate and permanent account termination.
        </Text>

        <Text style={styles.sectionTitle}>6. Blocking Users</Text>
        <Text style={styles.body}>
          You may block other users at any time. Blocking a user will remove their content from your feed and prevent them from interacting with your content. Blocking also notifies the VISTA team for review.
        </Text>

        <Text style={styles.sectionTitle}>7. Account Deletion</Text>
        <Text style={styles.body}>
          You may delete your account at any time from the Edit Profile screen. Deleting your account permanently removes your profile, ratings, reviews, comments, and all associated data. This action cannot be undone.
        </Text>

        <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
        <Text style={styles.body}>
          VISTA uses The Movie Database (TMDB) for movie information. Movie data, images, and metadata are provided by TMDB and are subject to their terms of use.
        </Text>

        <Text style={styles.sectionTitle}>9. Disclaimer of Warranties</Text>
        <Text style={styles.body}>
          VISTA is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation of the app.
        </Text>

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.body}>
          To the fullest extent permitted by law, VISTA shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these Terms of Use at any time. Continued use of VISTA after changes constitutes acceptance of the updated terms. We will notify users of significant changes.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact</Text>
        <Text style={styles.body}>
          For questions about these terms, contact us at support@vistaapp.io.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  lastUpdated: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
