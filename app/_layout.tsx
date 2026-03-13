import React, { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
import { NotificationProvider } from '../src/hooks/useNotifications';
import { CustomBackButton } from '../src/components';
import { colors } from '../src/constants/theme';
import { registerForPushNotifications } from '../src/lib/pushNotifications';
import { tabEvents } from '../src/lib/tabEvents';

function PushNotificationHandler() {
  const { user } = useAuth();
  const router = useRouter();
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    registerForPushNotifications(user.id);

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'like' || data?.type === 'comment') {
        if (data.ratingId) {
          router.push(`/rating/${data.ratingId}`);
        }
      } else if (data?.type === 'follow') {
        if (data.actorId) {
          router.push(`/user/${data.actorId}`);
        }
      } else {
        router.push('/notifications');
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, [user?.id]);

  return null;
}

const TAB_CONFIG = [
  { key: 'index', label: 'Profile', activeIcon: 'person' as const, inactiveIcon: 'person-outline' as const, path: '/(tabs)' },
  { key: 'friends', label: 'Friends', activeIcon: 'people' as const, inactiveIcon: 'people-outline' as const, path: '/(tabs)/friends' },
  { key: 'explore', label: 'Explore', activeIcon: 'compass' as const, inactiveIcon: 'compass-outline' as const, path: '/(tabs)/explore' },
];

function PersistentTabBar() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('index');

  const segmentArray = segments as string[];
  const firstSegment = segmentArray[0];
  const segmentKey = segmentArray.join('/');

  // Track active tab when in tabs group
  useEffect(() => {
    if (segmentArray[0] === '(tabs)') {
      const tabName = segmentArray[1] || 'index';
      setActiveTab(tabName);
    }
  }, [segmentKey]);

  // Don't show when not logged in
  if (!user) return null;

  // Don't show on auth, onboarding, or rate modal screens
  if (firstSegment === '(auth)' || firstSegment === 'onboarding' || firstSegment === 'rate') return null;

  const handleTabPress = (tab: typeof TAB_CONFIG[number]) => {
    if (activeTab === tab.key && segmentArray[0] === '(tabs)') {
      // Already on this tab — scroll to top
      tabEvents.emit(`scrollToTop:${tab.key}`);
    } else {
      setActiveTab(tab.key);
      router.navigate(tab.path as any);
    }
  };

  return (
    <View style={[tabBarStyles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      {TAB_CONFIG.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={tabBarStyles.tab}
            onPress={() => handleTabPress(tab)}
          >
            <View style={[tabBarStyles.iconWrap, isActive && tabBarStyles.iconWrapActive]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={24}
                color={isActive ? colors.primary : colors.textMuted}
              />
            </View>
            <Text style={[tabBarStyles.label, { color: isActive ? colors.primary : colors.textMuted }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthProvider>
        <NotificationProvider>
        <StatusBar style="light" />
        <PushNotificationHandler />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="movie/[id]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              title: '',
              headerLeft: () => <CustomBackButton />,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="user/[id]"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              title: '',
              headerLeft: () => <CustomBackButton />,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="rating/[id]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              title: '',
              headerLeft: () => <CustomBackButton />,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="person/[id]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              title: '',
              headerLeft: () => <CustomBackButton />,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="rate"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="terms"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              title: 'Terms of Use',
              headerLeft: () => <CustomBackButton />,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="privacy"
            options={{
              headerShown: true,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerShadowVisible: false,
              title: 'Privacy Policy',
              headerLeft: () => <CustomBackButton />,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <PersistentTabBar />
        </NotificationProvider>
      </AuthProvider>
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(21, 21, 24, 0.95)',
    borderTopColor: colors.border,
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconWrapActive: {
    transform: [{ scale: 1.05 }],
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});
