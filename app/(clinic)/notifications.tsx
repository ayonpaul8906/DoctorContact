import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useClinicNotifications,
  useClinicUnreadNotificationCount,
  useMarkClinicNotificationRead,
  useMarkAllClinicNotificationsRead,
} from '../../hooks/useClinic';
import { useAppointmentRealtime } from '../../hooks/useAppointmentRealtime';
import {
  GradientCard,
  Icon,
} from '../../components';
import type { AppNotification } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function ClinicNotificationsScreen() {
  const router = useRouter();
  const { isConnected } = useAppointmentRealtime();

  const {
    data: notifications = [],
    isLoading,
    refetch,
    isRefetching,
  } = useClinicNotifications();

  const { data: unreadCount = 0 } = useClinicUnreadNotificationCount();
  const markReadMutation = useMarkClinicNotificationRead();
  const markAllReadMutation = useMarkAllClinicNotificationsRead();

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllReadMutation.mutate();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_BOOKED':
      case 'APPOINTMENT_CANCELLED':
        return 'calendar';
      case 'CONNECTION_REQUEST_RECEIVED':
      case 'CONNECTION_REQUEST_RESPONDED':
        return 'inbox';
      case 'DOCTOR_VERIFIED':
      case 'CLINIC_APPROVED':
        return 'check-circle';
      case 'CLINIC_REVOKED':
        return 'alert-circle';
      default:
        return 'bell';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={18} color={Colors.light.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Notifications</Text>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.markAllBtnText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <View style={styles.topContainer}>
        {/* 2. Banner */}
        <GradientCard variant="blue" style={styles.bannerCard}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTop}>
              <View style={styles.bannerTitles}>
                <Text style={styles.bannerHeading}>Clinic Alert Center</Text>
                <Text style={styles.bannerSub}>
                  {unreadCount > 0
                    ? `${unreadCount} Unread alerts requiring front-desk attention`
                    : 'All notifications up to date'}
                </Text>
              </View>

              <View style={styles.socketPill}>
                <View
                  style={[
                    styles.socketDot,
                    { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
                  ]}
                />
                <Text style={styles.socketPillText}>
                  {isConnected ? 'Realtime' : 'Connecting'}
                </Text>
              </View>
            </View>
          </View>
        </GradientCard>
      </View>

      {/* 3. Notification Feed */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Fetching alerts...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="bell" size={28} color={Colors.light.ink400} />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            When appointments are booked or doctor connections arrive, alerts will appear here.
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
            const isUnread = !item.isRead;
            const iconName = getNotificationIcon(item.type);

            return (
              <TouchableOpacity
                onPress={() => {
                  if (isUnread) markReadMutation.mutate(item.id);
                }}
                activeOpacity={0.8}
              >
                <GradientCard variant={isUnread ? 'blue' : 'green'} style={styles.notifCard}>
                  <View style={styles.notifCardContent}>
                    <View style={styles.notifHeaderRow}>
                      <View style={styles.notifIconBox}>
                        <Icon name={iconName} size={16} color="#FFFFFF" />
                      </View>

                      <View style={styles.notifTextCol}>
                        <View style={styles.notifTitleRow}>
                          <Text style={styles.notifTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {isUnread && <View style={styles.unreadDot} />}
                        </View>

                        <Text style={styles.notifMessage}>{item.message}</Text>
                        <Text style={styles.notifTime}>
                          {new Date(item.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </GradientCard>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBarTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  topContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  bannerCard: {
    marginBottom: 0,
  },
  bannerContent: {
    padding: Spacing.four,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitles: {
    flex: 1,
    gap: 2,
  },
  bannerHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  socketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  socketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  socketPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  notifCard: {
    marginBottom: 0,
  },
  notifCardContent: {
    padding: Spacing.three,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  notifIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTextCol: {
    flex: 1,
    gap: 2,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3B82F6',
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 11,
    color: Colors.light.ink700,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 9,
    color: Colors.light.ink400,
    marginTop: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyIconCircle: {
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
});
