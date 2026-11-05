import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { ready, signedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    const inAuth = segments[0] === '(auth)';
    if (!signedIn && !inAuth) router.replace('/(auth)/login');
    if (signedIn && inAuth) router.replace('/(tabs)');
  }, [ready, signedIn, segments, router]);
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.white }, headerTintColor: colors.ink, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.soft } }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="more/training" options={{ title: 'My Training' }} />
      <Stack.Screen name="more/performance" options={{ title: 'My Performance' }} />
      <Stack.Screen name="more/new-leave" options={{ title: 'Request Leave', presentation: 'modal' }} />
      <Stack.Screen name="more/new-request" options={{ title: 'New HR Request', presentation: 'modal' }} />
      <Stack.Screen name="more/edit-contact" options={{ title: 'Update Contact Details', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
