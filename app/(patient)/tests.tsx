import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { useMyReferrals } from '../../hooks/usePatient';
import type { Referral, ReferralStatus } from '../../types';
import { ScreenHeader, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const STATUS_CONFIG: Record<
  ReferralStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    bg: '#FEF3C7',
    text: '#B45309',
    dot: '#F59E0B',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    dot: '#3B82F6',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#DCFCE7',
    text: '#15803D',
    dot: '#10B981',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#FEF2F2',
    text: '#DC2626',
    dot: '#EF4444',
  },
};

const FILTERS = ['All', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export default function PatientTestsScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: referrals, isLoading, isError, refetch, isRefetching } = useMyReferrals();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'PATIENT')) {
      router.replace('/(auth)');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingCenter} edges={['left', 'right']}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading Lab Tests...</Text>
      </SafeAreaView>
    );
  }

  const list = referrals ?? [];
  const pendingCount = list.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length;
  const completedCount = list.filter((r) => r.status === 'COMPLETED').length;

  const filtered = list.filter((r) => {
    if (selectedFilter === 'All') return true;
    return r.status === selectedFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <FlatList
        data={filtered}
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
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="My Tests"
              subtitle="Lab tests recommended for you and their current status."
              badgeText="Diagnostics"
            />

            {/* Quick Metrics Bar */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, styles.metricCardPrimary]}>
                <View style={styles.metricIconBox}>
                  <Icon name="flask" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{pendingCount}</Text>
                  <Text style={styles.metricLabel}>Pending / Processing</Text>
                </View>
              </View>

              <View style={[styles.metricCard, styles.metricCardSecondary]}>
                <View style={[styles.metricIconBox, styles.metricIconBoxDone]}>
                  <Icon name="check-circle" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{completedCount}</Text>
                  <Text style={styles.metricLabel}>Completed</Text>
                </View>
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {FILTERS.map((f) => {
                const active = selectedFilter === f;
                const count =
                  f === 'All' ? list.length : list.filter((x) => x.status === f).length;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => setSelectedFilter(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                      {f === 'All' ? 'All Tests' : f.replace('_', ' ')}
                    </Text>
                    <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                      <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Loading State */}
            {isLoading && (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.stateText}>Loading your test recommendations...</Text>
              </View>
            )}

            {/* Error State */}
            {!isLoading && isError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={24} color={Colors.light.danger} />
                <Text style={styles.errorTitle}>Could not load your tests</Text>
                <Text style={styles.errorSubtitle}>Please check your connection and try again.</Text>
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

            {/* Empty State */}
            {!isLoading && !isError && filtered.length === 0 && (
              <EmptyState
                title={
                  selectedFilter === 'All'
                    ? 'No Test Recommendations'
                    : `No ${selectedFilter.toLowerCase().replace('_', ' ')} tests`
                }
                description="When a clinic or doctor recommends a lab test for you, it will appear here."
              />
            )}
          </>
        }
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;

          return (
            <View style={styles.card}>
              {/* Card Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.dateGroup}>
                  <View style={styles.flaskIconBox}>
                    <Icon name="flask" size={20} color="#1C63E7" />
                  </View>
                  <View>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    <Text style={styles.testCountSub}>
                      {item.testNames.length} test{item.testNames.length !== 1 ? 's' : ''} requested
                    </Text>
                  </View>
                </View>

                {/* Status Badge with Dot */}
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
                  <Text style={[styles.statusText, { color: config.text }]}>
                    {config.label}
                  </Text>
                </View>
              </View>

              {/* Test Name Chips */}
              <View style={styles.chipsContainer}>
                {item.testNames.map((testName, idx) => (
                  <View key={idx} style={styles.testChip}>
                    <Text style={styles.testChipText}>{testName}</Text>
                  </View>
                ))}
              </View>

              {/* Card Body Information */}
              <View style={styles.cardBody}>
                {item.diagnosticCenter?.centerName && (
                  <View style={styles.infoRow}>
                    <Icon name="building" size={14} color="#16A34A" />
                    <Text style={styles.infoText}>
                      {item.diagnosticCenter.centerName}
                    </Text>
                  </View>
                )}

                {item.referringClinic?.clinicName && (
                  <View style={styles.infoRow}>
                    <Icon name="stethoscope" size={14} color="#1C63E7" />
                    <Text style={styles.infoText}>
                      Referred by {item.referringClinic.clinicName}
                    </Text>
                  </View>
                )}

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Icon name="file-text" size={13} color={Colors.light.ink500} />
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}

                {item.resultNotes ? (
                  <View style={styles.resultNotesBox}>
                    <View style={styles.resultHeaderRow}>
                      <Icon name="check-circle" size={13} color="#15803D" />
                      <Text style={styles.resultHeaderTitle}>Lab Results & Notes</Text>
                    </View>
                    <Text style={styles.resultNotesText}>{item.resultNotes}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
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
  listContent: {
    padding: Spacing.four,
    paddingBottom: 90,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  metricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  metricCardPrimary: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  metricCardSecondary: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricIconBoxDone: {
    backgroundColor: '#10B981',
  },
  metricValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  filterScroll: {
    marginBottom: Spacing.three,
  },
  filterContent: {
    gap: Spacing.two,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  filterPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterBadge: {
    backgroundColor: Colors.light.surface100,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
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
    marginVertical: Spacing.two,
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
    marginVertical: Spacing.two,
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
  card: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three + 2,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.three,
    ...Shadows.sm,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  flaskIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#EAF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  testCountSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  testChip: {
    backgroundColor: '#EAF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C63E7',
  },
  cardBody: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface100,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink700,
    flex: 1,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  notesText: {
    fontSize: 12,
    color: Colors.light.ink600,
    flex: 1,
    lineHeight: 18,
  },
  resultNotesBox: {
    backgroundColor: '#F0FDF4',
    padding: Spacing.two,
    borderRadius: Radius.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  resultNotesText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
  },
});
