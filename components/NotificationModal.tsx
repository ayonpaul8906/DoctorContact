import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import {
  dismissSystemNotification,
  dismissAllSystemNotifications,
  getPushDiagnostics,
} from '../lib/notifications';
import type { AppNotification } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

function getNotificationStyle(type?: string): {
  icon: IconName;
  bgColor: string;
  iconColor: string;
  badgeLabel: string;
} {
  switch (type) {
    case 'APPOINTMENT_BOOKED':
      return {
        icon: 'calendar-clock',
        bgColor: '#ECFDF5',
        iconColor: '#059669',
        badgeLabel: 'Booked',
      };
    case 'APPOINTMENT_CANCELLED':
      return {
        icon: 'x-circle',
        bgColor: '#FEF2F2',
        iconColor: '#DC2626',
        badgeLabel: 'Cancelled',
      };
    case 'QUEUE_UPDATE':
    case 'STATUS_UPDATE':
      return {
        icon: 'activity',
        bgColor: '#EFF6FF',
        iconColor: '#2563EB',
        badgeLabel: 'Queue Update',
      };
    case 'DOCTOR_DELAY':
      return {
        icon: 'clock',
        bgColor: '#FFFBEB',
        iconColor: '#D97706',
        badgeLabel: 'Delay Alert',
      };
    default:
      return {
        icon: 'bell',
        bgColor: '#F1F5F9',
        iconColor: '#475569',
        badgeLabel: 'Notice',
      };
  }
}

function formatNotificationTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const { data, isLoading, refetch, isRefetching } = useMyNotifications(visible);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [pushDiag, setPushDiag] = React.useState<{
    token: string | null;
    tokenError: string | null;
    syncStatus: string | null;
  } | null>(null);

  const notifications = data?.items ?? [];
  const unreadCount = data?.unread ?? 0;

  // Auto-mark notifications as read and clear mobile notification bar when viewing
  React.useEffect(() => {
    if (visible) {
      dismissAllSystemNotifications();
      getPushDiagnostics().then(setPushDiag);
      if (unreadCount > 0 && !markAllReadMutation.isPending) {
        markAllReadMutation.mutate();
      }
    }
  }, [visible, unreadCount, markAllReadMutation]);

  const handleNotificationPress = (item: AppNotification) => {
    dismissSystemNotification(item.id);
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0 && !markAllReadMutation.isPending) {
      markAllReadMutation.mutate();
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const styleInfo = getNotificationStyle(item.type);
    const formattedTime = formatNotificationTime(item.createdAt);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotificationItem,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.itemIconBox, { backgroundColor: styleInfo.bgColor }]}>
          <Icon name={styleInfo.icon} size={20} color={styleInfo.iconColor} />
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeaderRow}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: styleInfo.bgColor },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: styleInfo.iconColor },
                  ]}
                >
                  {styleInfo.badgeLabel}
                </Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>

          <Text
            style={[
              styles.itemTitle,
              !item.isRead && styles.unreadItemTitle,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text style={styles.itemMessage} numberOfLines={3}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBox}>
              <Icon name="bell" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All notifications caught up'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                style={styles.markAllBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.markAllText}>
                  {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Icon name="x" size={20} color={Colors.light.ink600} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Push Status / Diagnostic Warning */}
        {pushDiag && pushDiag.syncStatus && pushDiag.syncStatus !== 'synced' && (
          <View style={styles.diagBanner}>
            <Icon name="alert-triangle" size={14} color="#D97706" />
            <Text style={styles.diagText}>
              Remote push offline: {pushDiag.syncStatus}. Deploy backend to live server.
            </Text>
          </View>
        )}
        {pushDiag && pushDiag.tokenError && (
          <View style={styles.diagBanner}>
            <Icon name="alert-triangle" size={14} color="#DC2626" />
            <Text style={styles.diagText}>
              FCM token error: {pushDiag.tokenError}. Verify Firebase credentials in EAS.
            </Text>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="bell" size={32} color={Colors.light.ink400} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You have no notifications yet. Updates on your appointments and
              live token queue will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={isRefetching}
            onRefresh={refetch}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  markAllBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
  },
  listContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.three,
  },
  unreadNotificationItem: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3.5,
    borderLeftColor: '#2563EB',
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  timeText: {
    fontSize: 10,
    color: Colors.light.ink400,
    fontWeight: '500',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink800,
    marginBottom: 2,
  },
  unreadItemTitle: {
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  itemMessage: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.ink600,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink800,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  diagBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  diagText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
});
