import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
    <>
      <StatusBar style="light" backgroundColor="#22C55E" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="diagnosis/[id]" />
        <Stack.Screen name="house/[id]" />
        <Stack.Screen name="knowledge/[id]" />
        <Stack.Screen name="production/[id]" />
        <Stack.Screen name="prevention/[diagnosisId]" />
        <Stack.Screen name="environment/[houseId]" />
        <Stack.Screen name="mall/[id]" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="service" />
        <Stack.Screen name="consult" />
        <Stack.Screen name="consult/[id]" />
        <Stack.Screen name="merchant" />
        <Stack.Screen name="merchant/products" />
        <Stack.Screen name="merchant/orders" />
        <Stack.Screen name="merchant/bulk" />
        <Stack.Screen name="bulk-purchase" />
        <Stack.Screen name="bulk-purchase/new" />
        <Stack.Screen name="bulk-purchase/[id]" />
        <Stack.Screen name="logistics/[orderId]" />
        <Stack.Screen name="commissions" />
        <Stack.Screen name="immunization" />
        <Stack.Screen name="epidemic-alert" />
        <Stack.Screen name="epidemiology" />
        <Stack.Screen name="course" />
        <Stack.Screen name="exam-paper" />
      </Stack>
    </>
  );
}