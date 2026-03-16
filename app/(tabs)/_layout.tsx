import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/constants/theme';
import { FloatingActionButton } from '../../src/components';
import { useAuth } from '../../src/hooks/useAuth';
import { useNotifications } from '../../src/hooks/useNotifications';

type IconName = 'person' | 'person-outline' | 'people' | 'people-outline' | 'compass' | 'compass-outline';

interface TabIconProps {
  name: IconName;
  focused: boolean;
}

function TabIcon({ name, focused }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      style={styles.bellButton}
    >
      <Ionicons
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
        size={22}
        color={unreadCount > 0 ? colors.primary : colors.textSecondary}
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, getUnreadCount, subscribeToNotifications, unsubscribe } = useNotifications();

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    getUnreadCount(user.id);

    // Subscribe to real-time notification updates
    const cleanup = subscribeToNotifications(user.id);

    return () => {
      cleanup();
    };
  }, [user?.id]);

  const headerRight = user
    ? () => <NotificationBell unreadCount={unreadCount} />
    : undefined;

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerRight,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'VISTA',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'VISTA',
          tabBarLabel: 'Friends',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'people' : 'people-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'VISTA',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'compass' : 'compass-outline'}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
    <FloatingActionButton
      onPress={() => router.push('/rate')}
      style={styles.fab}
    />
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 120,
  },
  bellButton: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
  },
});
