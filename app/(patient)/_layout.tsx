import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { AppHeader } from '../../components/AppHeader';
import { Colors } from '../../theme';

export default function PatientTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <AppHeader badgeText="Patient" />,
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
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Icon name="layout-dashboard" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="follow-ups"
        options={{
          title: 'Follow-ups',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-clock" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'My Tests',
          tabBarIcon: ({ color, size }) => (
            <Icon name="flask" size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          href: null,
          headerShown: false,
          title: 'Find Doctor',
        }}
      />
      <Tabs.Screen
        name="clinics"
        options={{
          href: null,
          headerShown: false,
          title: 'Clinics Directory',
        }}
      />
      <Tabs.Screen
        name="labs"
        options={{
          href: null,
          headerShown: false,
          title: 'Labs Directory',
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          href: null,
          headerShown: false,
          title: 'Book Appointment',
        }}
      />
      <Tabs.Screen
        name="appointment/[id]"
        options={{
          href: null,
          headerShown: false,
          title: 'Appointment Details',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
