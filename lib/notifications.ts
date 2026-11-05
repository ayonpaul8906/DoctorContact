import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { api } from './api';
import { TokenStorage } from './secure-store';

const DELIVERED_NOTIFS_KEY = 'dc_delivered_notification_ids';
export const BACKGROUND_NOTIFICATION_TASK = 'DC_BACKGROUND_NOTIFICATION_TASK';

// Configure notification presentation for foreground/background states
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Initialize native notification channels and permissions
 */
export async function initNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    // 1. Setup high-priority Android notification channel for alerts
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Doctor Contact Alerts',
          description: 'Notifications for appointments, queue tokens, cancellations, and doctor delays',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
          enableVibrate: true,
          showBadge: true,
        });
      } catch (channelErr) {
        // Minimal fallback channel for custom Android builds / Expo Go
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Doctor Contact Alerts',
            importance: Notifications.AndroidImportance.MAX,
          });
        } catch {
          // silently ignore if channel cannot be created
        }
      }
    }

    // 2. Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    if (__DEV__) {
      console.warn('[Notifications] Failed to init notifications:', err);
    }
    return false;
  }
}

/**
 * Register for Expo Push Notifications and sync token with backend.
 * This obtains the ExponentPushToken[...] from Expo Push Service and transmits it to the backend.
 * Once registered, the backend dispatches remote push alerts via Expo + Google FCM,
 * waking up closed / killed Android & iOS apps and displaying status bar notifications instantly.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await initNotifications();
    if (!hasPermission) {
      console.warn('[Push] Notification permission not granted');
      await SecureStore.setItemAsync('dc_expo_push_error', 'Permission not granted');
      return null;
    }

    // Expo Go on Android SDK 53 does not support remote push tokens.
    // Full remote FCM push requires a development build or production APK.
    const isExpoGo =
      (Constants as any)?.appOwnership === 'expo' ||
      (Constants as any)?.executionEnvironment === 'storeClient';

    if (isExpoGo) {
      if (__DEV__) {
        console.log(
          '[Push] Running in Expo Go: Local background notifications are active. For closed-app remote push, use a development build (eas build).'
        );
      }
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId ??
      'ac3a6bae-2b59-4be8-81f6-daa440860e27';

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const pushToken = tokenResponse?.data;
    if (pushToken) {
      console.log('[Push] Successfully obtained Expo push token:', pushToken);
      await SecureStore.setItemAsync('dc_expo_push_token', pushToken);
      await SecureStore.deleteItemAsync('dc_expo_push_error').catch(() => {});
      await syncPushTokenToBackend(pushToken);
      return pushToken;
    } else {
      console.warn('[Push] Empty push token returned');
      await SecureStore.setItemAsync('dc_expo_push_error', 'Empty push token returned');
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('[Push] Failed to get Expo push token:', errMsg);
    await SecureStore.setItemAsync('dc_expo_push_error', errMsg);
  }
  return null;
}

/**
 * Sync the device's Expo push token with the backend.
 * If user is authenticated, backend associates the token with their user account for targeted alerts.
 */
export async function syncPushTokenToBackend(pushToken?: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    let token = pushToken;
    if (!token) {
      token = (await SecureStore.getItemAsync('dc_expo_push_token')) || undefined;
    }
    if (!token) return false;

    console.log('[Push] Syncing push token to backend...');
    const res = await api.post('/notifications/push-token', {
      pushToken: token,
      platform: Platform.OS,
      deviceId: (Constants as any)?.installationId || (Constants as any)?.deviceId || undefined,
    });
    if (res.status >= 200 && res.status < 300) {
      console.log('[Push] Push token synced to backend successfully!');
      await SecureStore.setItemAsync('dc_expo_push_sync_status', 'synced');
      return true;
    } else {
      console.warn('[Push] Backend responded with non-200 status:', res.status);
      await SecureStore.setItemAsync('dc_expo_push_sync_status', `HTTP ${res.status}`);
      return false;
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = status ? `HTTP ${status}` : err?.message || 'Sync failed';
    console.warn('[Push] Backend push token sync error:', msg);
    await SecureStore.setItemAsync('dc_expo_push_sync_status', msg);
    return false;
  }
}

/**
 * Diagnostic helper to inspect push notification registration state
 */
export async function getPushDiagnostics(): Promise<{
  token: string | null;
  tokenError: string | null;
  syncStatus: string | null;
}> {
  try {
    const token = await SecureStore.getItemAsync('dc_expo_push_token');
    const tokenError = await SecureStore.getItemAsync('dc_expo_push_error');
    const syncStatus = await SecureStore.getItemAsync('dc_expo_push_sync_status');
    return { token, tokenError, syncStatus };
  } catch {
    return { token: null, tokenError: null, syncStatus: null };
  }
}

/**
 * Get IDs of notifications that have already been presented in the system notification shade
 */
