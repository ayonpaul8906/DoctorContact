import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../components/Icon';
import { AppHeader } from '../../components/AppHeader';
import { NotificationModal } from '../../components/NotificationModal';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { Colors } from '../../theme';

export default function PatientTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 8);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const { data: unreadCount } = useUnreadNotificationCount();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          header: () => (
            <AppHeader
              badgeText="Patient"
              showNotificationButton={true}
              unreadNotificationCount={unreadCount ?? 0}
              onNotificationPress={() => setNotificationModalVisible(true)}
            />
          ),
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.ink500,
        tabBarStyle: {
          backgroundColor: Colors.light.surfaceWhite,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={size || 22} color={color} />
          ),
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
    </Tabs>
    <NotificationModal
      visible={notificationModalVisible}
      onClose={() => setNotificationModalVisible(false)}
    />
  </>
  );
}
