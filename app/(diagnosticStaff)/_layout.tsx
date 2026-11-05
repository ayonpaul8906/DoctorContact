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

export default function DiagnosticStaffTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 8);
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const { data: unreadCount } = useUnreadNotificationCount();

  const isStaff = user?.role === 'DIAGNOSTIC_STAFF';
  const isAuthorized = !loading && isAuthenticated && isStaff;

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'DIAGNOSTIC_STAFF')) {
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
              badgeText="Staff"
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
          name="tests"
          options={{
            title: 'My Tests',
            tabBarIcon: ({ color, size }) => (
              <Icon name="flask" size={size || 20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Icon name="user" size={size || 20} color={color} />
            ),
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
