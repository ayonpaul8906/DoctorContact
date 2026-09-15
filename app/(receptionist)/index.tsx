import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { useMyAssignedDoctors } from '../../hooks/useReceptionist';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import type { Doctor } from '../../types';

function getInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .replace(/^dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ReceptionistDashboardScreen() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const {
    data: doctors = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useMyAssignedDoctors();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'RECEPTIONIST')) {
      router.replace('/(auth)');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading Reception Desk...</Text>
      </SafeAreaView>
    );
  }

  const availableDoctorsCount = doctors.filter(
    (d) => d.isAvailable || d.liveStatus?.isAvailable || d.liveStatus?.isLive
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Top Header matching Webapp */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <View style={styles.badgePill}>
                <Icon name="stethoscope" size={12} color={Colors.light.primary} />
                <Text style={styles.badgeText}>Reception Desk</Text>
              </View>
              {doctors.length > 0 && (
                <View style={[styles.badgePill, styles.clinicBadge]}>
                  <Icon name="building" size={11} color="#059669" />
                  <Text style={[styles.badgeText, { color: '#059669' }]}>
                    {doctors[0]?.clinic?.clinicName || 'Front Office'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.screenTitle}>My Doctors</Text>
            <Text style={styles.screenSubtitle}>
              Doctors assigned to your desk. Open a doctor to manage their live chamber queue.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetch()}
            disabled={isLoading || isFetching}
            activeOpacity={0.8}
          >
            <Icon
              name="refresh-cw"
              size={14}
              color={Colors.light.primary}
            />
            <Text style={styles.refreshBtnText}>
              {isFetching ? 'Syncing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick KPI Strip */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="users" size={18} color="#1D4ED8" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={styles.kpiValue}>{doctors.length}</Text>
              <Text style={styles.kpiLabel}>Assigned Doctors</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Icon name="check-circle" size={18} color="#059669" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>
                {availableDoctorsCount}
              </Text>
              <Text style={styles.kpiLabel}>Available Now</Text>
            </View>
          </View>
        </View>

        {/* Quick Operations Strip */}
        <View style={styles.quickActionsStrip}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(receptionist)/patients')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="user-plus" size={16} color="#1D4ED8" />
            </View>
            <View style={styles.quickActionTextCol}>
              <Text style={styles.quickActionTitle}>Patient Registration</Text>
              <Text style={styles.quickActionDesc}>Look up or register walk-in guest</Text>
            </View>
            <Icon name="chevron-right" size={14} color={Colors.light.ink400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(receptionist)/appointments')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FDF4FF' }]}>
              <Icon name="calendar-clock" size={16} color="#A21CAF" />
            </View>
            <View style={styles.quickActionTextCol}>
              <Text style={styles.quickActionTitle}>Today's Appointments</Text>
              <Text style={styles.quickActionDesc}>View tokens & check-in arrivals</Text>
            </View>
            <Icon name="chevron-right" size={14} color={Colors.light.ink400} />
          </TouchableOpacity>
        </View>

        {/* Error Alert */}
        {isError && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>Could not load your assigned doctors.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard} />
            ))}
          </View>
        )}

        {/* Empty State matching Webapp */}
        {!isLoading && !isError && doctors.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="stethoscope" size={32} color={Colors.light.ink400} />
            </View>
            <Text style={styles.emptyTitle}>No doctors assigned yet</Text>
            <Text style={styles.emptySub}>
              Ask your clinic admin to assign you to one or more doctors in the clinic staff portal.
            </Text>
            <TouchableOpacity
              style={styles.emptyRefreshBtn}
              onPress={() => refetch()}
              activeOpacity={0.85}
            >
              <Icon name="refresh-cw" size={14} color="#FFFFFF" />
              <Text style={styles.emptyRefreshBtnText}>Check Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Doctors Grid matching Webapp DoctorCard */}
        {!isLoading && !isError && doctors.length > 0 && (
          <View style={styles.doctorsList}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Assigned Doctors ({doctors.length})</Text>
              <Text style={styles.sectionHint}>Select to control live queue</Text>
            </View>

            {doctors.map((doctor, index) => {
              const doctorName = doctor.user?.name || 'Unknown Doctor';
              const clinicId = doctor.clinic?.id;
              const isAvail = doctor.isAvailable ?? doctor.liveStatus?.isAvailable ?? true;
              const isLive = doctor.liveStatus?.isLive ?? false;

              return (
                <View key={doctor.id || `doctor-${index}`} style={styles.doctorCard}>
                  {/* Doctor Info Row */}
                  <View style={styles.doctorTopRow}>
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarInitials}>{getInitials(doctorName)}</Text>
                    </View>

                    <View style={styles.doctorMeta}>
                      <Text style={styles.doctorName} numberOfLines={1}>
                        Dr. {doctorName.replace(/^dr\.?\s*/i, '')}
                      </Text>
                      {doctor.specialization ? (
                        <Text style={styles.specializationText} numberOfLines={1}>
                          {doctor.specialization}
                        </Text>
                      ) : (
                        <Text style={styles.specializationText}>General Practitioner</Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.availPill,
                        isLive
                          ? styles.livePill
                          : isAvail
                            ? styles.availPillActive
                            : styles.availPillInactive,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: isLive
                              ? '#DC2626'
                              : isAvail
                                ? '#059669'
                                : '#6B7280',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.availPillText,
                          isLive
                            ? { color: '#DC2626' }
                            : isAvail
                              ? { color: '#059669' }
                              : { color: '#6B7280' },
                        ]}
                      >
                        {isLive ? 'Live Now' : isAvail ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Clinic Location Information */}
                  <View style={styles.clinicInfoGroup}>
                    {doctor.clinic?.clinicName && (
                      <View style={styles.infoLine}>
                        <Icon name="building" size={13} color={Colors.light.primary} />
                        <Text style={styles.infoLineText} numberOfLines={1}>
                          {doctor.clinic.clinicName}
                        </Text>
                      </View>
                    )}
                    {doctor.clinic?.city && (
                      <View style={styles.infoLine}>
                        <Icon name="map-pin" size={13} color={Colors.light.ink500} />
                        <Text style={styles.infoLineTextSub} numberOfLines={1}>
                          {doctor.clinic.city}
                          {doctor.clinic.address ? ` • ${doctor.clinic.address}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Button: Manage Live Queue */}
                  <TouchableOpacity
                    style={styles.manageQueueBtn}
                    onPress={() => {
                      router.push({
                        pathname: '/(receptionist)/queue',
                        params: { doctorId: doctor.id, clinicId: clinicId || '' },
                      });
                    }}
                    activeOpacity={0.88}
                  >
                    <Icon name="list-ordered" size={15} color="#FFFFFF" />
                    <Text style={styles.manageQueueBtnText}>Manage Live Queue</Text>
                    <Icon name="arrow-right" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
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
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.backgroundSoft,
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
    paddingBottom: 90,
    gap: Spacing.three,
  },
  headerCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  headerLeft: {
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  clinicBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  screenTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    lineHeight: 17,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  kpiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTextGroup: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.light.ink900,
  },
  kpiLabel: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  quickActionsStrip: {
    gap: Spacing.two,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTextCol: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  quickActionDesc: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skeletonList: {
    gap: Spacing.two,
  },
  skeletonCard: {
    height: 140,
    borderRadius: Radius.xl,
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
  emptyCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.two,
  },
  emptyRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    marginTop: 6,
  },
  emptyRefreshBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  doctorsList: {
    gap: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  sectionHint: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  doctorCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  doctorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.light.primary,
  },
  doctorMeta: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  specializationText: {
    fontSize: 12,
    color: Colors.light.ink500,
    fontWeight: '500',
    marginTop: 1,
  },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  availPillActive: {
    backgroundColor: '#ECFDF5',
  },
  availPillInactive: {
    backgroundColor: '#F3F4F6',
  },
  livePill: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  clinicInfoGroup: {
    gap: 4,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLineText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink700,
    flex: 1,
  },
  infoLineTextSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    flex: 1,
  },
  manageQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    marginTop: 4,
    ...Shadows.sm,
  },
  manageQueueBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
