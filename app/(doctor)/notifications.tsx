import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useDoctorNotifications,
  useDoctorUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useDoctor';
import { useAppointmentRealtime } from '../../hooks/useAppointmentRealtime';
import type { AppNotification } from '../../types';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function DoctorNotificationsScreen() {
  const { isConnected } = useAppointmentRealtime();

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDoctorNotifications();

  const { data: unreadCount = 0 } = useDoctorUnreadNotificationCount();

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch {
      // safe fallback
    }
  };

  const handleItemPress = (item: AppNotification) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_BOOKED':
        return { name: 'calendar' as const, color: '#1D4ED8', bg: '#EFF6FF' };
      case 'APPOINTMENT_CANCELLED':
        return { name: 'alert-circle' as const, color: '#BE123C', bg: '#FEF2F2' };
      case 'CONNECTION_REQUEST_RECEIVED':
      case 'CONNECTION_REQUEST_RESPONDED':
        return { name: 'building' as const, color: '#7C3AED', bg: '#FAF5FF' };
      case 'DOCTOR_VERIFIED':
        return { name: 'check-circle' as const, color: '#047857', bg: '#ECFDF5' };
      default:
        return { name: 'bell' as const, color: Colors.light.ink600, bg: Colors.light.surface100 };
    }
  };

  const formatTimeAgo = (isoStr: string) => {
    if (!isoStr) return '';
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.topContainer}>
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View style={styles.headerTitles}>
                <Text style={styles.headerTitle}>Notifications Center</Text>
                <Text style={styles.headerSubtitle}>
                  Realtime updates on appointments, queue, and requests
                </Text>
              </View>

              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  onPress={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  activeOpacity={0.8}
                >
                  <Text style={styles.markAllBtnText}>Mark All Read</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GradientCard>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading notifications...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={28} color={Colors.light.danger} />
          <Text style={styles.errorTitle}>Unable to load notifications</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : 'Please check your connection.'}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name="bell" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            When appointments are booked or clinic requests arrive, you will see notifications here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          renderItem={({ item }) => {
            const iconInfo = getNotificationIcon(item.type);

            return (
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  !item.isRead && styles.notificationItemUnread,
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
                  <Icon name={iconInfo.name} size={16} color={iconInfo.color} />
                </View>

                <View style={styles.notifContentCol}>
                  <View style={styles.notifTopRow}>
                    <Text
                      style={[
                        styles.notifTitle,
                        !item.isRead && styles.notifTitleUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.notifTime}>{formatTimeAgo(item.createdAt)}</Text>
                  </View>

                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                </View>

                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  topContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  headerCard: {
    marginBottom: 0,
  },
  headerContent: {
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  markAllBtn: {
    backgroundColor: Colors.light.surface50,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  markAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#991B1B',
  },
  retryBtn: {
    backgroundColor: Colors.light.danger,
    paddingVertical: 8,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    maxWidth: 280,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  notificationItemUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContentCol: {
    flex: 1,
    gap: 2,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink800,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  notifTime: {
    fontSize: 10,
    color: Colors.light.ink400,
  },
  notifMessage: {
    fontSize: 11,
    color: Colors.light.ink600,
    lineHeight: 15,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
});
