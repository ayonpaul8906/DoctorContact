import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { AuthProvider } from '../lib/auth-context';
import { LanguageProvider } from '../lib/language-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#F4F7FE' },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(patient)" options={{ headerShown: false }} />
              <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
              <Stack.Screen name="(clinic)" options={{ headerShown: false }} />
              <Stack.Screen name="(receptionist)" options={{ headerShown: false }} />
              <Stack.Screen name="(diagnosticCenter)" options={{ headerShown: false }} />
              <Stack.Screen name="(diagnosticStaff)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="(superAdmin)" options={{ headerShown: false }} />
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
            </Stack>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
