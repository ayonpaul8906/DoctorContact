import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDoctorEarnings, useSearchClinics } from '../../hooks/useDoctor';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function DoctorEarningsScreen() {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedClinicId, setSelectedClinicId] = useState('ALL');

  // Queries
  const { data: clinics = [] } = useSearchClinics();

  const {
    data: earningsSummary,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useDoctorEarnings({
    period,
    clinicId: selectedClinicId !== 'ALL' ? selectedClinicId : undefined,
  });

  const totalEarnings = earningsSummary?.totalEarnings ?? 0;
  const totalConsultations = earningsSummary?.totalConsultations ?? 0;
  const clinicBreakdown = earningsSummary?.clinicBreakdown ?? [];

  const avgPerPatient =
    totalConsultations > 0 ? Math.round(totalEarnings / totalConsultations) : 0;

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
        <GradientCard variant="green" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Practice Earnings</Text>
                <Text style={styles.headerSubtitle}>
                  Financial analytics and clinic revenue distributions
                </Text>
              </View>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>INR (₹)</Text>
              </View>
            </View>

            {/* Big Revenue Banner */}
            <View style={styles.bigRevenueBox}>
              <Text style={styles.bigRevenueLabel}>Total Revenue ({period})</Text>
              <Text style={styles.bigRevenueNumber}>₹{totalEarnings.toLocaleString()}</Text>
            </View>

            {/* Period Switcher */}
            <View style={styles.periodSwitchRow}>
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => {
                const isSel = period === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodBtn, isSel && styles.periodBtnActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[styles.periodBtnText, isSel && styles.periodBtnTextActive]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Clinic Filter Tabs */}
            {clinics.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.clinicFilterRow}
              >
                <TouchableOpacity
                  style={[
                    styles.clinicFilterChip,
                    selectedClinicId === 'ALL' && styles.clinicFilterChipActive,
                  ]}
                  onPress={() => setSelectedClinicId('ALL')}
                >
                  <Text
                    style={[
                      styles.clinicFilterChipText,
                      selectedClinicId === 'ALL' && styles.clinicFilterChipTextActive,
                    ]}
                  >
                    All Clinics
                  </Text>
                </TouchableOpacity>

                {clinics.map((c) => {
                  const isSel = selectedClinicId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.clinicFilterChip,
                        isSel && styles.clinicFilterChipActive,
                      ]}
                      onPress={() => setSelectedClinicId(c.id)}
                    >
                      <Text
                        style={[
                          styles.clinicFilterChipText,
                          isSel && styles.clinicFilterChipTextActive,
                        ]}
                      >
                        {c.clinicName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </GradientCard>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.centerStateText}>Calculating earnings summary...</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={28} color={Colors.light.danger} />
            <Text style={styles.errorTitle}>Unable to load earnings</Text>
            <Text style={styles.errorSubtitle}>
              {error instanceof Error ? error.message : 'Please check your connection.'}
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => refetch()}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 2 KPI Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Icon name="users" size={16} color={Colors.light.primary} />
                </View>
                <Text style={styles.metricValue}>{totalConsultations}</Text>
                <Text style={styles.metricLabel}>Completed Visits</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Icon name="trending-up" size={16} color="#16A34A" />
                </View>
                <Text style={styles.metricValue}>₹{avgPerPatient}</Text>
                <Text style={styles.metricLabel}>Avg Per Consultation</Text>
              </View>
            </View>

            {/* Clinic Breakdown Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>Clinic Revenue Breakdown</Text>

              {clinicBreakdown.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Icon name="activity" size={28} color={Colors.light.ink400} />
                  <Text style={styles.emptyTitle}>No Revenue Records</Text>
                  <Text style={styles.emptySub}>
                    Completed patient consultations in this {period} window will appear here.
                  </Text>
                </View>
              ) : (
                <View style={styles.breakdownList}>
                  {clinicBreakdown.map((item, idx) => {
                    const pct =
                      totalEarnings > 0
                        ? Math.min(100, Math.round((item.totalEarnings / totalEarnings) * 100))
                        : 0;

                    return (
                      <GradientCard key={item.clinicId || idx} variant="blue" style={styles.itemCard}>
                        <View style={styles.itemCardContent}>
                          <View style={styles.itemCardTop}>
                            <View style={styles.clinicInfoGroup}>
                              <Text style={styles.itemClinicName}>{item.clinicName}</Text>
                              <Text style={styles.itemConsultationsText}>
                                {item.totalCompletedConsultations} consultations @ ₹{item.consultationFee}
                              </Text>
                            </View>

                            <Text style={styles.itemEarningsValue}>
                              ₹{item.totalEarnings.toLocaleString()}
                            </Text>
                          </View>

                          {/* Progress Bar */}
                          <View style={styles.progressBarBg}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${Math.max(5, pct)}%` },
                              ]}
                            />
                          </View>

                          <Text style={styles.pctText}>{pct}% of total period earnings</Text>
                        </View>
                      </GradientCard>
                    );
                  })}
                </View>
              )}
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
  headerContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  currencyBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  currencyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  bigRevenueBox: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  bigRevenueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
    textTransform: 'uppercase',
  },
  bigRevenueNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#047857',
  },
  periodSwitchRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.light.surfaceWhite,
    ...Shadows.sm,
  },
  periodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  periodBtnTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  clinicFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  clinicFilterChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  clinicFilterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  clinicFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  clinicFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerState: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#991B1B',
  },
  retryBtn: {
    backgroundColor: Colors.light.danger,
    paddingVertical: 8,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 2,
    ...Shadows.sm,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  sectionContainer: {
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  emptyCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  breakdownList: {
    gap: Spacing.three,
  },
  itemCard: {
    marginBottom: 0,
  },
  itemCardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  itemCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  clinicInfoGroup: {
    gap: 2,
    flex: 1,
  },
  itemClinicName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  itemConsultationsText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  itemEarningsValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.light.ink900,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.surface200,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  pctText: {
    fontSize: 10,
    color: Colors.light.ink500,
    textAlign: 'right',
  },
});
