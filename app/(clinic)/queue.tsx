import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDailyDashboard, useClinicDoctors, useClinicProfile } from '../../hooks/useClinic';
import { useAppointmentRealtime } from '../../hooks/useAppointmentRealtime';
import {
  GradientCard,
  Icon,
  ClinicLiveQueueManager,
} from '../../components';
import type { ClinicDoctor } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

export default function ClinicQueueScreen() {
  const { isConnected } = useAppointmentRealtime();
  const { data: clinic } = useClinicProfile();
  const clinicId = clinic?.id;

  const [selectedDoctorForQueue, setSelectedDoctorForQueue] = useState<ClinicDoctor | null>(null);

  const {
    data: dailyDashboard,
    isLoading: loadingDashboard,
    isError,
    error,
    refetch: refetchDashboard,
    isRefetching: refetchingDashboard,
  } = useDailyDashboard();

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    refetch: refetchDoctors,
    isRefetching: refetchingDoctors,
  } = useClinicDoctors();

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchDoctors();
  };

  const isRefreshing = refetchingDashboard || refetchingDoctors;
  const queueSummary = dailyDashboard?.queueSummary || [];
  const isLoading = loadingDashboard || loadingDoctors;

  const totalWaiting = queueSummary.reduce((acc, curr) => {
    return acc + Math.max(0, (curr.lastTokenIssued || 0) - (curr.currentToken || 0));
  }, 0);

  const activeQueuesCount = queueSummary.filter(
    (q) => q.status?.toUpperCase() === 'ACTIVE'
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefreshAll}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {selectedDoctorForQueue && clinicId ? (
          <ClinicLiveQueueManager
            doctor={selectedDoctorForQueue}
            clinicId={clinicId}
            doctors={doctors}
            onSelectDoctor={(doc) => setSelectedDoctorForQueue(doc)}
            onBack={() => setSelectedDoctorForQueue(null)}
          />
        ) : (
          <>
            {/* 1. Header Banner */}
            <GradientCard variant="blue" style={styles.headerCard}>
              <View style={styles.headerContent}>
                <View style={styles.headerTop}>
                  <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Practice Live Queues</Text>
                    <Text style={styles.headerSubtitle}>
                      Choose a doctor to open and manage their live queue session
                    </Text>
                  </View>

                  <View style={styles.realtimePill}>
                    <View
                      style={[
                        styles.realtimeDot,
                        { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
                      ]}
                    />
                    <Text style={styles.realtimePillText}>
                      {isConnected ? 'Realtime' : 'Connecting'}
                    </Text>
                  </View>
                </View>

                {/* 3 Metrics Row */}
                <View style={styles.kpiRow}>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiVal}>{doctors.length}</Text>
                    <Text style={styles.kpiLabel}>Total Doctors</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiVal, { color: '#047857' }]}>
                      {activeQueuesCount}
                    </Text>
                    <Text style={styles.kpiLabel}>Active Queues</Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={[styles.kpiVal, { color: '#D97706' }]}>
                      {totalWaiting}
                    </Text>
                    <Text style={styles.kpiLabel}>Total Waiting</Text>
                  </View>
                </View>
              </View>
            </GradientCard>

            {/* 2. Doctor Queue List */}
            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.centerStateText}>Synchronizing queue states...</Text>
              </View>
            ) : isError ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={28} color={Colors.light.danger} />
                <Text style={styles.errorTitle}>Unable to load clinic queues</Text>
                <Text style={styles.errorSubtitle}>
                  {error instanceof Error ? error.message : 'Please check your connection.'}
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleRefreshAll}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : doctors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Icon name="list-ordered" size={28} color={Colors.light.ink400} />
                </View>
                <Text style={styles.emptyTitle}>No Doctors Associated</Text>
                <Text style={styles.emptySubtitle}>
                  Once practicing doctors are linked to your clinic, their live queues can be managed here.
                </Text>
              </View>
            ) : (
              <View style={styles.doctorsList}>
                {doctors.map((doc) => {
                  const dName = doc.user?.name || 'Doctor';
                  const q = queueSummary.find(
                    (item) => item.doctorId === doc.id || item.doctorName === dName
                  );
                  const isQueueActive = Boolean(q && (q.status === 'ACTIVE' || (q.lastTokenIssued || 0) > 0));
                  const avatar = doc.avatar || doc.profilePhoto;

                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={styles.docQueueCard}
                      onPress={() => setSelectedDoctorForQueue(doc)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.docQueueAvatar}>
                        {avatar ? (
                          <Image source={{ uri: getImageUrl(avatar) }} style={styles.docQueueImg} />
                        ) : (
                          <View style={styles.docQueueFallback}>
                            <Text style={styles.docQueueInitials}>
                              {dName
                                .split(' ')
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.docQueueMeta}>
                        <View style={styles.docQueueTitleRow}>
                          <Text style={styles.docQueueName} numberOfLines={1}>
                            Dr. {dName}
                          </Text>
                          <View
                            style={[
                              styles.docQueueStatusBadge,
                              {
                                backgroundColor: isQueueActive ? '#ECFDF5' : '#F3F4F6',
                                borderColor: isQueueActive ? '#A7F3D0' : '#E5E7EB',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.docQueueStatusText,
                                { color: isQueueActive ? '#047857' : '#6B7280' },
                              ]}
                            >
                              {isQueueActive ? q?.status || 'Active' : 'Idle'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.docQueueSpec} numberOfLines={1}>
                          {doc.specialization || 'General Physician'}
                        </Text>

                        <View style={styles.docQueueBottomRow}>
                          <Text style={styles.docQueueTokenMeta}>
                            {isQueueActive
                              ? `Serving #${q?.currentToken || 0} • ${Math.max(0, (q?.lastTokenIssued || 0) - (q?.currentToken || 0))} waiting`
                              : 'No active tokens today'}
                          </Text>

                          <View style={styles.docQueueOpenBtn}>
                            <Text style={styles.docQueueOpenBtnText}>Manage Queue</Text>
                            <Icon name="chevron-right" size={13} color={Colors.light.primary} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
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
    gap: Spacing.two,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  realtimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  realtimePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radius.md,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  kpiVal: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
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
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  errorSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 18,
  },
  doctorsList: {
    gap: Spacing.two,
  },
  docQueueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  docQueueAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Colors.light.primary,
  },
  docQueueImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docQueueFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docQueueInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docQueueMeta: {
    flex: 1,
    gap: 3,
  },
  docQueueTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docQueueName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    flex: 1,
  },
  docQueueStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  docQueueStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  docQueueSpec: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  docQueueBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  docQueueTokenMeta: {
    fontSize: 11,
    color: Colors.light.ink500,
    flex: 1,
  },
  docQueueOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  docQueueOpenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
