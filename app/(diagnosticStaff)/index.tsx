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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import {
  useCenterStats,
  useIncomingReferrals,
  useDiagnosticStaffProfile,
} from '../../hooks/useDiagnostic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

function StatusBadge({ status }: { status?: string }) {
  const s = status?.toUpperCase() || 'PENDING';
  let bg = '#FEF3C7', text = '#B45309', border = '#FDE68A';
  if (s === 'COMPLETED') {
    bg = '#DCFCE7'; text = '#15803D'; border = '#BBF7D0';
  } else if (s === 'IN_PROGRESS') {
    bg = '#EFF6FF'; text = '#1D4ED8'; border = '#BFDBFE';
  } else if (s === 'CANCELLED') {
    bg = '#FEF2F2'; text = '#DC2626'; border = '#FECACA';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.statusBadgeText, { color: text }]}>{s.replace('_', ' ')}</Text>
    </View>
  );
}

export default function DiagnosticStaffDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: staffProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isRefetching: profileRefetching,
  } = useDiagnosticStaffProfile();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching: statsRefetching,
  } = useCenterStats();

  const {
    data: recentReferrals = [],
    isLoading: refLoading,
    refetch: refetchReferrals,
    isRefetching: refRefetching,
  } = useIncomingReferrals({ limit: 6 });

  const isRefreshing = profileRefetching || statsRefetching || refRefetching;

  const onRefresh = () => {
    refetchProfile();
    refetchStats();
    refetchReferrals();
  };

  const centerName =
    staffProfile?.diagnosticCenter?.centerName || 'Diagnostic Center';
  const staffName = staffProfile?.user?.name || user?.name || 'Lab Technician';

  const pendingCount = stats?.PENDING ?? 0;
  const inProgressCount = stats?.IN_PROGRESS ?? 0;
  const completedCount = stats?.COMPLETED ?? 0;
  const totalCount = stats?.TOTAL ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#0284C7"
            colors={['#0284C7', '#1E40AF']}
          />
        }
      >
        {/* ============================================================
            1. HERO GREETING BANNER
        ============================================================ */}
        <LinearGradient
          colors={['#1E3A8A', '#2563EB', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {staffName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroInfoCol}>
              <View style={styles.badgeRow}>
                <Text style={styles.roleTag}>DIAGNOSTIC STAFF</Text>
                <View style={styles.centerBadge}>
                  <Icon name="building" size={10} color="#BFDBFE" />
                  <Text style={styles.centerBadgeText} numberOfLines={1}>
                    {centerName}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroStaffName} numberOfLines={1}>
                Hello, {staffName}
              </Text>
              <Text style={styles.heroSubText}>
                Sample collection, test processing & diagnostic reporting
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshIconBtn}
              onPress={onRefresh}
              disabled={isRefreshing}
            >
              <Icon name="refresh-cw" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ============================================================
            2. REAL STATS GRID (from /test-referrals/stats)
        ============================================================ */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Assigned Tests</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticStaff)/tests')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="clock" size={20} color="#D97706" />
              </View>
              <Text style={styles.statNumber}>
                {statsLoading ? '–' : pendingCount}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticStaff)/tests')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="flask" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statNumber}>
                {statsLoading ? '–' : inProgressCount}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticStaff)/tests')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check-circle" size={20} color="#16A34A" />
              </View>
              <Text style={styles.statNumber}>
                {statsLoading ? '–' : completedCount}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticStaff)/tests')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Icon name="inbox" size={20} color="#475569" />
              </View>
              <Text style={styles.statNumber}>
                {statsLoading ? '–' : totalCount}
              </Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            3. ACTION SHORTCUT BANNER
        ============================================================ */}
        <TouchableOpacity
          style={styles.actionBanner}
          onPress={() => router.push('/(diagnosticStaff)/tests')}
          activeOpacity={0.8}
        >
          <View style={styles.actionBannerIconBox}>
            <Icon name="flask" size={20} color="#2563EB" />
          </View>
          <View style={styles.actionBannerContent}>
            <Text style={styles.actionBannerTitle}>Assigned Tests Queue</Text>
            <Text style={styles.actionBannerSub}>
              Collect samples, advance statuses & record lab findings
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* ============================================================
            4. RECENT ASSIGNED TESTS LIST (REAL BACKEND DATA)
        ============================================================ */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Recent Assigned Tests</Text>
              <Text style={styles.sectionSubtitle}>Test recommendations assigned to your center</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(diagnosticStaff)/tests')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
              <Icon name="arrow-right" size={14} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {refLoading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingCardText}>Fetching test orders...</Text>
            </View>
          )}

          {!refLoading && recentReferrals.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Icon name="flask" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Test Orders Yet</Text>
              <Text style={styles.emptySub}>
                When doctors prescribe diagnostic tests to your laboratory, they will appear here.
              </Text>
            </View>
          )}

          {!refLoading &&
            recentReferrals.slice(0, 6).map((item) => {
              const patientName =
                item.patient?.user?.name || item.patient?.name || 'Patient';
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.testCard}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(diagnosticStaff)/tests')}
                >
                  <View style={styles.testCardHeader}>
                    <View style={styles.patientRow}>
                      <View style={styles.patientAvatar}>
                        <Text style={styles.patientAvatarText}>
                          {patientName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientName} numberOfLines={1}>
                          {patientName}
                        </Text>
                        {item.patient?.phone && (
                          <Text style={styles.patientPhone}>
                            {item.patient.phone}
                          </Text>
                        )}
                      </View>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>

                  <View style={styles.chipsRow}>
                    {item.testNames && item.testNames.length > 0 ? (
                      item.testNames.map((t, idx) => (
                        <View key={idx} style={styles.chip}>
                          <Icon name="flask" size={10} color="#2563EB" />
                          <Text style={styles.chipText}>{t}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noChips}>General Diagnostic Investigation</Text>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.clinicRow}>
                      <Icon name="building" size={11} color="#64748B" />
                      <Text style={styles.clinicText} numberOfLines={1}>
                        {item.referringClinic?.clinicName || 'Clinic Order'}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{dateStr}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 90,
    gap: Spacing.four,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroInfoCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  roleTag: {
    color: '#93C5FD',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  centerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  centerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '600',
    maxWidth: 130,
  },
  heroStaffName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  heroSubText: {
    color: '#DBEAFE',
    fontSize: 11,
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBannerContent: {
    flex: 1,
  },
  actionBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  recentSection: {
    gap: Spacing.three,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  loadingCard: {
    padding: Spacing.five,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.two,
  },
  loadingCardText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 17,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  patientAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 14,
  },
  patientName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  noChips: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  clinicText: {
    fontSize: 11,
    color: '#64748B',
  },
  dateText: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
});
