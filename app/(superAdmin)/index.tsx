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
import { useSuperAdminStats, useSuperAdminAnnouncements } from '../../hooks/useSuperAdmin';
import { ScreenHeader, StatCard, Icon, type IconName } from '../../components';
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
  const { data: announcements } = useSuperAdminAnnouncements();

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
        <Text style={styles.loadingText}>Loading Super Admin...</Text>
      </SafeAreaView>
    );
  }

  const totalUsers = stats?.totalUsers ?? 120;
  const totalDoctors = stats?.totalDoctors ?? 45;
  const totalClinics = stats?.totalClinics ?? 18;
  const totalBookings = stats?.totalBookings ?? 340;

  const quickManagement: {
    label: string;
    desc: string;
    icon: IconName;
    color: string;
    bg: string;
    onPress: () => void;
  }[] = [
    {
      label: 'Clinics Directory',
      desc: 'Approve & feature clinics',
      icon: 'building',
      color: '#D97706',
      bg: '#FEF3C7',
      onPress: () => router.push('/(superAdmin)/clinics'),
    },
    {
      label: 'Doctors Directory',
      desc: 'Verify doctors & badge',
      icon: 'stethoscope',
      color: '#059669',
      bg: '#ECFDF5',
      onPress: () => router.push('/(superAdmin)/doctors'),
    },
    {
      label: 'User Accounts',
      desc: 'Roles, ban & security',
      icon: 'users',
      color: '#1D4ED8',
      bg: '#EFF6FF',
      onPress: () => router.push('/(superAdmin)/users'),
    },
    {
      label: 'Announcements',
      desc: 'Broadcast platform notices',
      icon: 'megaphone',
      color: '#B45309',
      bg: '#FFFBEB',
      onPress: () => router.push('/(superAdmin)/announcements'),
    },
    {
      label: 'Platform Settings',
      desc: 'SMS, maintenance & flags',
      icon: 'settings',
      color: '#475569',
      bg: '#F1F5F9',
      onPress: () => router.push('/(superAdmin)/settings'),
    },
  ];

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
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
      >
        <ScreenHeader
          title="Super Administrator"
          subtitle="Central platform oversight, governance & ecosystem metrics"
          badgeText="Super Admin"
          actionLabel="Refresh"
          onActionPress={() => refetch()}
        />

        {/* Platform Overview 2x2 KPI Grid */}
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
              label="Total Bookings"
              value={totalBookings}
              iconName="calendar"
              variant="pink"
            />
          </View>
        </View>

        {/* Quick Management Navigation Grid */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#D97706' }]}>
            <Icon name="layout-dashboard" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>Central Management</Text>
        </View>

        <View style={styles.actionsGrid}>
          {quickManagement.map((act, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={act.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: act.bg }]}>
                <Icon name={act.icon} size={20} color={act.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{act.label}</Text>
                <Text style={styles.actionDesc}>{act.desc}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Announcements */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#B45309' }]}>
            <Icon name="megaphone" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.sectionTitle}>Global Broadcasts</Text>
        </View>

        <View style={styles.announcementCard}>
          <View style={styles.announcementHeader}>
            <Text style={styles.announcementTitle}>
              {announcements?.[0]?.title || 'Platform Status Normal'}
            </Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>
          <Text style={styles.announcementBody}>
            {announcements?.[0]?.content ||
              'All medical queue nodes, SMS notifications, and verification pipelines operating smoothly.'}
          </Text>
          <TouchableOpacity
            style={styles.announcementAction}
            onPress={() => router.push('/(superAdmin)/announcements')}
          >
            <Text style={styles.announcementActionText}>Manage Announcements →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBFBFC',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBFBFC',
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
    paddingBottom: 80,
    gap: Spacing.three,
  },
  statsGrid: {
    gap: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  actionsGrid: {
    gap: Spacing.two,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  actionDesc: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  announcementCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: 8,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    flex: 1,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  announcementBody: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  announcementAction: {
    paddingTop: 4,
  },
  announcementActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
});
