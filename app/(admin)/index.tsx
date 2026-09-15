import React from 'react';
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
import { useAdminStats } from '../../hooks/useAdmin';
import { ScreenHeader, StatCard, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';

const QUICK_ACTIONS = [
  {
    label: 'Manage Users',
    icon: 'users' as const,
    route: '/(admin)/users',
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8',
    countKey: 'totalUsers',
  },
  {
    label: 'Review Clinics',
    icon: 'building' as const,
    route: '/(admin)/clinics',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
    countKey: 'totalClinics',
  },
  {
    label: 'Verify Doctors',
    icon: 'stethoscope' as const,
    route: '/(admin)/doctors',
    iconBg: '#F0FDF4',
    iconColor: '#15803D',
    countKey: 'totalDoctors',
  },
  {
    label: 'Diagnostic Centers',
    icon: 'activity' as const,
    route: '/(admin)/diagnostics',
    iconBg: '#FDF4FF',
    iconColor: '#7C3AED',
    countKey: 'totalDiagnosticCenters',
  },
] as const;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: stats, isLoading, isError, refetch, isRefetching } = useAdminStats();

  const totalUsers = stats?.totalUsers ?? 0;
  const totalDoctors = stats?.totalDoctors ?? 0;
  const totalClinics = stats?.totalClinics ?? 0;
  const pendingClinics = stats?.pendingClinics ?? 0;
  const unverifiedDoctors = stats?.unverifiedDoctors ?? 0;
  const totalDiagnosticCenters = stats?.totalDiagnosticCenters ?? 0;

  const countMap: Record<string, number> = {
    totalUsers,
    totalClinics,
    totalDoctors,
    totalDiagnosticCenters,
  };

  const hasPendingActions = pendingClinics > 0 || unverifiedDoctors > 0;

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
        {/* Header */}
        <ScreenHeader
          title="Admin Dashboard"
          subtitle="Platform overview and management controls"
          badgeText="Admin Portal"
        />

        {/* Loading State */}
        {isLoading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.stateText}>Loading stats...</Text>
          </View>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <View style={styles.errorContainer}>
            <Icon name="alert-triangle" size={24} color={Colors.light.danger} />
            <Text style={styles.errorTitle}>Unable to load stats</Text>
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

        {/* Stats Grid */}
        {!isLoading && (
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                label="Total Users"
                value={totalUsers}
                iconName="users"
                variant="blue"
              />
              <StatCard
                label="Total Doctors"
                value={totalDoctors}
                iconName="stethoscope"
                variant="green"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Total Clinics"
                value={totalClinics}
                iconName="building"
                variant="orange"
              />
              <StatCard
                label="Pending Approvals"
                value={pendingClinics + unverifiedDoctors}
                iconName="clock"
                variant="pink"
              />
            </View>
          </View>
        )}

        {/* Warning Alert */}
        {hasPendingActions && (
          <View style={styles.warningCard}>
            <View style={styles.warningIconRow}>
              <View style={styles.warningIconBox}>
                <Icon name="alert-triangle" size={18} color="#B45309" />
              </View>
              <Text style={styles.warningTitle}>Action Required</Text>
            </View>
            <Text style={styles.warningText}>
              {pendingClinics > 0
                ? `${pendingClinics} clinic${pendingClinics > 1 ? 's' : ''} pending approval`
                : ''}
              {pendingClinics > 0 && unverifiedDoctors > 0 ? ', ' : ''}
              {unverifiedDoctors > 0
                ? `${unverifiedDoctors} doctor${unverifiedDoctors > 1 ? 's' : ''} need verification`
                : ''}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBox}>
              <Icon name="shield" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={action.route}
              style={[
                styles.actionRow,
                index < QUICK_ACTIONS.length - 1 && styles.actionRowBorder,
              ]}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconBox, { backgroundColor: action.iconBg }]}>
                <Icon name={action.icon} size={20} color={action.iconColor} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <View style={styles.actionRight}>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {countMap[action.countKey] ?? 0}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={Colors.light.ink400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 64,
    gap: 16,
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
    gap: Spacing.two,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.danger,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
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
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  warningIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 4,
  },
  warningIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: '#92400E',
  },
  warningText: {
    fontSize: Typography.fontSizes.xs,
    color: '#B45309',
    marginLeft: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  actionsCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  actionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.light.ink900,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
