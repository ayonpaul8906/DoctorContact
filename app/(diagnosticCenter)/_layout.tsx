import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { Icon } from '../../components/Icon';
import { AppHeader } from '../../components/AppHeader';
import { Colors } from '../../theme';

export default function DiagnosticCenterTabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'DIAGNOSTIC_CENTER')) {
      router.replace('/(auth)');
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !user || user.role !== 'DIAGNOSTIC_CENTER') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader badgeText="Lab Manager" />,
        tabBarActiveTintColor: '#0F766E', // Teal 700 / Web brand accent
        tabBarInactiveTintColor: '#64748B', // Slate 500
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 60 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '700',
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="layout-dashboard" size={size ? size - 2 : 18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Lab Tests',
          tabBarIcon: ({ color, size }) => (
            <Icon name="flask" size={size ? size - 2 : 18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="referrals"
        options={{
          title: 'Referrals',
          tabBarIcon: ({ color, size }) => (
            <Icon name="inbox" size={size ? size - 2 : 18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clock" size={size ? size - 2 : 18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={size ? size - 2 : 18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="building" size={size ? size - 2 : 18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
