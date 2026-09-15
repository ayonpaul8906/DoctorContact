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
  useDoctorDashboard,
  useDoctorUnreadNotificationCount,
} from '../../hooks/useDoctor';
import {
  GradientCard,
  StatCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDoctorDashboard();

  const { data: unreadCount = 0 } = useDoctorUnreadNotificationCount();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'DOCTOR')) {
      router.replace('/(auth)');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.centerLoading}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading Doctor Portal...</Text>
      </SafeAreaView>
    );
  }

  const waitingToday = stats?.waitingToday ?? 0;
  const completedToday = stats?.completedToday ?? 0;
  const totalToday = stats?.totalAppointmentsToday ?? 0;
  const activeQueueStatus = stats?.activeQueueStatus || 'Active';
  const pendingRequests = stats?.pendingRequestsCount ?? 0;
  const associatedClinics = stats?.associatedClinicsCount ?? 0;
  const avgConsultation =
    stats?.avgConsultationMinutes != null
      ? `${stats.avgConsultationMinutes}m`
      : '15m';

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* 1. Header with Gradient Accent */}
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <View style={styles.headerTopRow}>
              <View style={styles.greetingGroup}>
                <View style={styles.badgeRow}>
                  <View style={styles.docIconCircle}>
                    <Icon name="stethoscope" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.badgeText}>DOCTOR PORTAL</Text>
                </View>

                <Text style={styles.greetingTitle}>
                  Welcome, Dr. {user.name}
                </Text>
                <Text style={styles.greetingDate}>{todayFormatted}</Text>
              </View>

              <View style={styles.headerActionsGroup}>
                <TouchableOpacity
                  style={styles.notifBtn}
                  onPress={() => router.push('/(doctor)/notifications')}
                  activeOpacity={0.8}
                >
                  <Icon name="bell" size={18} color={Colors.light.ink800} />
                  {unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.verifiedBadge}>
                  <Icon name="check-circle" size={12} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified MD</Text>
                </View>
              </View>
            </View>
          </View>
        </GradientCard>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.stateText}>Synchronizing practice analytics...</Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={24} color={Colors.light.danger} />
            <Text style={styles.errorTitle}>Unable to load dashboard data</Text>
            <Text style={styles.errorSubtitle}>
              {error instanceof Error ? error.message : 'Please check your connection and retry.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
              activeOpacity={0.8}
            >
              <Icon name="refresh-cw" size={14} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && (
          <>
            {/* 2. Primary 2x2 KPI Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  label="Today's Total"
                  value={totalToday}
                  iconName="calendar"
                  variant="blue"
                />
                <StatCard
                  label="Completed"
                  value={completedToday}
                  iconName="check-circle"
                  variant="green"
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  label="Waiting in Queue"
                  value={waitingToday}
                  iconName="clock"
                  variant="orange"
                />
                <StatCard
                  label="Pending Requests"
                  value={pendingRequests}
                  iconName="inbox"
                  variant="pink"
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  label="Associated Clinics"
                  value={associatedClinics}
                  iconName="building"
                  variant="purple"
                />
                <StatCard
                  label="Avg Consultation"
                  value={avgConsultation}
                  iconName="stethoscope"
                  variant="blue"
                />
              </View>
            </View>

            {/* 3. Live Queue Overview Hero Banner */}
            <GradientCard variant="purple" style={styles.queueOverviewCard}>
              <View style={styles.queueOverviewContent}>
                <View style={styles.queueOverviewHeader}>
                  <View style={styles.queueTitleGroup}>
                    <View style={styles.queueIconBox}>
                      <Icon name="list-ordered" size={16} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.queueCardTitle}>Live Queue System</Text>
                      <Text style={styles.queueCardSubtitle}>Real-time patient consultation queue</Text>
                    </View>
                  </View>

                  <View style={styles.queueStatusBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.queueStatusText}>{activeQueueStatus}</Text>
                  </View>
                </View>

                {/* Queue Summary Grid */}
                <View style={styles.queuePillsRow}>
                  <View style={styles.queuePill}>
                    <Text style={styles.queuePillLabel}>Waiting</Text>
                    <Text style={styles.queuePillValue}>{waitingToday}</Text>
                  </View>
                  <View style={styles.queuePillDivider} />
                  <View style={styles.queuePill}>
                    <Text style={styles.queuePillLabel}>Completed</Text>
                    <Text style={styles.queuePillValue}>{completedToday}</Text>
                  </View>
                  <View style={styles.queuePillDivider} />
                  <View style={styles.queuePill}>
                    <Text style={styles.queuePillLabel}>Total Today</Text>
                    <Text style={styles.queuePillValue}>{totalToday}</Text>
                  </View>
                </View>

                {/* CTA Action Button */}
                <TouchableOpacity
                  style={styles.openQueueBtn}
                  onPress={() => router.push('/(doctor)/queue')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.openQueueBtnText}>Manage Live Queue</Text>
                  <Icon name="chevron-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </GradientCard>

            {/* 4. Complete Practice Operational Shortcuts */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionHeading}>Practice Operations</Text>

              <View style={styles.shortcutsGrid}>
                <TouchableOpacity
                  style={styles.shortcutCard}
                  onPress={() => router.push('/(doctor)/schedule')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Icon name="calendar-days" size={18} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.shortcutTitle}>Schedule</Text>
                  <Text style={styles.shortcutSub}>Timing & Leaves</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shortcutCard}
                  onPress={() => router.push('/(doctor)/prescriptions')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: '#FAF5FF' }]}>
                    <Icon name="file-text" size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.shortcutTitle}>Prescriptions</Text>
                  <Text style={styles.shortcutSub}>Digital Rx</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shortcutCard}
                  onPress={() => router.push('/(doctor)/requests')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Icon name="inbox" size={18} color="#D97706" />
                  </View>
                  <Text style={styles.shortcutTitle}>Requests</Text>
                  <Text style={styles.shortcutSub}>Clinic Connection</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.shortcutsGrid}>
                <TouchableOpacity
                  style={styles.shortcutCard}
                  onPress={() => router.push('/(doctor)/clinics')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: '#F0FDF4' }]}>
                    <Icon name="building" size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.shortcutTitle}>Clinics</Text>
                  <Text style={styles.shortcutSub}>Practice Centers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shortcutCard}
                  onPress={() => router.push('/(doctor)/referrals')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: '#FFF1F2' }]}>
                    <Icon name="activity" size={18} color="#E11D48" />
                  </View>
                  <Text style={styles.shortcutTitle}>Referrals</Text>
                  <Text style={styles.shortcutSub}>Diagnostic Tests</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shortcutCard}
                  onPress={() => router.push('/(doctor)/earnings')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shortcutIconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <Icon name="trending-up" size={18} color="#059669" />
                  </View>
                  <Text style={styles.shortcutTitle}>Earnings</Text>
                  <Text style={styles.shortcutSub}>Financials</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  centerLoading: {
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
    gap: Spacing.four,
  },
  headerCard: {
    marginBottom: 0,
  },
  headerCardContent: {
    padding: Spacing.four,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greetingGroup: {
    gap: 3,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  docIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#1E40AF',
  },
  greetingTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  greetingDate: {
    fontSize: 12,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  headerActionsGroup: {
    alignItems: 'flex-end',
    gap: 6,
  },
  notifBtn: {
    position: 'relative',
    padding: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.light.danger,
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
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
  statsGrid: {
    gap: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  queueOverviewCard: {
    marginBottom: 0,
  },
  queueOverviewContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  queueOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  queueTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  queueIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueCardTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  queueCardSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  queueStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  queueStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  queuePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  queuePill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  queuePillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  queuePillValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  queuePillDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.light.surface200,
  },
  openQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  openQueueBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsSection: {
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 3,
    ...Shadows.sm,
  },
  shortcutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
    textAlign: 'center',
  },
  shortcutSub: {
    fontSize: 10,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
});
