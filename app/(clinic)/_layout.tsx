import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { Icon } from '../../components/Icon';
import { AppHeader } from '../../components/AppHeader';
import { Colors } from '../../theme';

export default function ClinicTabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'CLINIC')) {
      router.replace('/(auth)');
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !user || user.role !== 'CLINIC') {
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
        header: () => <AppHeader badgeText="Clinic" />,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.ink500,
        tabBarStyle: {
          backgroundColor: Colors.light.surfaceWhite,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
          height: 60 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
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

      {/* 2. Overview (Doctors & Receptionists) */}
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={size || 20} color={color} />
          ),
        }}
      />

      {/* 3. Management (Queue, Appointments, Schedule, Follow-ups, Requests) */}
      <Tabs.Screen
        name="management"
        options={{
          title: 'Management',
          tabBarIcon: ({ color, size }) => (
            <Icon name="sliders" size={size || 20} color={color} />
          ),
        }}
      />

      {/* 4. Services (Referrals & Reports) */}
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => (
            <Icon name="activity" size={size || 20} color={color} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="building" size={size || 20} color={color} />
          ),
        }}
      />

      {/* Auxiliary / Sub-Stack Hidden Screens */}
      <Tabs.Screen
        name="queue"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="receptionists"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="referrals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
