import React from 'react';
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
import { useAdminStats } from '../../hooks/useAdmin';
import { Icon, type IconName } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: stats, isLoading, isError, refetch, isRefetching } = useAdminStats();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const totalUsers = stats?.totalUsers ?? 0;
  const totalPatients = stats?.totalPatients ?? 0;
  const totalDoctors = stats?.totalDoctors ?? 0;
  const verifiedDoctors = stats?.verifiedDoctors ?? 0;
  const unverifiedDoctors = stats?.unverifiedDoctors ?? 0;
  const totalClinics = stats?.totalClinics ?? 0;
  const approvedClinics = stats?.approvedClinics ?? 0;
  const pendingClinics = stats?.pendingClinics ?? 0;
  const totalDiagnosticCenters = stats?.totalDiagnosticCenters ?? 0;

  const hasPending = pendingClinics > 0 || unverifiedDoctors > 0;

  // Progress percentages
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
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Header - Matching Web AdminDashboardHeader */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerBadgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Admin Portal</Text>
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
              <Icon
                name="refresh-cw"
                size={14}
                color={Colors.light.primary}
              />
              <Text style={styles.refreshText}>{isRefetching ? 'Syncing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitle}>Platform Overview</Text>
          <Text style={styles.headerSubtitle}>
            Real-time metrics, provider credentials & chamber approvals
          </Text>
        </View>

        {/* Loading Indicator */}
        {isLoading && !stats && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Fetching real-time metrics...</Text>
          </View>
        )}

        {/* Pending Action or Operational Health Banner - Matching Web AdminPendingAlert */}
        {hasPending ? (
          <View style={styles.alertCardWarning}>
            <View style={styles.alertIconCircleWarning}>
              <Icon name="alert-triangle" size={18} color="#D97706" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitleWarning}>Action Required</Text>
              <Text style={styles.alertDescWarning}>
                {pendingClinics > 0 && `${pendingClinics} clinic${pendingClinics > 1 ? 's' : ''} awaiting approval. `}
                {unverifiedDoctors > 0 && `${unverifiedDoctors} doctor${unverifiedDoctors > 1 ? 's' : ''} pending verification.`}
              </Text>
              <View style={styles.alertActionRow}>
                {pendingClinics > 0 && (
                  <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() => router.push('/(admin)/clinics')}
                  >
                    <Text style={styles.alertBtnText}>Review Clinics</Text>
                    <Icon name="chevron-right" size={12} color="#92400E" />
                  </TouchableOpacity>
                )}
                {unverifiedDoctors > 0 && (
                  <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() => router.push('/(admin)/doctors')}
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
              <Icon name="check-circle" size={18} color="#059669" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitleSuccess}>Operational Health Optimal</Text>
              <Text style={styles.alertDescSuccess}>
                All registered healthcare providers and chamber affiliations are verified and active.
              </Text>
            </View>
          </View>
        )}

        {/* 8 Core Platform KPI Stat Cards - Matching Web AdminStatCard Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <Text style={styles.sectionSubtitle}>8 Core Platform Metrics</Text>
        </View>

        <View style={styles.kpiGrid}>
          {/* 1. Total Users */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(admin)/users')}
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
            <Text style={styles.kpiSubtitle}>Patients & staff registered</Text>
          </TouchableOpacity>

          {/* 2. Total Patients */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(admin)/users')}
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
            <Text style={styles.kpiSubtitle}>Registered service seekers</Text>
          </TouchableOpacity>

          {/* 3. Total Doctors */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(admin)/doctors')}
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
            <Text style={styles.kpiSubtitle}>Practitioners onboarded</Text>
          </TouchableOpacity>

          {/* 4. Verified Doctors */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(admin)/doctors')}
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
            <Text style={styles.kpiSubtitle}>Approved to practice</Text>
          </TouchableOpacity>

          {/* 5. Unverified Doctors */}
          <TouchableOpacity
            style={[styles.kpiCard, unverifiedDoctors > 0 && styles.kpiCardAlert]}
            onPress={() => router.push('/(admin)/doctors')}
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
            <Text style={styles.kpiSubtitle}>{unverifiedDoctors > 0 ? 'Needs document check' : 'All verified'}</Text>
          </TouchableOpacity>

          {/* 6. Total Clinics */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(admin)/clinics')}
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
            <Text style={styles.kpiSubtitle}>Chambers & polyclinics</Text>
          </TouchableOpacity>

          {/* 7. Approved Clinics */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => router.push('/(admin)/clinics')}
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
            <Text style={styles.kpiSubtitle}>Open for bookings</Text>
          </TouchableOpacity>

          {/* 8. Pending Clinics */}
          <TouchableOpacity
            style={[styles.kpiCard, pendingClinics > 0 && styles.kpiCardAlert]}
            onPress={() => router.push('/(admin)/clinics')}
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
            <Text style={styles.kpiSubtitle}>{pendingClinics > 0 ? 'Awaiting authorization' : 'All clear'}</Text>
          </TouchableOpacity>
        </View>

        {/* Resource Breakdown Overview Cards with Progress Bars - Matching Web AdminResourceBreakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Credentialing & Verification Health</Text>
          <Text style={styles.breakdownSubtitle}>Platform-wide provider compliance progress</Text>

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
              <Text style={styles.progressLabel}>Doctor Credentials Verified</Text>
              <Text style={styles.progressValue}>{verifiedDoctors} / {totalDoctors} ({doctorVerificationRate}%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${doctorVerificationRate}%`, backgroundColor: '#0284C7' }]} />
            </View>
          </View>

          {/* Diagnostic Centers summary */}
          <View style={styles.diagnosticSummaryRow}>
            <View style={styles.diagSummaryLeft}>
              <Icon name="activity" size={16} color="#7C3AED" />
              <Text style={styles.diagSummaryText}>Partner Diagnostic Labs</Text>
            </View>
            <Text style={styles.diagSummaryCount}>{totalDiagnosticCenters} active</Text>
          </View>
        </View>

        {/* Direct Quick Action Tiles - Matching Web AdminQuickActions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Management Modules</Text>
          <Text style={styles.sectionSubtitle}>Quick navigation to platform registries</Text>
        </View>

        <View style={styles.quickActionsList}>
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(admin)/clinics')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#FFF7ED' }]}>
              <Icon name="building" size={20} color="#EA580C" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Clinics & Chambers Directory</Text>
              <Text style={styles.quickTileDesc}>Review pending applications, revoke, or add new clinics</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(admin)/doctors')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="stethoscope" size={20} color="#15803D" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Doctors Directory & Verification</Text>
              <Text style={styles.quickTileDesc}>Verify credentials, feature top specialists, add new doctors</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(admin)/users')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="users" size={20} color="#1D4ED8" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>User Accounts & Roles</Text>
              <Text style={styles.quickTileDesc}>Inspect patient/doctor profiles and manage account active status</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => router.push('/(admin)/diagnostics')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: '#FDF4FF' }]}>
              <Icon name="activity" size={20} color="#7C3AED" />
            </View>
            <View style={styles.quickTileInfo}>
              <Text style={styles.quickTileTitle}>Diagnostic Labs & Test Centers</Text>
              <Text style={styles.quickTileDesc}>Approve partner pathology labs and diagnostic facilities</Text>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Card */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="log-out" size={16} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out of Admin Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
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
    color: Colors.light.ink600,
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
  diagnosticSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  diagSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diagSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  diagSummaryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
