import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { Icon } from '../../components/Icon';
import { AppHeader } from '../../components/AppHeader';
import { Colors } from '../../theme';

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (
      !loading &&
      (!isAuthenticated ||
        (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN'))
    ) {
      router.replace('/(auth)');
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.light.backgroundSoft,
        }}
      >
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader badgeText="Admin" />,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.ink500,
        tabBarStyle: {
          backgroundColor: Colors.light.surfaceWhite,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 64,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      {/* 1. Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="layout-dashboard" size={size || 20} color={color} />
          ),
        }}
      />

      {/* 2. Users */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={size || 20} color={color} />
          ),
        }}
      />

      {/* 3. Clinics */}
      <Tabs.Screen
        name="clinics"
        options={{
          title: 'Clinics',
          tabBarIcon: ({ color, size }) => (
            <Icon name="building" size={size || 20} color={color} />
          ),
        }}
      />

      {/* 4. Doctors */}
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color, size }) => (
            <Icon name="stethoscope" size={size || 20} color={color} />
          ),
        }}
      />

      {/* 5. Diagnostics */}
      <Tabs.Screen
        name="diagnostics"
        options={{
          title: 'Diagnostics',
          tabBarIcon: ({ color, size }) => (
            <Icon name="activity" size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
