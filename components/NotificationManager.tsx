import React, { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { useAppointmentRealtime } from '../hooks/useAppointmentRealtime';
import {
  initNotifications,
  registerForPushNotificationsAsync,
  syncPushTokenToBackend,
  registerBackgroundNotificationTask,
  checkAndDeliverNewNotifications,
  dismissSystemNotification,
} from '../lib/notifications';
import { api } from '../lib/api';

/**
 * Global Notification Manager
 * Handles:
 * 1. Native status bar notification channel configuration & permissions
 * 2. Background task registration to fetch notifications even when app is closed
 * 3. Realtime Socket.IO notification reception & native alert posting
 * 4. User tap handling in mobile notification bar & auto-dismissal
 */
export function NotificationManager() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Maintain active socket connection globally for logged-in user
  useAppointmentRealtime();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Initialize notification channels, permissions & register push token
    initNotifications().then((granted) => {
      if (granted) {
        // Register remote push token with Expo & backend (enables alerts when app is closed)
        registerForPushNotificationsAsync();
        // Register background task as an additional layer of reliability
        registerBackgroundNotificationTask();
        // Check for any unread undelivered notifications immediately
        checkAndDeliverNewNotifications();
      }
    });

    // Handle user tapping on a notification in the system notification shade
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        try {
          const data = response.notification.request.content.data as Record<string, any> | undefined;
          const rawId = data?.notificationId || response.notification.request.identifier;
          const notificationId = typeof rawId === 'string' ? rawId : undefined;

          // 1. Immediately dismiss from mobile notification bar
          if (notificationId) {
            await dismissSystemNotification(notificationId);
            if (!notificationId.startsWith('announcement_')) {
              // Mark user notification as read on backend
              await api.patch(`/notifications/${notificationId}/read`).catch(() => {});
            } else {
              // Mark announcement as viewed in SecureStore
              const annId = data?.meta?.announcementId || notificationId.replace('announcement_', '');
              try {
                const stored = await SecureStore.getItemAsync('dewasi_viewed_announcements_v1');
                const list: string[] = stored ? JSON.parse(stored) : [];
                if (!list.includes(annId)) {
                  list.push(annId);
                  await SecureStore.setItemAsync('dewasi_viewed_announcements_v1', JSON.stringify(list));
                }
              } catch {}
            }
          }

          // 2. Navigate if notification has target metadata
          if (data?.type === 'ANNOUNCEMENT' || data?.meta?.type === 'announcement') {
            if (data?.meta?.link && typeof data.meta.link === 'string' && data.meta.link.startsWith('http')) {
              Linking.openURL(data.meta.link).catch(() => {});
            }
          } else if (data?.meta?.appointmentId) {
            router.push({
              pathname: '/(patient)/appointment/[id]' as any,
              params: { id: String(data.meta.appointmentId) },
            });
          }
        } catch (err) {
          if (__DEV__) {
            console.warn('[NotificationManager] Notification tap handler error:', err);
          }
        }
      }
    );

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  // When user logs in or switches account, associate device push token with user ID and sync notifications
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      syncPushTokenToBackend();
      checkAndDeliverNewNotifications();
    }
  }, [isAuthenticated, user?.id]);

  return null;
}
