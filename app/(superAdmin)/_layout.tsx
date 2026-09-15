import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { Icon } from '../../components/Icon';
import { AppHeader } from '../../components/AppHeader';
import { Colors } from '../../theme';

export default function SuperAdminTabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isSuperAdmin)) {
      router.replace('/(auth)');
    }
  }, [loading, isAuthenticated, isSuperAdmin, router]);

  if (loading || !user || !isSuperAdmin) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.light.backgroundSoft,
        }}
      >
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader badgeText="Super Admin" />,
        tabBarActiveTintColor: '#D97706',
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="layout-dashboard" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clinics"
        options={{
          title: 'Clinics',
          tabBarIcon: ({ color, size }) => (
            <Icon name="building" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color, size }) => (
            <Icon name="stethoscope" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Icon name="megaphone" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
