import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import {
  useMyAppointments,
  useMyFollowups,
  useMyReferrals,
  useMyBookingStatus,
  useCancelAppointment,
} from '../../hooks/usePatient';
import {
  useMyNotifications,
  useMarkNotificationRead,
} from '../../hooks/useNotifications';
import { NotificationStorage } from '../../lib/secure-store';
import {
  ScreenHeader,
  StatCard,
  AppointmentCard,
  EmptyState,
  QuickActionCard,
  Icon,
  CancelAppointmentModal,
  NotificationModal,
  GradientCard,
} from '../../components';
import type { Appointment } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function PatientOverviewScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'TODAY' | 'HISTORY'>('UPCOMING');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [dismissedNotifId, setDismissedNotifId] = useState<string | null>(null);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  // Load last seen notification ID from storage on mount
  useEffect(() => {
    NotificationStorage.getLastSeenId().then((id) => {
      if (id) setLastSeenId(id);
    });
  }, []);

  // Queries
  const {
    data: appointments,
    isLoading,
    isError,
    refetch: refetchAppointments,
    isRefetching: isRefetchingAppts,
  } = useMyAppointments();

  const {
    data: bookingStatus,
    refetch: refetchBookingStatus,
  } = useMyBookingStatus();

  const {
    data: followups,
    refetch: refetchFollowups,
    isRefetching: isRefetchingFollowups,
  } = useMyFollowups();

  const {
    data: referrals,
    refetch: refetchReferrals,
    isRefetching: isRefetchingReferrals,
  } = useMyReferrals();

  const {
    data: notificationsData,
    refetch: refetchNotifications,
  } = useMyNotifications(!!user);

  // Mutations
  const cancelMutation = useCancelAppointment();
  const markReadMutation = useMarkNotificationRead();

  const isRefetching =
    isRefetchingAppts || isRefetchingFollowups || isRefetchingReferrals;

  const handleRefresh = async () => {
    await Promise.all([
      refetchAppointments(),
      refetchBookingStatus(),
      refetchFollowups(),
      refetchReferrals(),
      refetchNotifications(),
    ]);
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'PATIENT')) {
      router.replace('/(auth)');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Identify latest genuinely unread and unseen notification for the dashboard banner
  const unseenNotif = useMemo(() => {
    const unreadItems = (notificationsData?.items ?? []).filter(
      (n) => !n.isRead && n.id !== dismissedNotifId && n.id !== lastSeenId
    );
    return unreadItems.find((n) => n.type === 'APPOINTMENT_BOOKED') ?? unreadItems[0] ?? null;
  }, [notificationsData?.items, dismissedNotifId, lastSeenId]);

  const handleDismissNotif = async (id: string) => {
    setDismissedNotifId(id);
    setLastSeenId(id);
    await NotificationStorage.setLastSeenId(id);
    markReadMutation.mutate(id);
  };

  const handleOpenNotif = async (id: string) => {
    setDismissedNotifId(id);
    setLastSeenId(id);
    await NotificationStorage.setLastSeenId(id);
    markReadMutation.mutate(id);
    setNotificationModalVisible(true);
  };

  useEffect(() => {
    if (!unseenNotif) return;

    let isMounted = true;
    const checkNotificationAlert = async () => {
      try {
        const storedLastSeenId = await NotificationStorage.getLastSeenId();
        if (isMounted && storedLastSeenId !== unseenNotif.id && !unseenNotif.isRead) {
          Alert.alert(
            unseenNotif.title || 'Latest Appointment Notification',
            unseenNotif.message,
            [
              {
                text: 'View Appointments',
                onPress: async () => {
                  setActiveTab('UPCOMING');
                  handleDismissNotif(unseenNotif.id);
                },
              },
              {
                text: 'Dismiss',
                onPress: async () => {
                  handleDismissNotif(unseenNotif.id);
                },
                style: 'cancel',
              },
            ]
          );
        }
      } catch (err) {
        console.error('Failed to check notification alert:', err);
      }
    };

    checkNotificationAlert();
    return () => {
      isMounted = false;
    };
  }, [unseenNotif?.id, unseenNotif?.isRead]);

  // Bucketed Appointments (matches web logic)
  const todayDateString = new Date().toDateString();
  const bucketed = useMemo(() => {
    const list = appointments ?? [];
    return {
      UPCOMING: list.filter((a) => {
        if (a.bucket) return a.bucket === 'UPCOMING';
        const isFuture =
          new Date(a.date).setHours(0, 0, 0, 0) >
          new Date().setHours(0, 0, 0, 0);
        return (a.status === 'WAITING' || a.status === 'CHECKED_IN') && isFuture;
      }),
      TODAY: list.filter((a) => {
        if (a.bucket) return a.bucket === 'TODAY';
        return new Date(a.date).toDateString() === todayDateString;
      }),
      HISTORY: list.filter((a) => {
        if (a.bucket) return a.bucket === 'HISTORY';
        const isPast =
          new Date(a.date).setHours(0, 0, 0, 0) <
          new Date().setHours(0, 0, 0, 0);
        return (
          a.status === 'COMPLETED' ||
          a.status === 'CANCELLED' ||
          a.status === 'ABSENT' ||
          isPast
        );
      }),
    };
  }, [appointments, todayDateString]);

  const visibleAppointments = bucketed[activeTab];

  // Appointment cancellation flow
  const handleOpenCancelModal = (appt: Appointment) => {
    setCancelTarget(appt);
  };

  const handleConfirmCancel = async (reason?: string) => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync({
        appointmentId: cancelTarget.id,
        reason,
      });
      setCancelTarget(null);
      Alert.alert(
        'Appointment Cancelled',
        'Your appointment has been cancelled successfully and your queue token released.'
      );
    } catch (err: any) {
      Alert.alert(
        'Cancellation Failed',
        err?.response?.data?.message ||
          err?.message ||
          'Unable to cancel this appointment. Please try again.'
      );
    }
  };

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingCenter} edges={['left', 'right']}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading Patient Portal...</Text>
      </SafeAreaView>
    );
  }

  const apptList = appointments ?? [];
  const upcomingCount = bucketed.UPCOMING.length;
  const total = apptList.length;
  const completed = apptList.filter((a) => a.status === 'COMPLETED').length;
  const cancelled = apptList.filter((a) => a.status === 'CANCELLED').length;

  const todayStr = new Date().toDateString();
  const upcomingFollowups = (followups ?? []).filter(
    (f) =>
      f.status === 'SCHEDULED' &&
      new Date(f.followUpDate) >= new Date(todayStr)
  ).length;
  const activeTests = (referrals ?? []).filter(
    (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS'
  ).length;

  const isRestricted = !!bookingStatus?.bookingRestrictedUntil;
  const restrictedUntilLabel = bookingStatus?.bookingRestrictedUntil
    ? new Date(bookingStatus.bookingRestrictedUntil).toLocaleDateString()
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Dashboard Header */}
        <ScreenHeader
          title={`Welcome, ${user.name}`}
          subtitle="Track your active appointments, live token status, and clinic queues in real-time."
          badgeText="Dashboard"
          actionLabel="Find Doctor"
          onActionPress={() => {
            router.push('/doctors');
          }}
        />

        {/* 2x2 Responsive Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Upcoming"
              value={upcomingCount}
              iconName="clock"
              variant="orange"
            />
            <StatCard
              label="Total Appointments"
              value={total}
              iconName="calendar"
              variant="blue"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Completed"
              value={completed}
              iconName="award"
              variant="green"
            />
            <StatCard
              label="Cancelled"
              value={cancelled}
              iconName="pulse"
              variant="pink"
            />
          </View>
        </View>

        {/* Unseen Notification Banner (Only shown if genuinely unread & unseen) */}
        {unseenNotif && (
          <TouchableOpacity
            style={styles.notifBanner}
            activeOpacity={0.85}
            onPress={() => handleOpenNotif(unseenNotif.id)}
          >
            <View style={styles.notifBannerIconBox}>
              <Icon name="bell" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.notifBannerContent}>
              <View style={styles.notifBannerHeader}>
                <Text style={styles.notifBannerTitle} numberOfLines={1}>
                  {unseenNotif.title}
                </Text>
                <View style={styles.notifNewPill}>
                  <Text style={styles.notifNewPillText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.notifBannerMessage} numberOfLines={2}>
                {unseenNotif.message}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notifDismissBtn}
              onPress={() => handleDismissNotif(unseenNotif.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={14} color={Colors.light.ink400} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Patient Services & Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#059669' }]}>
              <Icon name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Patient Services</Text>
          </View>
        </View>

        <View style={styles.quickActionsContainer}>
          <QuickActionCard
            iconName="calendar-clock"
            label="My Follow-ups"
            description="View follow-up consultations scheduled by your doctor"
            count={upcomingFollowups}
            countVariant="blue"
            iconBgColor="#EFF6FF"
            iconColor="#1D4ED8"
            onPress={() => router.push('/(patient)/follow-ups')}
          />
          <QuickActionCard
            iconName="flask"
            label="My Lab Tests"
            description="Check recommended diagnostic tests & results"
            count={activeTests}
            countVariant="orange"
            iconBgColor="#FEF3C7"
            iconColor="#B45309"
            onPress={() => router.push('/(patient)/tests')}
          />
        </View>

        {/* Booking Restriction Banner */}
        {isRestricted && (
          <View style={styles.restrictionBanner}>
            <View style={styles.restrictionIconBox}>
              <Icon name="lock-closed" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.restrictionContent}>
              <Text style={styles.restrictionTitle}>Booking Restricted</Text>
              <Text style={styles.restrictionMessage}>
                New bookings are currently paused until {restrictedUntilLabel}.
              </Text>
            </View>
          </View>
        )}

        {/* Appointments Section Header with Active Slots Indicator */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBox}>
              <Icon name="calendar" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>My Appointments</Text>
          </View>

          <View style={styles.headerRightInfo}>
            {bookingStatus && (
              <View style={styles.slotsPill}>
                <Text style={styles.slotsText}>
                  {bookingStatus.activeAppointments} / {bookingStatus.maxActiveAppointments} active
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.notifIconBtn}
              onPress={() => setNotificationModalVisible(true)}
              activeOpacity={0.75}
            >
              <Icon name="bell" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Web-Aligned Tabs: UPCOMING | TODAY | HISTORY */}
        <View style={styles.tabsContainer}>
          {(['UPCOMING', 'TODAY', 'HISTORY'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            const count = bucketed[tab].length;
            const label =
              tab === 'UPCOMING'
                ? 'Upcoming'
                : tab === 'TODAY'
                ? 'Today'
                : 'History';

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isSelected && styles.tabButtonTextActive,
                  ]}
                >
                  {label}
                </Text>
                <View
                  style={[
                    styles.tabCountPill,
                    isSelected && styles.tabCountPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      isSelected && styles.tabCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.stateText}>Loading appointments...</Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={24} color={Colors.light.danger} />
            <Text style={styles.errorTitle}>Unable to load appointments</Text>
            <Text style={styles.errorSubtitle}>
              Please check your network connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleRefresh()}
              activeOpacity={0.8}
            >
              <Icon name="refresh-cw" size={14} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State: No appointments at all */}
        {!isLoading && !isError && apptList.length === 0 && (
          <EmptyState
            title="No Appointments Yet"
            description="You do not have any appointments scheduled. Book a consultation with top healthcare specialists."
            actionLabel="Find a Doctor"
            onActionPress={() => {
              router.push('/doctors');
            }}
          />
        )}

        {/* Empty State for specific Tab */}
        {!isLoading &&
          !isError &&
          apptList.length > 0 &&
          visibleAppointments.length === 0 && (
            <View style={styles.tabEmptyContainer}>
              <Icon name="calendar" size={32} color={Colors.light.ink300} />
              <Text style={styles.tabEmptyTitle}>
                {activeTab === 'UPCOMING'
                  ? 'No Upcoming Appointments'
                  : activeTab === 'TODAY'
                  ? 'No Appointments Scheduled for Today'
                  : 'No Past Appointment History'}
              </Text>
              <Text style={styles.tabEmptySubtitle}>
                {activeTab === 'UPCOMING'
                  ? 'Your future consultations will be listed here.'
                  : activeTab === 'TODAY'
                  ? 'You have no queue visits scheduled today.'
                  : 'Completed and cancelled appointments will appear here.'}
              </Text>
            </View>
          )}

        {/* Appointments List for Current Tab */}
        {!isLoading &&
          !isError &&
          visibleAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancelPress={handleOpenCancelModal}
            />
          ))}
      </ScrollView>

      {/* Cancel Appointment Confirmation Modal */}
      <CancelAppointmentModal
        visible={!!cancelTarget}
        appointment={cancelTarget}
        isLoading={cancelMutation.isPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Personal Notification Modal */}
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSoft,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.ink600,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  statsGrid: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  notifBannerIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBannerContent: {
    flex: 1,
  },
  notifBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  notifBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    flex: 1,
  },
  notifNewPill: {
    backgroundColor: '#DC2626',
    borderRadius: Radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  notifNewPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  notifBannerMessage: {
    fontSize: 11,
    color: '#2563EB',
    lineHeight: 15,
  },
  notifDismissBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  restrictionIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictionContent: {
    flex: 1,
  },
  restrictionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  restrictionMessage: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionIconBox: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: '#252A67',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#252A67',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerRightInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  slotsPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  slotsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  notifIconBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.four,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: Radius.sm,
    gap: 5,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  tabButtonTextActive: {
    color: '#252A67',
    fontWeight: '700',
  },
  tabCountPill: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  tabCountPillActive: {
    backgroundColor: '#EFF6FF',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  tabCountTextActive: {
    color: '#1D4ED8',
  },
  stateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginBottom: Spacing.three,
  },
  stateText: {
    fontSize: 13,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    padding: Spacing.five,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.danger,
    marginTop: 4,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.danger,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 6,
    marginBottom: Spacing.three,
  },
  tabEmptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
    marginTop: 4,
    textAlign: 'center',
  },
  tabEmptySubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginBottom: Spacing.four,
  },
});
