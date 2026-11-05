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
import { useMyFollowups } from '../../hooks/usePatient';
import type { Followup, FollowupStatus } from '../../types';
import { ScreenHeader, EmptyState, Icon, type IconName } from '../../components';
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
  FollowupStatus,
  { label: string; bg: string; text: string; icon: IconName }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    icon: 'clock',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#DCFCE7',
    text: '#15803D',
    icon: 'check-circle',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#FEF2F2',
    text: '#DC2626',
    icon: 'alert-circle',
  },
};

const FILTERS = ['All', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;

export default function PatientFollowupsScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: followups, isLoading, isError, refetch, isRefetching } = useMyFollowups();
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
        <Text style={styles.loadingText}>Loading Follow-ups...</Text>
      </SafeAreaView>
    );
  }

  const list = followups ?? [];
  const todayStr = new Date().toDateString();

  const isUpcoming = (f: Followup) =>
    f.status === 'SCHEDULED' && new Date(f.followUpDate) >= new Date(todayStr);

  const upcomingCount = list.filter(isUpcoming).length;
  const completedCount = list.filter((f) => f.status === 'COMPLETED').length;

  const filtered = list.filter((f) => {
    if (selectedFilter === 'All') return true;
    return f.status === selectedFilter;
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
            onRefresh={() => { refetch(); }}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="My Follow-ups"
              subtitle="Follow-up visits your doctor or clinic has scheduled for you."
              badgeText="Follow-ups"
            />

            {/* Quick Metrics Bar */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, styles.metricCardPrimary]}>
                <View style={styles.metricIconBox}>
                  <Icon name="calendar-clock" size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.metricValue}>{upcomingCount}</Text>
                  <Text style={styles.metricLabel}>Upcoming Visits</Text>
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
                      {f === 'All' ? 'All Follow-ups' : f.charAt(0) + f.slice(1).toLowerCase()}
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
                <Text style={styles.stateText}>Loading scheduled follow-ups...</Text>
              </View>
            )}

            {/* Error State */}
            {!isLoading && isError && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={24} color={Colors.light.danger} />
                <Text style={styles.errorTitle}>Could not load your follow-ups</Text>
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
                    ? 'No Follow-ups Scheduled'
                    : `No ${selectedFilter.toLowerCase()} follow-ups`
                }
                description="When a doctor or clinic schedules a follow-up consultation for you, it will appear here."
              />
            )}
          </>
        }
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.SCHEDULED;
          const upcoming = isUpcoming(item);

          return (
            <View style={styles.card}>
              {/* Card Header Row */}
              <View style={styles.cardHeader}>
                <View style={styles.dateGroup}>
                  <View style={styles.calendarIconBox}>
                    <Icon name="calendar-clock" size={20} color="#1C63E7" />
                  </View>
                  <View>
                    <Text style={styles.dateText}>{formatDate(item.followUpDate)}</Text>
                    {upcoming && (
                      <View style={styles.upcomingBadge}>
                        <View style={styles.upcomingDot} />
                        <Text style={styles.upcomingText}>Upcoming visit</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                  <Icon name={config.icon} size={12} color={config.text} />
                  <Text style={[styles.statusText, { color: config.text }]}>
                    {config.label}
                  </Text>
                </View>
              </View>

              {/* Card Body Information */}
              <View style={styles.cardBody}>
                {item.doctor?.user?.name && (
                  <View style={styles.infoRow}>
                    <Icon name="stethoscope" size={14} color="#1C63E7" />
                    <Text style={styles.infoText}>
                      Dr. {item.doctor.user.name}
                    </Text>
                  </View>
                )}

                {item.clinic?.clinicName && (
                  <View style={styles.infoRow}>
                    <Icon name="building" size={14} color="#16A34A" />
                    <Text style={styles.infoText}>
                      {item.clinic.clinicName}
                    </Text>
                  </View>
                )}

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Icon name="file-text" size={13} color={Colors.light.ink500} />
                    <Text style={styles.notesText}>{item.notes}</Text>
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
    borderLeftColor: Colors.light.primary,
  },
  metricCardSecondary: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
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
  calendarIconBox: {
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
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  upcomingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  upcomingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
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
});
