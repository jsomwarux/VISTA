import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../src/constants/theme';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Privacy Policy',
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
        <Text style={styles.lastUpdated}>Last Updated: January 25, 2025</Text>

        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.body}>
          VISTA ("we," "our," or "us") is a social movie rating application. This Privacy Policy explains how we collect, use, and protect your personal information when you use our app.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.subTitle}>Information You Provide</Text>
        <Text style={styles.body}>
          {'\u2022'} Account Information: Email address, username, and display name when you create an account{'\n'}
          {'\u2022'} Profile Information: Profile photo and bio (optional){'\n'}
          {'\u2022'} User Content: Movie ratings (scores 1-100), reviews, comments, and likes{'\n'}
          {'\u2022'} Social Connections: Information about users you follow and who follow you
        </Text>

        <Text style={styles.subTitle}>Information Collected Automatically</Text>
        <Text style={styles.body}>
          {'\u2022'} Usage Data: How you interact with the app, including movies viewed and features used{'\n'}
          {'\u2022'} Device Information: Device type, operating system, and app version
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.body}>
          We use your information to:{'\n\n'}
          {'\u2022'} Provide and maintain the VISTA service{'\n'}
          {'\u2022'} Display your ratings and reviews to other users{'\n'}
          {'\u2022'} Calculate taste compatibility scores between users{'\n'}
          {'\u2022'} Show your activity in friends' feeds{'\n'}
          {'\u2022'} Send service-related notifications{'\n'}
          {'\u2022'} Improve and develop new features{'\n'}
          {'\u2022'} Ensure security and prevent abuse
        </Text>

        <Text style={styles.sectionTitle}>Third-Party Services</Text>
        <Text style={styles.body}>
          We use the following third-party services:{'\n\n'}
          {'\u2022'} Supabase — Database and authentication (account data, ratings, social connections){'\n'}
          {'\u2022'} The Movie Database (TMDB) — Movie information and images (no personal data shared){'\n'}
          {'\u2022'} Expo — App development and updates (anonymous usage analytics){'\n\n'}
          These services have their own privacy policies governing how they handle data.
        </Text>

        <Text style={styles.sectionTitle}>Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal information. Your data may be shared:{'\n\n'}
          {'\u2022'} Publicly: Your username, display name, profile photo, ratings, and reviews are visible to other VISTA users{'\n'}
          {'\u2022'} With Your Consent: When you explicitly choose to share content{'\n'}
          {'\u2022'} Legal Requirements: If required by law or to protect our rights
        </Text>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Text style={styles.body}>
          {'\u2022'} Active Accounts: We retain your data while your account is active{'\n'}
          {'\u2022'} Deleted Accounts: When you delete your account, we remove your personal data within 30 days, except where retention is required by law{'\n'}
          {'\u2022'} Ratings and Reviews: May be anonymized and retained for aggregate statistics
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.body}>
          You have the right to:{'\n\n'}
          {'\u2022'} Access: Request a copy of your personal data{'\n'}
          {'\u2022'} Correction: Update or correct inaccurate information{'\n'}
          {'\u2022'} Deletion: Delete your account and associated data{'\n'}
          {'\u2022'} Export: Download your ratings and reviews{'\n'}
          {'\u2022'} Withdraw Consent: Opt out of optional data collection{'\n\n'}
          To exercise your rights, use Settings in the app or email support@vistaapp.io.
        </Text>

        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.body}>
          We implement appropriate technical and organizational measures to protect your data, including encrypted data transmission (HTTPS/TLS), secure database access controls, and regular security reviews.
        </Text>

        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.body}>
          VISTA is not intended for users under 13 years of age. We do not knowingly collect data from children under 13.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy periodically. We will notify you of significant changes via the app or email.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          For privacy-related questions or concerns:{'\n\n'}
          {'\u2022'} Email: privacy@vistaapp.io{'\n'}
          {'\u2022'} Support: support@vistaapp.io
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
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
