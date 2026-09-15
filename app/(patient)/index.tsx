import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import {
  useMyAppointments,
  useMyFollowups,
  useMyReferrals,
} from '../../hooks/usePatient';
import {
  ScreenHeader,
  StatCard,
  AppointmentCard,
  EmptyState,
  QuickActionCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';

export default function PatientOverviewScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const {
    data: appointments,
    isLoading,
    isError,
    refetch: refetchAppointments,
    isRefetching: isRefetchingAppts,
  } = useMyAppointments();
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

  const isRefetching =
    isRefetchingAppts || isRefetchingFollowups || isRefetchingReferrals;

  const handleRefresh = async () => {
    await Promise.all([
      refetchAppointments(),
      refetchFollowups(),
      refetchReferrals(),
    ]);
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'PATIENT')) {
      router.replace('/(auth)');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingCenter} edges={['left', 'right']}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading Patient Portal...</Text>
      </SafeAreaView>
    );
  }

  const apptList = appointments ?? [];
  const upcoming = apptList.filter(
    (a) => a.status === 'WAITING' || a.status === 'CHECKED_IN'
  );
  const total = apptList.length;
  const completed = apptList.filter((a) => a.status === 'COMPLETED').length;
  const cancelled = apptList.filter((a) => a.status === 'CANCELLED').length;

  const todayStr = new Date().toDateString();
  const upcomingFollowups = (followups ?? []).filter(
    (f) => f.status === 'SCHEDULED' && new Date(f.followUpDate) >= new Date(todayStr)
  ).length;
  const activeTests = (referrals ?? []).filter(
    (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS'
  ).length;

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
            router.push('/(patient)/doctors');
          }}
        />

        {/* 2x2 Responsive Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Upcoming"
              value={upcoming.length}
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

        {/* Appointments Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBox}>
              <Icon name="calendar" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>My Appointments</Text>
          </View>
          {apptList.length > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{apptList.length}</Text>
            </View>
          ) : null}
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

        {/* Empty State */}
        {!isLoading && !isError && apptList.length === 0 && (
          <EmptyState
            title="No Appointments Yet"
            description="You do not have any upcoming appointments. Book your first appointment to track your live queue."
            actionLabel="Find a Doctor"
            onActionPress={() => {
              router.push('/(patient)/doctors');
            }}
          />
        )}

        {/* Appointments List */}
        {!isLoading &&
          !isError &&
          apptList.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
      </ScrollView>
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
    marginBottom: Spacing.five,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
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
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
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
  countBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  quickActionsContainer: {
    marginBottom: Spacing.four,
  },
});
