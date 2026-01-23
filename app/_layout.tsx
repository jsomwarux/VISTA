import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '../src/hooks/useAuth';
import { CustomBackButton } from '../src/components';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthProvider>
        <StatusBar style="light" />
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
            name="rate"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </AuthProvider>
    </View>
  );
}
