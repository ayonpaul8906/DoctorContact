import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  useClinicDoctors,
  useClinicProfile,
  usePeriodReport,
  useGrowthReport,
  useDailyDashboard,
} from '../hooks/useClinic';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { StatCard } from './StatCard';
import type { ClinicDoctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';

const PERIOD_PILLS: { key: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
];

const GRANULARITY_PILLS: { key: 'daily' | 'weekly' | 'monthly' | 'yearly'; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export function ClinicReportsView() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonth = useMemo(() => today.slice(0, 7), [today]);
  const currentYear = useMemo(() => String(new Date().getFullYear()), []);

  // Selection states
  const [selectedDoctor, setSelectedDoctor] = useState<ClinicDoctor | 'ALL' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Period report parameters
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Growth report parameters
  const [growthGranularity, setGrowthGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const sixMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }, []);
  const [growthStartDate, setGrowthStartDate] = useState(sixMonthsAgo);
  const [growthEndDate, setGrowthEndDate] = useState(today);

  // Data Queries
  const { data: clinic, isLoading: loadingClinic } = useClinicProfile();
  const { data: doctors = [], isLoading: loadingDoctors } = useClinicDoctors();

  const doctorId = selectedDoctor && selectedDoctor !== 'ALL' ? selectedDoctor.id : undefined;

  const periodParams = useMemo(() => {
    const base: any = {};
    if (doctorId) base.doctorId = doctorId;

    if (period === 'daily') return { ...base, date };
    if (period === 'weekly') return { ...base, date };
    if (period === 'monthly') return { ...base, month };
    if (period === 'yearly') return { ...base, year };
    if (period === 'custom') return { ...base, startDate, endDate };
    return base;
  }, [period, date, month, year, startDate, endDate, doctorId]);

  const {
    data: periodReport,
    isLoading: loadingPeriodReport,
    refetch: refetchPeriodReport,
  } = usePeriodReport(period, periodParams);

  const {
    data: growthReport,
    isLoading: loadingGrowthReport,
  } = useGrowthReport(growthGranularity, { startDate: growthStartDate, endDate: growthEndDate });

  const { data: dailyDashboard } = useDailyDashboard(period === 'daily' ? date : undefined);

  // Doctor search filtering
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase().trim();
    return doctors.filter((doc) => {
      const name = (doc.user?.name || '').toLowerCase();
      const spec = (doc.specialization || '').toLowerCase();
      return name.includes(q) || spec.includes(q);
    });
  }, [doctors, searchQuery]);

  const doctorDisplayName = useMemo(() => {
    if (selectedDoctor === 'ALL') return 'Overall Clinic Practice';
    if (selectedDoctor) return `Dr. ${selectedDoctor.user?.name || 'Doctor'}`;
    return 'Clinic Practice';
  }, [selectedDoctor]);

  // ============================================================
  // STAGE 1: DOCTOR SELECTION HUB (Just like webapp)
  // ============================================================
  if (!selectedDoctor) {
    return (
      <View style={styles.container}>
        {/* Header Title */}
        <View style={styles.hubHeader}>
          <Text style={styles.hubTitle}>Select Doctor for Report</Text>
          <Text style={styles.hubSubtitle}>
            Choose a doctor to generate their individual report or view the overall clinic report.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Icon name="search" size={16} color={Colors.light.ink400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctor by name or specialization..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.ink400}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <Icon name="x" size={14} color={Colors.light.ink400} />
            </TouchableOpacity>
          )}
        </View>

        {/* 1. Overall Clinic Report Card */}
        <TouchableOpacity
          style={styles.overallClinicCard}
          onPress={() => setSelectedDoctor('ALL')}
          activeOpacity={0.88}
        >
          <GradientCard variant="blue" style={styles.overallGradientCard}>
            <View style={styles.overallContent}>
              <View style={styles.overallTopRow}>
                <View style={styles.overallLogoBox}>
                  {clinic?.logo ? (
                    <Image source={{ uri: getImageUrl(clinic.logo) }} style={styles.overallLogoImg} />
                  ) : (
                    <Icon name="building" size={24} color="#FFFFFF" />
                  )}
                </View>

                <View style={styles.overallMetaCol}>
                  <View style={styles.overallTagRow}>
                    <Text style={styles.overallTagText}>ENTIRE CLINICAL ECOSYSTEM</Text>
                    <View style={styles.verifiedPill}>
                      <Icon name="check-circle" size={10} color="#047857" />
                      <Text style={styles.verifiedPillText}>Verified</Text>
                    </View>
                  </View>

                  <Text style={styles.overallTitle}>Overall Clinic Report</Text>
                  <Text style={styles.overallSubText}>
                    {clinic?.clinicName || 'Clinic Practice'} • All Associated Doctors
                  </Text>
                </View>
              </View>

              <View style={styles.overallActionFooter}>
                <Text style={styles.overallActionText}>View Practice-Wide Analytics</Text>
                <Icon name="arrow-right" size={14} color={Colors.light.primary} />
              </View>
            </View>
          </GradientCard>
        </TouchableOpacity>

        {/* 2. Individual Doctor Cards List */}
        <View style={styles.doctorsListSection}>
          <Text style={styles.sectionHeading}>
            PRACTICING DOCTORS ({filteredDoctors.length})
          </Text>

          {loadingDoctors ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.centerStateText}>Loading practicing doctors...</Text>
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptySearchBox}>
              <Icon name="search" size={24} color={Colors.light.ink400} />
              <Text style={styles.emptySearchTitle}>No doctors found</Text>
              <Text style={styles.emptySearchSub}>
                No doctors match "{searchQuery}"
              </Text>
            </View>
          ) : (
            <View style={styles.docGrid}>
              {filteredDoctors.map((doc) => {
                const docName = doc.user?.name || 'Doctor';
                const avatar = doc.avatar || doc.profilePhoto;
                const exp = doc.experience ?? 0;

                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.docCard}
                    onPress={() => setSelectedDoctor(doc)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.docCardTopRow}>
                      <View style={styles.docAvatarWrap}>
                        {avatar ? (
                          <Image source={{ uri: getImageUrl(avatar) }} style={styles.docAvatarImg} />
                        ) : (
                          <View style={styles.docAvatarFallback}>
                            <Text style={styles.docInitials}>
                              {docName
                                .split(' ')
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.docCardMeta}>
                        <View style={styles.docCardNameRow}>
                          <Text style={styles.docCardName} numberOfLines={1}>
                            Dr. {docName}
                          </Text>
                          <Icon name="check-circle" size={14} color="#10B981" />
                        </View>

                        <View style={styles.specRow}>
                          <Icon name="stethoscope" size={11} color={Colors.light.primary} />
                          <Text style={styles.docCardSpec} numberOfLines={1}>
                            {doc.specialization || 'General Physician'}
                          </Text>
                        </View>

                        {exp > 0 && (
                          <View style={styles.expPill}>
                            <Icon name="award" size={10} color="#D97706" />
                            <Text style={styles.expPillText}>{exp}+ years experience</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.docCardActionRow}>
                      <Text style={styles.docCardActionText}>Generate Report</Text>
                      <Icon name="chevron-right" size={14} color={Colors.light.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  }

  // ============================================================
  // STAGE 2: REPORT VIEW (Doctor / Clinic Selected)
  // ============================================================
  const growthSummary = growthReport?.summary;
  const growthRate = growthSummary?.growthRatePercent ?? 0;
  const isPositiveGrowth = growthRate >= 0;

  return (
    <View style={styles.container}>
      {/* Back to Selection Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedDoctor(null)}
        activeOpacity={0.7}
      >
        <Icon name="chevron-left" size={16} color={Colors.light.primary} />
        <Text style={styles.backButtonText}>Back to Doctor Selection</Text>
      </TouchableOpacity>

      {/* Hero Banner Card */}
      <GradientCard variant="blue" style={styles.heroBanner}>
        <View style={styles.heroBannerContent}>
          <View style={styles.heroBannerTop}>
            <View style={styles.heroIconBox}>
              <Icon name="trending-up" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.heroBannerTag}>PRACTICE PERFORMANCE</Text>
            <View style={styles.analyticsBadge}>
              <Icon name="sparkles" size={10} color="#047857" />
              <Text style={styles.analyticsBadgeText}>Analytics</Text>
            </View>
          </View>

          <Text style={styles.heroBannerHeading}>Reports for {doctorDisplayName}</Text>
          <Text style={styles.heroBannerSub}>
            Comprehensive appointment distribution, revenue estimations, and patient growth
          </Text>
        </View>
      </GradientCard>

      {/* ========================================================
          1. PERIOD REPORT CARD
      ======================================================== */}
      <GradientCard variant="indigo" style={styles.periodCard}>
        <View style={styles.periodCardContent}>
          {/* Card Title */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: '#4F46E5' }]}>
                <Icon name="calendar-days" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardHeaderTitle}>Patient Activity Report</Text>
                <Text style={styles.cardHeaderSub}>Consultation breakdown & estimated revenue</Text>
              </View>
            </View>
          </View>

          {/* Period Selector Pills */}
          <View style={styles.periodPillRow}>
            {PERIOD_PILLS.map((p) => {
              const isSel = period === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.periodPillBtn, isSel && styles.periodPillBtnActive]}
                  onPress={() => setPeriod(p.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodPillBtnText, isSel && styles.periodPillBtnTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Period Filter Inputs */}
          <View style={styles.filterInputsBox}>
            {(period === 'daily' || period === 'weekly') && (
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>
                  {period === 'weekly' ? 'WEEK OF' : 'DATE'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>
            )}

            {period === 'monthly' && (
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>MONTH</Text>
                <TextInput
                  style={styles.textInput}
                  value={month}
                  onChangeText={setMonth}
                  placeholder="YYYY-MM"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>
            )}

            {period === 'yearly' && (
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>YEAR</Text>
                <TextInput
                  style={styles.textInput}
                  value={year}
                  onChangeText={setYear}
                  placeholder="YYYY"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>
            )}

            {period === 'custom' && (
              <View style={styles.twoInputsRow}>
                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>FROM</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.inputLabel}>TO</Text>
                  <TextInput
                    style={styles.textInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.fetchReportBtn}
              onPress={() => refetchPeriodReport()}
              disabled={loadingPeriodReport}
              activeOpacity={0.85}
            >
              {loadingPeriodReport ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.fetchReportBtnText}>Update Report</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Summary Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Icon name="calendar" size={14} color={Colors.light.primary} />
              </View>
              <Text style={styles.metricValue}>{periodReport?.totalAppointments ?? 0}</Text>
              <Text style={styles.metricLabel}>Total Visits</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="dollar-sign" size={14} color="#059669" />
              </View>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                ₹{(periodReport?.estimatedRevenue ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Est. Revenue</Text>
            </View>

            {period === 'daily' && dailyDashboard && (
              <>
                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <Icon name="user" size={14} color="#2563EB" />
                  </View>
                  <Text style={styles.metricValue}>{dailyDashboard.newPatients ?? 0}</Text>
                  <Text style={styles.metricLabel}>New Patients</Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: '#FAF5FF' }]}>
                    <Icon name="refresh-cw" size={14} color="#7C3AED" />
                  </View>
                  <Text style={styles.metricValue}>{dailyDashboard.returningPatients ?? 0}</Text>
                  <Text style={styles.metricLabel}>Returning</Text>
                </View>
              </>
            )}
          </View>

          {/* Status Breakdown Grid */}
          <View style={styles.breakdownSection}>
            <Text style={styles.subSectionTitle}>Status Distribution</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Completed</Text>
                <Text style={[styles.statusBoxVal, { color: '#047857' }]}>
                  {periodReport?.byStatus?.COMPLETED ?? 0}
                </Text>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Waiting</Text>
                <Text style={[styles.statusBoxVal, { color: '#D97706' }]}>
                  {periodReport?.byStatus?.WAITING ?? 0}
                </Text>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Cancelled</Text>
                <Text style={[styles.statusBoxVal, { color: '#DC2626' }]}>
                  {periodReport?.byStatus?.CANCELLED ?? 0}
                </Text>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Absent</Text>
                <Text style={[styles.statusBoxVal, { color: Colors.light.ink600 }]}>
                  {periodReport?.byStatus?.ABSENT ?? 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Doctor-Wise Performance Breakdown */}
          {periodReport?.byDoctor && Object.keys(periodReport.byDoctor).length > 0 && (
            <View style={styles.doctorWiseSection}>
              <Text style={styles.subSectionTitle}>Doctor Breakdown</Text>
              <View style={styles.doctorWiseList}>
                {Object.entries(periodReport.byDoctor).map(([name, dData]) => (
                  <View key={name} style={styles.doctorWiseRow}>
                    <View style={styles.doctorWiseLeft}>
                      <View style={styles.doctorWiseIconBox}>
                        <Icon name="stethoscope" size={14} color={Colors.light.primary} />
                      </View>
                      <View>
                        <Text style={styles.doctorWiseName}>Dr. {name}</Text>
                        <Text style={styles.doctorWiseSub}>
                          {dData.totalAppointments} Visits • {dData.completed} Completed
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.doctorWiseRevenue}>₹{dData.revenue.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </GradientCard>

      {/* ========================================================
          2. PATIENT GROWTH & ACQUISITION CARD
      ======================================================== */}
      <GradientCard variant="green" style={styles.growthCard}>
        <View style={styles.growthCardContent}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: '#059669' }]}>
                <Icon name="trending-up" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cardHeaderTitle}>Patient Growth & Trends</Text>
                <Text style={styles.cardHeaderSub}>Historical volume and retention analytics</Text>
              </View>
            </View>
          </View>

          {/* Granularity Pills */}
          <View style={styles.periodPillRow}>
            {GRANULARITY_PILLS.map((g) => {
              const isSel = growthGranularity === g.key;
              return (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.periodPillBtn, isSel && styles.periodPillBtnActive]}
                  onPress={() => setGrowthGranularity(g.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodPillBtnText, isSel && styles.periodPillBtnTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Growth Summary Metrics */}
          <View style={styles.growthStatsRow}>
            <View style={styles.growthStatBox}>
              <Text style={styles.growthStatVal}>{growthSummary?.currentPeriodPatients ?? 0}</Text>
              <Text style={styles.growthStatLabel}>This Period</Text>
            </View>

            <View style={styles.growthStatBox}>
              <Text style={styles.growthStatVal}>{growthSummary?.previousPeriodPatients ?? 0}</Text>
              <Text style={styles.growthStatLabel}>Previous Period</Text>
            </View>

            <View style={styles.growthRateBox}>
              <View
                style={[
                  styles.growthRatePill,
                  { backgroundColor: isPositiveGrowth ? '#ECFDF5' : '#FEF2F2' },
                ]}
              >
                <Icon
                  name={isPositiveGrowth ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={isPositiveGrowth ? '#047857' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.growthRateText,
                    { color: isPositiveGrowth ? '#047857' : '#DC2626' },
                  ]}
                >
                  {isPositiveGrowth ? `+${growthRate}%` : `${growthRate}%`}
                </Text>
              </View>
              <Text style={styles.growthStatLabel}>Growth Rate</Text>
            </View>
          </View>

          {/* Growth Trend Points Timeline */}
          {growthReport?.trend && growthReport.trend.length > 0 && (
            <View style={styles.trendSection}>
              <Text style={styles.subSectionTitle}>Volume Trend Timeline</Text>
              <View style={styles.trendList}>
                {growthReport.trend.slice(-6).map((point, idx) => (
                  <View key={point.period || `trend-${idx}`} style={styles.trendRow}>
                    <Text style={styles.trendPeriodText}>{point.period}</Text>
                    <View style={styles.trendChipsRow}>
                      <View style={styles.trendChipBlue}>
                        <Text style={styles.trendChipBlueText}>+{point.newPatients} new</Text>
                      </View>
                      <View style={styles.trendChipGreen}>
                        <Text style={styles.trendChipGreenText}>{point.returningPatients} ret</Text>
                      </View>
                      <View style={styles.trendChipAmber}>
                        <Text style={styles.trendChipAmberText}>{point.totalAppointments} visits</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </GradientCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  hubHeader: {
    gap: 2,
    marginBottom: Spacing.one,
  },
  hubTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  hubSubtitle: {
    fontSize: 12,
    color: Colors.light.ink600,
    lineHeight: 18,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    paddingVertical: 2,
  },
  searchClearBtn: {
    padding: 4,
  },
  overallClinicCard: {
    marginTop: Spacing.one,
  },
  overallGradientCard: {
    marginBottom: 0,
  },
  overallContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  overallTopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  overallLogoBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...Shadows.sm,
  },
  overallLogoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overallMetaCol: {
    flex: 1,
    gap: 2,
  },
  overallTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overallTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.primary,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  overallTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  overallSubText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  overallActionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginTop: 2,
  },
  overallActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  doctorsListSection: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  centerState: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  emptySearchBox: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: 4,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  emptySearchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  emptySearchSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  docGrid: {
    gap: Spacing.two,
  },
  docCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  docCardTopRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  docAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Colors.light.primary,
  },
  docAvatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docAvatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docCardMeta: {
    flex: 1,
    gap: 2,
  },
  docCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  docCardName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docCardSpec: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  expPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  expPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  docCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  docCardActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  heroBanner: {
    marginBottom: 0,
  },
  heroBannerContent: {
    padding: Spacing.four,
    gap: 4,
  },
  heroBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroIconBox: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBannerTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.primary,
  },
  analyticsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  analyticsBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  heroBannerHeading: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    marginTop: 2,
  },
  heroBannerSub: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  periodCard: {
    marginBottom: 0,
  },
  periodCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  cardHeaderSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  periodPillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  periodPillBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  periodPillBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  periodPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  periodPillBtnTextActive: {
    color: '#FFFFFF',
  },
  filterInputsBox: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  filterInputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.ink600,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface300,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    fontSize: 12,
    color: Colors.light.ink900,
  },
  twoInputsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  fetchReportBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    marginTop: 2,
  },
  fetchReportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 2,
    ...Shadows.sm,
  },
  metricIconWrap: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  breakdownSection: {
    gap: 6,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    padding: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
    gap: 2,
  },
  statusBoxLabel: {
    fontSize: 9,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  statusBoxVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  doctorWiseSection: {
    gap: 6,
  },
  doctorWiseList: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    overflow: 'hidden',
  },
  doctorWiseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  doctorWiseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  doctorWiseIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorWiseName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  doctorWiseSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  doctorWiseRevenue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  growthCard: {
    marginBottom: 0,
  },
  growthCardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  growthStatsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  growthStatBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
    gap: 2,
  },
  growthStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  growthStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  growthRateBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
    gap: 4,
  },
  growthRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  growthRateText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trendSection: {
    gap: 6,
  },
  trendList: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    overflow: 'hidden',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
  },
  trendPeriodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  trendChipsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  trendChipBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  trendChipBlueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  trendChipGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  trendChipGreenText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  trendChipAmber: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  trendChipAmberText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
});