export async function getDeliveredNotificationIds(): Promise<string[]> {
  if (Platform.OS === 'web') return [];
  try {
    const raw = await SecureStore.getItemAsync(DELIVERED_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a notification as delivered so it is never re-delivered
 */
export async function markNotificationDelivered(id: string): Promise<void> {
  if (Platform.OS === 'web' || !id) return;
  try {
    const list = await getDeliveredNotificationIds();
    if (!list.includes(id)) {
      list.push(id);
      // Keep list bounded to last 200 delivered notifications
      const trimmed = list.slice(-200);
      await SecureStore.setItemAsync(DELIVERED_NOTIFS_KEY, JSON.stringify(trimmed));
    }
  } catch {}
}

/**
 * Post a notification directly into the mobile notification bar.
 * Uses notification.id as the identifier so multiple notifications (e.g. 2 notifications)
 * can appear simultaneously in the notification bar without overwriting each other.
 */
export async function postSystemNotification(notification: {
  id: string;
  title: string;
  message: string;
  type?: string;
  meta?: any;
}): Promise<void> {
  if (Platform.OS === 'web' || !notification?.id) return;

  try {
    const delivered = await getDeliveredNotificationIds();
    if (delivered.includes(notification.id)) {
      return; // Already presented to the user
    }

    await Notifications.scheduleNotificationAsync({
      identifier: notification.id,
      content: {
        title: notification.title || 'Doctor Contact Alert',
        body: notification.message || '',
        data: {
          notificationId: notification.id,
          type: notification.type,
          meta: notification.meta,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: 1,
      },
      trigger: null, // deliver immediately
    });

    await markNotificationDelivered(notification.id);
  } catch (err) {
    if (__DEV__) {
      console.warn('[Notifications] Failed to post system notification:', err);
    }
  }
}

/**
 * Dismiss a specific notification from the mobile notification bar.
 * Called when the user views the notification details or marks it as read.
 */
export async function dismissSystemNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web' || !notificationId) return;
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch (err) {
    if (__DEV__) {
      console.warn('[Notifications] Failed to dismiss notification:', err);
    }
  }
}

/**
 * Dismiss all notifications from the mobile notification bar.
 * Called when the user views the notifications modal or marks all as read.
 */
export async function dismissAllSystemNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (err) {
    if (__DEV__) {
      console.warn('[Notifications] Failed to dismiss all notifications:', err);
    }
  }
}

/**
 * Check backend for new unread notifications and announcements,
 * delivering any unread items directly to the mobile notification bar.
 * Used during background fetch and app state foreground transitions.
 */
export async function checkAndDeliverNewNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  let deliveredCount = 0;

  try {
    const delivered = await getDeliveredNotificationIds();

    // 1. Check user personal notifications (/notifications/me) if logged in
    try {
      const token = await TokenStorage.getAccessToken();
      if (token) {
        const response = await api.get('/notifications/me?limit=15');
        const items: any[] = response.data?.data?.items || response.data?.items || [];
        for (const item of items) {
          // Only unread notifications that haven't been delivered to the notification bar yet
          if (!item.isRead && !delivered.includes(item.id)) {
            await postSystemNotification(item);
            deliveredCount++;
          }
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[Notifications] Error checking user notifications:', err);
      }
    }

    // 2. Check global announcements (/announcements/global) (public, works even without login)
    try {
      const annRes = await api.get('/announcements/global');
      const announcements: any[] =
        annRes.data?.data?.announcements || annRes.data?.data || [];

      if (Array.isArray(announcements) && announcements.length > 0) {
        let viewedAnnouncements: string[] = [];
        try {
          const rawViewed = await SecureStore.getItemAsync('dewasi_viewed_announcements_v1');
          if (rawViewed) {
            viewedAnnouncements = JSON.parse(rawViewed);
          }
        } catch {}

        for (const ann of announcements) {
          const annNotifId = `announcement_${ann.id}`;
          // Only deliver if active, not viewed, and not already delivered to system shade
          if (
            ann.id &&
            ann.isActive !== false &&
            !viewedAnnouncements.includes(ann.id) &&
            !delivered.includes(annNotifId)
          ) {
            await postSystemNotification({
              id: annNotifId,
              title: ann.title ? `📢 ${ann.title}` : '📢 New Announcement',
              message: ann.message || '',
              type: 'ANNOUNCEMENT',
              meta: { announcementId: ann.id, type: 'announcement', link: ann.link },
            });
            deliveredCount++;
          }
        }
      }
    } catch (annErr) {
      if (__DEV__) {
        console.warn('[Notifications] Error checking global announcements:', annErr);
      }
    }
  } catch (err) {
    return false;
  }

  return deliveredCount > 0;
}

// -------------------------------------------------------------
// Background Task Registration (runs even when the app is closed)
// -------------------------------------------------------------
if (Platform.OS !== 'web') {
  try {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
      try {
        const hasNew = await checkAndDeliverNewNotifications();
        return hasNew
          ? BackgroundFetch.BackgroundFetchResult.NewData
          : BackgroundFetch.BackgroundFetchResult.NoData;
      } catch {
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  } catch (err) {
    if (__DEV__) {
      console.warn('[Notifications] Failed to define background task:', err);
    }
  }
}

/**
 * Register periodic background fetch task with Android WorkManager / iOS Background App Refresh
 */
export async function registerBackgroundNotificationTask(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('[Notifications] Failed to register background task:', err);
    }
  }
}
