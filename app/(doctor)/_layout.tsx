import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { Icon } from '../../components/Icon';
import { AppHeader } from '../../components/AppHeader';
import { NotificationModal } from '../../components/NotificationModal';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { Colors } from '../../theme';

export default function DoctorTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 8);
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const { data: unreadCount } = useUnreadNotificationCount();

  const isDoctor = user?.role === 'DOCTOR';
  const isAuthorized = !loading && isAuthenticated && isDoctor;

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'DOCTOR')) {
      router.replace('/(auth)');
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          header: () => (
            <AppHeader
              badgeText="Doctor"
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

        {/* 2. Live Queue */}
        <Tabs.Screen
          name="queue"
          options={{
            title: 'Queue',
            tabBarIcon: ({ color, size }) => (
              <Icon name="list-ordered" size={size || 20} color={color} />
            ),
          }}
        />

        {/* 3. Schedule */}
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, size }) => (
              <Icon name="calendar-days" size={size || 20} color={color} />
            ),
          }}
        />

        {/* 4. Patients */}
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ color, size }) => (
              <Icon name="users" size={size || 20} color={color} />
            ),
          }}
        />

        {/* 5. Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon name="user" size={size || 20} color={color} />
            ),
          }}
        />

        {/* Auxiliary Hidden Stack Screens */}
        <Tabs.Screen
          name="prescriptions"
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
          name="clinics"
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
          name="earnings"
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

      {!isAuthorized && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: Colors.light.backgroundSoft,
              zIndex: 999,
            },
          ]}
        >
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      )}

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </View>
  );
}
