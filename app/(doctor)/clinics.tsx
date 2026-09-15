import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useDoctorReceivedRequests,
  useDoctorSentRequests,
} from '../../hooks/useDoctor';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

interface DerivedClinicItem {
  clinicId: string;
  clinicName: string;
  city?: string | null;
  address?: string | null;
  status: string;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  fee?: number | null;
  requestId: string;
  requestType: 'received' | 'sent';
}

export default function DoctorClinicsScreen() {
  const router = useRouter();

  const {
    data: receivedRequests = [],
    isLoading: loadingReceived,
    refetch: refetchReceived,
    isRefetching: isRefetchingReceived,
  } = useDoctorReceivedRequests();

  const {
    data: sentRequests = [],
    isLoading: loadingSent,
    refetch: refetchSent,
    isRefetching: isRefetchingSent,
  } = useDoctorSentRequests();

  const isRefreshing = isRefetchingReceived || isRefetchingSent;
  const isInitialLoading = loadingReceived || loadingSent;

  const { acceptedClinics, pendingClinics, allClinics, citiesCount } =
    useMemo(() => {
      const allRequests = [
        ...receivedRequests.map((r) => ({ ...r, _type: 'received' as const })),
        ...sentRequests.map((r) => ({ ...r, _type: 'sent' as const })),
      ];

      const acceptedMap = new Map<string, DerivedClinicItem>();
      const pendingMap = new Map<string, DerivedClinicItem>();
      const citiesSet = new Set<string>();

      allRequests.forEach((req) => {
        const cId = req.clinicId || req.clinic?.id;
        if (!cId) return;

        const city = req.clinic?.city;
        if (city) citiesSet.add(city.trim().toLowerCase());

        const item: DerivedClinicItem = {
          clinicId: cId,
          clinicName: req.clinic?.clinicName || 'Medical Practice',
          city: req.clinic?.city,
          address: req.clinic?.address,
          status: req.status,
          dayOfWeek: req.dayOfWeek,
          startTime: req.startTime,
          endTime: req.endTime,
          fee: req.fee,
          requestId: req.id,
          requestType: req._type,
        };

        if (req.status === 'ACCEPTED') {
          if (!acceptedMap.has(cId)) acceptedMap.set(cId, item);
        } else if (req.status === 'PENDING') {
          if (!pendingMap.has(cId) && !acceptedMap.has(cId)) {
            pendingMap.set(cId, item);
          }
        }
      });

      const accepted = Array.from(acceptedMap.values());
      const pending = Array.from(pendingMap.values()).filter(
        (p) => !acceptedMap.has(p.clinicId)
      );

      return {
        acceptedClinics: accepted,
        pendingClinics: pending,
        allClinics: [...accepted, ...pending],
        citiesCount: citiesSet.size,
      };
    }, [receivedRequests, sentRequests]);

  const handleRefreshAll = () => {
    refetchReceived();
    refetchSent();
  };

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
        {/* Header */}
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Affiliated Clinics</Text>
                <Text style={styles.headerSubtitle}>
                  Overview of practice branches and consultation venues
                </Text>
              </View>
              <TouchableOpacity
                style={styles.connectClinicBtn}
                onPress={() => router.push('/(doctor)/requests')}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={13} color="#FFFFFF" />
                <Text style={styles.connectClinicBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GradientCard>

        {isInitialLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.centerStateText}>Loading affiliated clinics...</Text>
          </View>
        ) : (
          <>
            {/* Operational Metrics Grid */}
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{acceptedClinics.length}</Text>
                <Text style={styles.metricLabel}>Active Clinics</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: '#D97706' }]}>
                  {pendingClinics.length}
                </Text>
                <Text style={styles.metricLabel}>Pending</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{citiesCount}</Text>
                <Text style={styles.metricLabel}>Cities</Text>
              </View>
            </View>

            {/* Active Associations Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeading}>
                Active Clinics ({acceptedClinics.length})
              </Text>

              {acceptedClinics.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Icon name="building" size={28} color={Colors.light.ink400} />
                  <Text style={styles.emptyTitle}>No Active Clinics</Text>
                  <Text style={styles.emptySub}>
                    Accept clinic connection requests to practice at partner centers.
                  </Text>
                </View>
              ) : (
                <View style={styles.clinicsList}>
                  {acceptedClinics.map((clinic) => (
                    <GradientCard
                      key={clinic.clinicId}
                      variant="green"
                      style={styles.clinicCard}
                    >
                      <View style={styles.clinicCardContent}>
                        <View style={styles.clinicCardHeader}>
                          <View style={styles.clinicIconCircle}>
                            <Icon name="building" size={16} color="#FFFFFF" />
                          </View>
                          <View style={styles.clinicNameGroup}>
                            <Text style={styles.clinicCardTitle}>{clinic.clinicName}</Text>
                            {clinic.city ? (
                              <Text style={styles.clinicCityText}>
                                <Icon name="map-pin" size={11} color={Colors.light.ink500} />{' '}
                                {clinic.city}
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                          </View>
                        </View>

                        {clinic.address ? (
                          <Text style={styles.clinicAddressText}>{clinic.address}</Text>
                        ) : null}

                        <View style={styles.clinicDetailsRow}>
                          {clinic.dayOfWeek ? (
                            <View style={styles.detailPill}>
                              <Text style={styles.detailPillText}>
                                {clinic.dayOfWeek.slice(0, 3)}: {clinic.startTime}-{clinic.endTime}
                              </Text>
                            </View>
                          ) : null}
                          {clinic.fee != null ? (
                            <View style={styles.detailPill}>
                              <Text style={styles.detailPillText}>Fee: ₹{clinic.fee}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </GradientCard>
                  ))}
                </View>
              )}
            </View>

            {/* Pending Requests Section */}
            {pendingClinics.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>
                  Pending Connection Requests ({pendingClinics.length})
                </Text>

                <View style={styles.clinicsList}>
                  {pendingClinics.map((clinic) => (
                    <GradientCard
                      key={clinic.clinicId}
                      variant="orange"
                      style={styles.clinicCard}
                    >
                      <View style={styles.clinicCardContent}>
                        <View style={styles.clinicCardHeader}>
                          <View style={[styles.clinicIconCircle, { backgroundColor: '#F97316' }]}>
                            <Icon name="clock" size={16} color="#FFFFFF" />
                          </View>
                          <View style={styles.clinicNameGroup}>
                            <Text style={styles.clinicCardTitle}>{clinic.clinicName}</Text>
                            {clinic.city ? (
                              <Text style={styles.clinicCityText}>{clinic.city}</Text>
                            ) : null}
                          </View>
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        </View>
                      </View>
                    </GradientCard>
                  ))}
                </View>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
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
  connectClinicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  connectClinicBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricBox: {
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
  metricVal: {
    fontSize: Typography.fontSizes.xl,
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
  clinicsList: {
    gap: Spacing.three,
  },
  clinicCard: {
    marginBottom: 0,
  },
  clinicCardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  clinicCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clinicIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicNameGroup: {
    flex: 1,
  },
  clinicCardTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  clinicCityText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  clinicAddressText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  clinicDetailsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  detailPill: {
    backgroundColor: Colors.light.surface50,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  detailPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
});
