import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import {
  useDoctorReceivedRequests,
  useDoctorSentRequests,
  useDoctorDashboard,
  useDoctorLeaves,
  useMarkDoctorLeave,
  useCancelDoctorLeave,
  useUpdateConsultationTime,
  useNotifyDoctorDelay,
} from '../../hooks/useDoctor';
import { useDoctorSchedules } from '../../hooks/useDoctorSearch';
import type { DoctorLeave } from '../../types';
import {
  GradientCard,
  Icon,
} from '../../components';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function DoctorScheduleScreen() {
  const { user } = useAuth();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');

  // Modals
  const [isMarkLeaveModalOpen, setIsMarkLeaveModalOpen] = useState(false);
  const [leaveDate, setLeaveDate] = useState(todayStr);
  const [leaveReason, setLeaveReason] = useState('');
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationMinutes, setConsultationMinutes] = useState('15');

  // Queries
  const {
    data: receivedRequests = [],
    isLoading: loadingReceived,
    refetch: refetchReceived,
  } = useDoctorReceivedRequests();

  const {
    data: sentRequests = [],
    isLoading: loadingSent,
    refetch: refetchSent,
  } = useDoctorSentRequests();

  const {
    data: dashboardStats,
    refetch: refetchDashboard,
  } = useDoctorDashboard();

  // Accepted clinics
  const clinicsInfo = useMemo(() => {
    const accepted = [...receivedRequests, ...sentRequests].filter(
      (r) => r.status === 'ACCEPTED'
    );

    const map = new Map<
      string,
      { id: string; name: string; city?: string | null; doctorId: string }
    >();

    accepted.forEach((req) => {
      const cId = req.clinicId || req.clinic?.id;
      const dId = req.doctorId || req.doctor?.id || user?.id || '';
      if (cId && !map.has(cId)) {
        map.set(cId, {
          id: cId,
          name: req.clinic?.clinicName || 'Clinic Practice',
          city: req.clinic?.city || null,
          doctorId: dId,
        });
      }
    });

    return Array.from(map.values());
  }, [receivedRequests, sentRequests, user?.id]);

  useEffect(() => {
    if (clinicsInfo.length > 0 && !selectedClinicId) {
      setSelectedClinicId(clinicsInfo[0].id);
    }
  }, [clinicsInfo, selectedClinicId]);

  const activeClinic = clinicsInfo.find((c) => c.id === selectedClinicId) || clinicsInfo[0];
  const doctorId = activeClinic?.doctorId || user?.id || '';

  const {
    data: leaves = [],
    isLoading: loadingLeaves,
    isRefetching: fetchingLeaves,
    isError: isErrorLeaves,
    error: leavesError,
    refetch: refetchLeaves,
  } = useDoctorLeaves(doctorId, selectedClinicId);

  const {
    data: schedules = [],
    isLoading: loadingSchedules,
    refetch: refetchSchedules,
  } = useDoctorSchedules(doctorId, selectedClinicId);

  // Mutations
  const markLeaveMutation = useMarkDoctorLeave();
  const cancelLeaveMutation = useCancelDoctorLeave();
  const updateTimeMutation = useUpdateConsultationTime();
  const delayMutation = useNotifyDoctorDelay();

  const handleRefreshAll = () => {
    refetchReceived();
    refetchSent();
    refetchDashboard();
    if (selectedClinicId) {
      refetchLeaves();
      refetchSchedules();
    }
  };

  const handleMarkLeave = async () => {
    if (!leaveDate.trim()) {
      Alert.alert('Validation Error', 'Please specify a leave date (YYYY-MM-DD).');
      return;
    }
    try {
      await markLeaveMutation.mutateAsync({
        doctorId,
        clinicId: selectedClinicId,
        date: leaveDate.trim(),
        reason: leaveReason.trim() || undefined,
      });
      setIsMarkLeaveModalOpen(false);
      setLeaveReason('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to mark leave.');
    }
  };

  const handleCancelLeave = (leave: DoctorLeave) => {
    Alert.alert(
      'Cancel Leave',
      `Are you sure you want to cancel your scheduled leave on ${leave.date}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelLeaveMutation.mutateAsync({
                doctorId,
                clinicId: selectedClinicId,
                date: leave.date,
              });
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Unable to cancel leave.');
            }
          },
        },
      ]
    );
  };

  const handleSaveConsultationTime = async () => {
    const mins = parseInt(consultationMinutes, 10);
    if (isNaN(mins) || mins <= 0) {
      Alert.alert('Invalid Time', 'Please enter a valid number of minutes (e.g. 15).');
      return;
    }
    try {
      await updateTimeMutation.mutateAsync({
        doctorId,
        clinicId: selectedClinicId,
        avgConsultationMinutes: mins,
      });
      setIsConsultationModalOpen(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to update consultation time.');
    }
  };

  const handleQuickDelay = (mins: number) => {
    Alert.alert(
      'Broadcast Delay',
      `Broadcast an expected ${mins} minute schedule delay to patients in queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Broadcast',
          onPress: async () => {
            try {
              await delayMutation.mutateAsync({
                doctorId,
                clinicId: selectedClinicId,
                delayMinutes: mins,
              });
              Alert.alert('Broadcast Sent', `Patients have been notified of the +${mins}m schedule delay.`);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Unable to broadcast delay.');
            }
          },
        },
      ]
    );
  };

  const isInitialLoading = (loadingReceived || loadingSent) && clinicsInfo.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={fetchingLeaves}
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
                <Text style={styles.headerTitle}>Practice Schedule & Leaves</Text>
                <Text style={styles.headerSubtitle}>
                  Manage consultation timing, delays, and scheduled leaves
                </Text>
              </View>
              <TouchableOpacity
                style={styles.markLeaveHeaderBtn}
                onPress={() => setIsMarkLeaveModalOpen(true)}
                activeOpacity={0.85}
              >
                <Icon name="calendar" size={14} color="#FFFFFF" />
                <Text style={styles.markLeaveHeaderBtnText}>Mark Leave</Text>
              </TouchableOpacity>
            </View>

            {/* Clinic Tabs */}
            {clinicsInfo.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.clinicTabsRow}
              >
                {clinicsInfo.map((clinic) => {
                  const isSelected = clinic.id === selectedClinicId;
                  return (
                    <TouchableOpacity
                      key={clinic.id}
                      style={[
                        styles.clinicTab,
                        isSelected && styles.clinicTabSelected,
                      ]}
                      onPress={() => setSelectedClinicId(clinic.id)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name="building"
                        size={13}
                        color={isSelected ? '#FFFFFF' : Colors.light.ink600}
                      />
                      <Text
                        style={[
                          styles.clinicTabText,
                          isSelected && styles.clinicTabTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {clinic.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </GradientCard>

        {isInitialLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.centerStateText}>Loading practice schedule...</Text>
          </View>
        )}

        {!isInitialLoading && clinicsInfo.length === 0 && (
          <View style={styles.emptyCard}>
            <Icon name="building" size={32} color={Colors.light.ink400} />
            <Text style={styles.emptyTitle}>No Connected Clinics</Text>
            <Text style={styles.emptySubtitle}>
              Connect with a clinic in Requests or Clinics tab to start managing your consultation schedule and leaves.
            </Text>
          </View>
        )}

        {!isInitialLoading && clinicsInfo.length > 0 && (
          <>
            {/* Consultation Time & Delays 2x1 Grid */}
            <View style={styles.twoColGrid}>
              {/* Avg Consultation Time Card */}
              <GradientCard variant="purple" style={styles.halfCard}>
                <View style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconCirclePurple}>
                      <Icon name="clock" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.cardHeaderTitle}>Avg Consultation</Text>
                  </View>

                  <Text style={styles.consultationBigNumber}>
                    {dashboardStats?.avgConsultationMinutes ?? 15} mins
                  </Text>
                  <Text style={styles.cardDescText}>
                    Used to calculate real-time queue wait estimates for patients.
                  </Text>

                  <TouchableOpacity
                    style={styles.editTimeBtn}
                    onPress={() => {
                      setConsultationMinutes(
                        String(dashboardStats?.avgConsultationMinutes ?? 15)
                      );
                      setIsConsultationModalOpen(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.editTimeBtnText}>Change Timing</Text>
                  </TouchableOpacity>
                </View>
              </GradientCard>

              {/* Delay Broadcast Card */}
              <GradientCard variant="orange" style={styles.halfCard}>
                <View style={styles.cardPadding}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconCircleOrange}>
                      <Icon name="alert-triangle" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.cardHeaderTitle}>Broadcast Delay</Text>
                  </View>

                  <Text style={styles.cardDescText}>
                    Running behind schedule? 1-tap notify waiting patients:
                  </Text>

                  <View style={styles.delayButtonsRow}>
                    {[10, 15, 20, 30].map((mins) => (
                      <TouchableOpacity
                        key={mins}
                        style={styles.delayPillBtn}
                        onPress={() => handleQuickDelay(mins)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.delayPillBtnText}>+{mins}m</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </GradientCard>
            </View>

            {/* Practice Consultation Sessions Card */}
            <GradientCard variant="blue" style={styles.sessionsCard}>
              <View style={styles.cardPadding}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleBlue}>
                    <Icon name="clock" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.cardHeaderTitle}>Practice Consultation Sessions</Text>
                    <Text style={styles.cardSubtitle}>Operating session slots at {activeClinic?.name}</Text>
                  </View>
                  <View style={styles.sessionCountBadge}>
                    <Text style={styles.sessionCountBadgeText}>
                      {schedules.filter((s) => s.isActive).length} Active
                    </Text>
                  </View>
                </View>

                {schedules.length === 0 ? (
                  <View style={styles.noSessionsContainer}>
                    <Icon name="calendar" size={24} color={Colors.light.ink400} />
                    <Text style={styles.noSessionsTitle}>No Sessions Configured</Text>
                    <Text style={styles.noSessionsSub}>
                      Contact clinic administration to establish daily consultation session timings.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.sessionsList}>
                    {schedules.map((slot) => (
                      <View key={slot.id} style={styles.sessionItemRow}>
                        <View style={styles.sessionTimeCol}>
                          <Text style={styles.sessionTimeText}>
                            {slot.startTime} – {slot.endTime}
                          </Text>
                          <Text style={styles.sessionMetaText}>
                            {slot.recurrenceType} · Max {slot.maxPatients} patients
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.sessionStatusPill,
                            slot.isActive ? styles.sessionPillActive : styles.sessionPillInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sessionStatusText,
                              slot.isActive
                                ? styles.sessionStatusActiveText
                                : styles.sessionStatusInactiveText,
                            ]}
                          >
                            {slot.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </GradientCard>

            {/* Scheduled Leaves List Card */}
            <GradientCard variant="green" style={styles.leavesCard}>
              <View style={styles.cardPadding}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleGreen}>
                    <Icon name="calendar" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.cardHeaderTitle}>Scheduled Practice Leaves</Text>
                    <Text style={styles.cardSubtitle}>Days you are marked absent at this clinic</Text>
                  </View>
                  <View style={styles.leaveCountBadge}>
                    <Text style={styles.leaveCountBadgeText}>{leaves.length} Dates</Text>
                  </View>
                </View>

                {leaves.length === 0 ? (
                  <View style={styles.noLeavesContainer}>
                    <Icon name="check-circle" size={24} color="#16A34A" />
                    <Text style={styles.noLeavesTitle}>No Upcoming Leaves</Text>
                    <Text style={styles.noLeavesSub}>
                      You have full availability scheduled at {activeClinic?.name}.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.leavesList}>
                    {leaves.map((leave, idx) => (
                      <View
                        key={leave.id || `leave-${leave.date}-${idx}`}
                        style={styles.leaveItemRow}
                      >
                        <View style={styles.leaveDateCol}>
                          <Text style={styles.leaveDateText}>{leave.date}</Text>
                          {leave.reason ? (
                            <Text style={styles.leaveReasonText}>{leave.reason}</Text>
                          ) : (
                            <Text style={styles.leaveReasonPlaceholder}>Scheduled Leave</Text>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.cancelLeaveBtn}
                          onPress={() => handleCancelLeave(leave)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cancelLeaveBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </GradientCard>
          </>
        )}
      </ScrollView>

      {/* Mark Leave Modal */}
      <Modal
        visible={isMarkLeaveModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMarkLeaveModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mark Practice Leave</Text>
            <Text style={styles.modalSubtitle}>
              Select the date you will not be available at {activeClinic?.name}.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Leave Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                value={leaveDate}
                onChangeText={setLeaveDate}
                placeholder="2026-08-30"
                placeholderTextColor={Colors.light.ink400}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={leaveReason}
                onChangeText={setLeaveReason}
                placeholder="e.g. Medical Conference / Personal Leave"
                placeholderTextColor={Colors.light.ink400}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsMarkLeaveModalOpen(false)}
                disabled={markLeaveMutation.isPending}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleMarkLeave}
                disabled={markLeaveMutation.isPending}
              >
                {markLeaveMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Save Leave</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Consultation Time Modal */}
      <Modal
        visible={isConsultationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConsultationModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Average Consultation Duration</Text>
            <Text style={styles.modalSubtitle}>
              Estimated minutes per patient used to compute live waiting times.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (Minutes)</Text>
              <TextInput
                style={styles.modalInput}
                value={consultationMinutes}
                onChangeText={setConsultationMinutes}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor={Colors.light.ink400}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsConsultationModalOpen(false)}
                disabled={updateTimeMutation.isPending}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveConsultationTime}
                disabled={updateTimeMutation.isPending}
              >
                {updateTimeMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 2,
  },
  markLeaveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  markLeaveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  clinicTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clinicTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  clinicTabSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  clinicTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  clinicTabTextSelected: {
    color: '#FFFFFF',
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
  emptyCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.six,
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
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  twoColGrid: {
    gap: Spacing.three,
  },
  halfCard: {
    marginBottom: 0,
  },
  cardPadding: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCirclePurple: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleOrange: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleGreen: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleBlue: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  flex1: {
    flex: 1,
  },
  consultationBigNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.light.ink900,
  },
  cardDescText: {
    fontSize: 11,
    color: Colors.light.ink600,
    lineHeight: 15,
  },
  editTimeBtn: {
    backgroundColor: Colors.light.surface100,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  editTimeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  delayButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  delayPillBtn: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  delayPillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  sessionsCard: {
    marginBottom: Spacing.four,
  },
  sessionCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  sessionCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  noSessionsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: 4,
  },
  noSessionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  noSessionsSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  sessionsList: {
    gap: Spacing.two,
  },
  sessionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  sessionTimeCol: {
    gap: 2,
    flex: 1,
  },
  sessionTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  sessionMetaText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  sessionStatusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  sessionPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  sessionPillInactive: {
    backgroundColor: Colors.light.surface100,
    borderColor: Colors.light.surface200,
  },
  sessionStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionStatusActiveText: {
    color: '#059669',
  },
  sessionStatusInactiveText: {
    color: Colors.light.ink500,
  },
  leavesCard: {
    marginBottom: 0,
  },
  leaveCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  leaveCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  noLeavesContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: 4,
  },
  noLeavesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  noLeavesSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  leavesList: {
    gap: Spacing.two,
  },
  leaveItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  leaveDateCol: {
    gap: 2,
    flex: 1,
  },
  leaveDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  leaveReasonText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  leaveReasonPlaceholder: {
    fontSize: 11,
    color: Colors.light.ink400,
    fontStyle: 'italic',
  },
  cancelLeaveBtn: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelLeaveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    width: '100%',
    maxWidth: 380,
    gap: Spacing.three,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  modalInput: {
    backgroundColor: Colors.light.surface50,
    borderColor: Colors.light.surface200,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  modalConfirmBtn: {
    flex: 1.2,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
