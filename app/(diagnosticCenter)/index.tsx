import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth-context';
import {
  useDiagnosticCenterProfile,
  useCenterStats,
  useDiagnosticCenterStaff,
  useIncomingReferrals,
} from '../../hooks/useDiagnostic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

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

export default function DiagnosticCenterDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: center,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isRefetching: profileRefetching,
  } = useDiagnosticCenterProfile();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching: statsRefetching,
  } = useCenterStats();

  const {
    data: staff = [],
    isLoading: staffLoading,
    refetch: refetchStaff,
    isRefetching: staffRefetching,
  } = useDiagnosticCenterStaff();

  const {
    data: referrals = [],
    isLoading: refLoading,
    refetch: refetchReferrals,
    isRefetching: refRefetching,
  } = useIncomingReferrals({ limit: 5 });

  const isRefreshing =
    profileRefetching || statsRefetching || staffRefetching || refRefetching;

  const onRefresh = () => {
    refetchProfile();
    refetchStats();
    refetchStaff();
    refetchReferrals();
  };

  const centerName = center?.centerName || user?.name || 'Diagnostic Center';
  const logoUrl = getImageUrl(center?.logo);
  const recentReferrals = referrals.slice(0, 5);

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
            tintColor="#14B8A6"
            colors={['#14B8A6', '#252a67']}
          />
        }
      >
        {/* ============================================================
            1. HERO BRANDING CARD (Webapp Gradient Theme)
        ============================================================ */}
        <LinearGradient
          colors={['#252a67', '#3b4a8f', '#0F766E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroLogoWrap}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.heroLogo} resizeMode="cover" />
              ) : (
                <View style={styles.heroLogoPlaceholder}>
                  <Icon name="flask" size={24} color="#14B8A6" />
                </View>
              )}
            </View>
            <View style={styles.heroTitleWrap}>
              <View style={styles.portalTagRow}>
                <Text style={styles.portalTag}>DIAGNOSTIC CENTER</Text>
                {center?.isApproved !== false && (
                  <View style={styles.verifiedBadge}>
                    <Icon name="shield-check" size={11} color="#34D399" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroCenterName} numberOfLines={1}>
                {centerName}
              </Text>
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {[center?.city, center?.state].filter(Boolean).join(', ') || 'Diagnostic Healthcare Partner'}
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

          {/* Quick Feature Badges */}
          <View style={styles.heroBadgesRow}>
            {center?.hasHomeService && (
              <View style={styles.heroFeatureBadge}>
                <Icon name="home" size={11} color="#5EEAD4" />
                <Text style={styles.heroFeatureText}>Home Sample Collection</Text>
              </View>
            )}
            <View style={styles.heroFeatureBadge}>
              <Icon name="users" size={11} color="#93C5FD" />
              <Text style={styles.heroFeatureText}>
                {staff.length} Active Staff
              </Text>
            </View>
            <View style={styles.heroFeatureBadge}>
              <Icon name="clock" size={11} color="#FDE047" />
              <Text style={styles.heroFeatureText}>Online & Ready</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ============================================================
            2. REAL KPI STATS GRID (from /test-referrals/stats)
        ============================================================ */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionHeaderTitle}>Overview & Key Metrics</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticCenter)/referrals')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="inbox" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>
                {statsLoading ? '–' : stats?.TOTAL ?? 0}
              </Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticCenter)/referrals')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="clock" size={20} color="#D97706" />
              </View>
              <Text style={styles.statValue}>
                {statsLoading ? '–' : stats?.PENDING ?? 0}
              </Text>
              <Text style={styles.statLabel}>Pending Tests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticCenter)/referrals')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Icon name="flask" size={20} color="#0284C7" />
              </View>
              <Text style={styles.statValue}>
                {statsLoading ? '–' : stats?.IN_PROGRESS ?? 0}
              </Text>
              <Text style={styles.statLabel}>In Processing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(diagnosticCenter)/referrals')}
            >
              <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Icon name="check-circle" size={20} color="#16A34A" />
              </View>
              <Text style={styles.statValue}>
                {statsLoading ? '–' : stats?.COMPLETED ?? 0}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            3. WORKSPACE QUICK ACTIONS (Webapp layout)
        ============================================================ */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionHeaderTitle}>Workspace Actions</Text>
          <View style={styles.actionCardsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(diagnosticCenter)/tests')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="flask" size={18} color="#16A34A" />
              </View>
              <Text style={styles.actionCardTitle}>Lab Tests</Text>
              <Text style={styles.actionCardSub}>Pricing & Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(diagnosticCenter)/referrals')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="inbox" size={18} color="#2563EB" />
              </View>
              <Text style={styles.actionCardTitle}>Referrals</Text>
              <Text style={styles.actionCardSub}>Doctor Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(diagnosticCenter)/schedule')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="clock" size={18} color="#D97706" />
              </View>
              <Text style={styles.actionCardTitle}>Schedule</Text>
              <Text style={styles.actionCardSub}>Working Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(diagnosticCenter)/staff')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="users" size={18} color="#9333EA" />
              </View>
              <Text style={styles.actionCardTitle}>Staff</Text>
              <Text style={styles.actionCardSub}>Team Members</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            4. RECENT INCOMING REFERRALS
        ============================================================ */}
        <View style={styles.recentSection}>
          <View style={styles.recentSectionHeader}>
            <View>
              <Text style={styles.sectionHeaderTitle}>Recent Patient Orders</Text>
              <Text style={styles.sectionHeaderSub}>Real-time referrals from clinics & doctors</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(diagnosticCenter)/referrals')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
              <Icon name="arrow-right" size={14} color="#14B8A6" />
            </TouchableOpacity>
          </View>

          {refLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#14B8A6" />
              <Text style={styles.loadingText}>Fetching recent referrals...</Text>
            </View>
          )}

          {!refLoading && recentReferrals.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Icon name="inbox" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Referrals Yet</Text>
              <Text style={styles.emptySubtitle}>
                Incoming diagnostic tests assigned to your center will appear here in real-time.
              </Text>
            </View>
          )}

          {!refLoading &&
            recentReferrals.map((item) => {
              const patientName =
                item.patient?.user?.name || item.patient?.name || 'Patient';
              const clinicName = item.referringClinic?.clinicName;
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
                  style={styles.referralCard}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(diagnosticCenter)/referrals')}
                >
                  <View style={styles.referralCardTop}>
                    <View style={styles.patientInfoCol}>
                      <View style={styles.patientRow}>
                        <View style={styles.patientAvatar}>
                          <Text style={styles.patientAvatarText}>
                            {patientName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.patientNameWrap}>
                          <Text style={styles.patientNameText} numberOfLines={1}>
                            {patientName}
                          </Text>
                          {item.patient?.phone && (
                            <Text style={styles.patientPhoneText}>
                              {item.patient.phone}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>

                  <View style={styles.testsChipContainer}>
                    {item.testNames && item.testNames.length > 0 ? (
                      item.testNames.map((tName, idx) => (
                        <View key={idx} style={styles.testChip}>
                          <Icon name="flask" size={10} color="#0F766E" />
                          <Text style={styles.testChipText}>{tName}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noTestsText}>General Diagnostic Panel</Text>
                    )}
                  </View>

                  <View style={styles.referralCardBottom}>
                    <View style={styles.referringRow}>
                      <Icon name="building" size={12} color="#64748B" />
                      <Text style={styles.referringText} numberOfLines={1}>
                        {clinicName ? `Ref: ${clinicName}` : 'Direct Recommendation'}
                      </Text>
                    </View>
                    {dateStr ? (
                      <Text style={styles.dateText}>{dateStr}</Text>
                    ) : null}
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
    shadowColor: '#252a67',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroLogoWrap: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroLogo: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg - 2,
  },
  heroLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg - 2,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitleWrap: {
    flex: 1,
  },
  portalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  portalTag: {
    color: '#5EEAD4',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  verifiedText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '700',
  },
  heroCenterName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#CBD5E1',
    fontSize: 11.5,
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
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  heroFeatureText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
  statsContainer: {
    gap: Spacing.two,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderSub: {
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
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
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
  quickActionsContainer: {
    gap: Spacing.two,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 4,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  actionCardSub: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  recentSection: {
    gap: Spacing.three,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  loadingBox: {
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
  },
  referralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
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
  referralCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfoCol: {
    flex: 1,
    marginRight: Spacing.two,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  patientAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    color: '#0F766E',
    fontWeight: '800',
    fontSize: 14,
  },
  patientNameWrap: {
    flex: 1,
  },
  patientNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientPhoneText: {
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
  testsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  testChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
  },
  noTestsText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  referralCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  referringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  referringText: {
    fontSize: 11,
    color: '#64748B',
  },
  dateText: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
});
