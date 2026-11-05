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
import { useSuperAdminStats } from '../../hooks/useSuperAdmin';
import { Icon, type IconName } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSuperAdminStats();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.replace('/(auth)');
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, router]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Authenticating Super Admin...</Text>
      </SafeAreaView>
    );
  }

  const totalUsers = stats?.totalUsers ?? 0;
  const totalPatients = stats?.totalPatients ?? 0;
  const totalDoctors = stats?.totalDoctors ?? 0;
  const verifiedDoctors = stats?.verifiedDoctors ?? 0;
  const unverifiedDoctors = stats?.unverifiedDoctors ?? 0;
  const totalClinics = stats?.totalClinics ?? 0;
  const approvedClinics = stats?.approvedClinics ?? 0;
  const pendingClinics = stats?.pendingClinics ?? 0;
  const totalDiagnosticCenters = stats?.totalDiagnosticCenters ?? 0;
  const totalBookings = stats?.totalBookings ?? stats?.totalAppointments ?? 0;

  const hasPending = pendingClinics > 0 || unverifiedDoctors > 0;

  const clinicApprovalRate = totalClinics > 0 ? Math.round((approvedClinics / totalClinics) * 100) : 100;
  const doctorVerificationRate = totalDoctors > 0 ? Math.round((verifiedDoctors / totalDoctors) * 100) : 100;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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
            onRefresh={() => { refetch(); }}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
      >
        {/* Header - Matching Web Super Admin Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerBadgeRow}>
              <View style={styles.superBadge}>
                <Icon name="shield-check" size={12} color="#92400E" />
                <Text style={styles.superBadgeText}>Super Admin</Text>
              </View>
              <View style={styles.dateBadge}>
                <Icon name="calendar" size={12} color={Colors.light.ink600} />
                <Text style={styles.dateBadgeText}>{todayStr}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => { refetch(); }}
              disabled={isRefetching}
              activeOpacity={0.7}
            >
              <Icon name="refresh-cw" size={14} color="#D97706" />
              <Text style={styles.refreshText}>{isRefetching ? 'Syncing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>System Command Center</Text>
          <Text style={styles.headerSubtitle}>
            Full platform governance, security compliance & global analytics
          </Text>
        </View>

        {/* Loading Indicator */}
        {isLoading && !stats && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#D97706" />
            <Text style={styles.loadingText}>Fetching system metrics...</Text>
          </View>
        )}

        {/* Pending Action or Operational Health Banner */}
        {hasPending ? (
          <View style={styles.alertCardWarning}>
            <View style={styles.alertIconCircleWarning}>
              <Icon name="alert-triangle" size={18} color="#D97706" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitleWarning}>Operational Attention Required</Text>
              <Text style={styles.alertDescWarning}>
                {pendingClinics > 0 && `${pendingClinics} clinic${pendingClinics > 1 ? 's' : ''} awaiting approval. `}
                {unverifiedDoctors > 0 && `${unverifiedDoctors} doctor${unverifiedDoctors > 1 ? 's' : ''} pending credential verification.`}
              </Text>
              <View style={styles.alertActionRow}>
                {pendingClinics > 0 && (
                  <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() => router.push('/(superAdmin)/clinics')}
                  >
                    <Text style={styles.alertBtnText}>Review Clinics</Text>
                    <Icon name="chevron-right" size={12} color="#92400E" />
                  </TouchableOpacity>
                )}
                {unverifiedDoctors > 0 && (
                  <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() => router.push('/(superAdmin)/doctors')}
                  >
                    <Text style={styles.alertBtnText}>Verify Doctors</Text>
                    <Icon name="chevron-right" size={12} color="#92400E" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.alertCardSuccess}>
            <View style={styles.alertIconCircleSuccess}>
              <Icon name="shield-check" size={18} color="#059669" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitleSuccess}>All Systems Operational</Text>
              <Text style={styles.alertDescSuccess}>
                All clinics, doctors, and diagnostic centers are fully verified and operating normally.
              </Text>
            </View>
          </View>
        )}

        {/* 8 Core KPI Stat Cards Grid - Matching Web */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Global Key Metrics</Text>
          <Text style={styles.sectionSubtitle}>Platform-wide activity and health</Text>
        </View>

        <View style={styles.kpiGrid}>
          {/* 1. Total Users */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(superAdmin)/users')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="users" size={18} color="#2563EB" />
              </View>
              <Icon name="chevron-right" size={14} color={Colors.light.ink400} />
            </View>
            <Text style={styles.kpiValue}>{totalUsers}</Text>
            <Text style={styles.kpiTitle}>Total Users</Text>
            <Text style={styles.kpiSubtitle}>Across all roles</Text>
          </TouchableOpacity>

          {/* 2. Total Patients */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(superAdmin)/users')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Icon name="user-check" size={18} color="#4F46E5" />
              </View>
              <Icon name="chevron-right" size={14} color={Colors.light.ink400} />
            </View>
            <Text style={styles.kpiValue}>{totalPatients}</Text>
            <Text style={styles.kpiTitle}>Total Patients</Text>
            <Text style={styles.kpiSubtitle}>Active service users</Text>
          </TouchableOpacity>

          {/* 3. Total Doctors */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(superAdmin)/doctors')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#ECFEFF' }]}>
                <Icon name="stethoscope" size={18} color="#0891B2" />
              </View>
              <Icon name="chevron-right" size={14} color={Colors.light.ink400} />
            </View>
            <Text style={styles.kpiValue}>{totalDoctors}</Text>
            <Text style={styles.kpiTitle}>Total Doctors</Text>
            <Text style={styles.kpiSubtitle}>All medical specialties</Text>
          </TouchableOpacity>

          {/* 4. Verified Doctors */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(superAdmin)/doctors')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="check-circle" size={18} color="#059669" />
              </View>
              <View style={styles.miniBadgeHealthy}>
                <Text style={styles.miniBadgeTextHealthy}>Verified</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{verifiedDoctors}</Text>
            <Text style={styles.kpiTitle}>Verified Doctors</Text>
            <Text style={styles.kpiSubtitle}>Licensed to practice</Text>
          </TouchableOpacity>

          {/* 5. Unverified Doctors */}
          <TouchableOpacity
            style={[styles.kpiCard, unverifiedDoctors > 0 && styles.kpiCardAlert]}
            onPress={() => router.push('/(superAdmin)/doctors')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: unverifiedDoctors > 0 ? '#FEF3C7' : '#ECFDF5' }]}>
                <Icon name={unverifiedDoctors > 0 ? 'alert-triangle' : 'shield-check'} size={18} color={unverifiedDoctors > 0 ? '#D97706' : '#059669'} />
              </View>
              {unverifiedDoctors > 0 && (
                <View style={styles.miniBadgeWarning}>
                  <Text style={styles.miniBadgeTextWarning}>Pending</Text>
                </View>
              )}
            </View>
            <Text style={[styles.kpiValue, unverifiedDoctors > 0 ? { color: '#D97706' } : {}]}>
              {unverifiedDoctors}
            </Text>
            <Text style={styles.kpiTitle}>Unverified Doctors</Text>
            <Text style={styles.kpiSubtitle}>{unverifiedDoctors > 0 ? 'Review credentials' : 'All clear'}</Text>
          </TouchableOpacity>

          {/* 6. Total Clinics */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(superAdmin)/clinics')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#FAF5FF' }]}>
                <Icon name="building" size={18} color="#7C3AED" />
              </View>
              <Icon name="chevron-right" size={14} color={Colors.light.ink400} />
            </View>
            <Text style={styles.kpiValue}>{totalClinics}</Text>
            <Text style={styles.kpiTitle}>Total Clinics</Text>
            <Text style={styles.kpiSubtitle}>Chambers & facilities</Text>
          </TouchableOpacity>

          {/* 7. Approved Clinics */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(superAdmin)/clinics')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="shield-check" size={18} color="#059669" />
              </View>
              <View style={styles.miniBadgeHealthy}>
                <Text style={styles.miniBadgeTextHealthy}>Approved</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{approvedClinics}</Text>
            <Text style={styles.kpiTitle}>Approved Clinics</Text>
            <Text style={styles.kpiSubtitle}>Active for booking</Text>
          </TouchableOpacity>

          {/* 8. Pending Clinics */}
          <TouchableOpacity
            style={[styles.kpiCard, pendingClinics > 0 && styles.kpiCardAlert]}
            onPress={() => router.push('/(superAdmin)/clinics')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconBox, { backgroundColor: pendingClinics > 0 ? '#FEF3C7' : '#ECFDF5' }]}>
                <Icon name={pendingClinics > 0 ? 'clock' : 'check-circle'} size={18} color={pendingClinics > 0 ? '#D97706' : '#059669'} />
              </View>
              {pendingClinics > 0 && (
                <View style={styles.miniBadgeWarning}>
                  <Text style={styles.miniBadgeTextWarning}>Review</Text>
                </View>
              )}
            </View>
            <Text style={[styles.kpiValue, pendingClinics > 0 ? { color: '#D97706' } : {}]}>
              {pendingClinics}
            </Text>
            <Text style={styles.kpiTitle}>Pending Clinics</Text>
            <Text style={styles.kpiSubtitle}>{pendingClinics > 0 ? 'Requires sign-off' : 'All clear'}</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Progress Bars - Matching Web */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Platform Health & Verification Rates</Text>
          <Text style={styles.breakdownSubtitle}>Real-time compliance status across health centers</Text>

          {/* Clinics Progress */}
          <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Clinic Approvals</Text>
              <Text style={styles.progressValue}>{approvedClinics} / {totalClinics} ({clinicApprovalRate}%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${clinicApprovalRate}%`, backgroundColor: '#059669' }]} />
            </View>
          </View>

          {/* Doctors Progress */}
          <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Doctor Verification</Text>
              <Text style={styles.progressValue}>{verifiedDoctors} / {totalDoctors} ({doctorVerificationRate}%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${doctorVerificationRate}%`, backgroundColor: '#D97706' }]} />
            </View>
          </View>
        </View>

        {/* Super Admin Control Modules */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Super Admin Controls</Text>
          <Text style={styles.sectionSubtitle}>Governance, broadcasts & configurations</Text>
        </View>

        <View style={styles.quickActionsList}>
          {/* Clinics */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(superAdmin)/clinics')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="building" size={20} color="#D97706" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Clinics & Chamber Approvals</Text>
              <Text style={styles.quickTileDesc}>Approve, feature on home, revoke authorizations</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>

          {/* Doctors */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(superAdmin)/doctors')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Icon name="stethoscope" size={20} color="#059669" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Doctors Directory & Badges</Text>
              <Text style={styles.quickTileDesc}>Verify doctor licenses, mark featured specialists</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>

          {/* Users */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(superAdmin)/users')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="users" size={20} color="#1D4ED8" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Users & Access Control</Text>
              <Text style={styles.quickTileDesc}>Create Admin accounts, toggle user active/ban state</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>

          {/* Announcements */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(superAdmin)/announcements')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Icon name="megaphone" size={20} color="#B45309" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Broadcast Announcements</Text>
              <Text style={styles.quickTileDesc}>Send instant platform alerts, emergency notices & banners</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>

          {/* Platform Settings */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(superAdmin)/settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Icon name="settings" size={20} color="#475569" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Platform Settings</Text>
              <Text style={styles.quickTileDesc}>Booking windows, maintenance mode & gateway toggles</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  superBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  superBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.ink600,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  headerTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extrabold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: Typography.fontSizes.xs,
    color: '#64748B',
    marginTop: 2,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  alertCardWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertIconCircleWarning: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertCardSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  alertIconCircleSuccess: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleWarning: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  alertDescWarning: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 17,
  },
  alertTitleSuccess: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  alertDescSuccess: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 17,
  },
  alertActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  alertBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  sectionHeaderRow: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  kpiCardAlert: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF5',
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  kpiSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  miniBadgeHealthy: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  miniBadgeTextHealthy: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  miniBadgeWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  miniBadgeTextWarning: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: -8,
  },
  progressItem: {
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  quickActionsList: {
    gap: 8,
  },
  quickActionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTileInfo: {
    flex: 1,
  },
  quickTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickTileDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});
