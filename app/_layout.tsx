import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '../lib/query-client';
import { AuthProvider } from '../lib/auth-context';
import { LanguageProvider } from '../lib/language-context';
import { NotificationManager } from '../components/NotificationManager';

// Keep the splash screen visible while assets and initial auth state load
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Release native splash screen once root layout has mounted
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <StatusBar style="dark" />
            <NotificationManager />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#F4F7FE' },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
              <Stack.Screen name="doctors" options={{ headerShown: false }} />
              <Stack.Screen name="clinics" options={{ headerShown: false }} />
              <Stack.Screen name="labs" options={{ headerShown: false }} />
              <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="clinic/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="book" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(patient)" options={{ headerShown: false }} />
              <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
              <Stack.Screen name="(clinic)" options={{ headerShown: false }} />
              <Stack.Screen name="(receptionist)" options={{ headerShown: false }} />
              <Stack.Screen name="(diagnosticCenter)" options={{ headerShown: false }} />
              <Stack.Screen name="(diagnosticStaff)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="(superAdmin)" options={{ headerShown: false }} />
            </Stack>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
