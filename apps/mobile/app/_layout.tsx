import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/auth';

export default function RootLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#22C55E' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="diagnosis/[id]" />
      <Stack.Screen name="house/[id]" />
      <Stack.Screen name="knowledge/[id]" />
    </Stack>
  );
}