import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyAssignedDoctors } from '../../hooks/useReceptionist';
import {
  useDoctorQueue,
  useQueueNext,
  useQueuePrevious,
  useQueueSkip,
  useQueuePause,
  useQueueResume,
  useQueueRecall,
} from '../../hooks/useDoctor';
import { useDoctorSchedules } from '../../hooks/useDoctorSearch';
import { api } from '../../lib/api';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import type { QueueToken } from '../../types';

export default function ReceptionistQueueScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ doctorId?: string; clinicId?: string }>();

  // Fetch Assigned Doctors
  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    refetch: refetchDoctors,
    isRefetching: isRefetchingDoctors,
  } = useMyAssignedDoctors();

  // Selected Doctor & Clinic
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');

  // Initial selection from route params or first doctor
  useEffect(() => {
    if (searchParams.doctorId && searchParams.clinicId) {
      setSelectedDoctorId(searchParams.doctorId);
      setSelectedClinicId(searchParams.clinicId);
    } else if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
      setSelectedClinicId(doctors[0].clinic?.id || doctors[0].clinicId || '');
    }
  }, [searchParams, doctors, selectedDoctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId),
    [doctors, selectedDoctorId]
  );

  // Date State (Defaults to Today)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Fetch Schedules/Sessions for doctor & clinic
  const { data: schedules = [], isLoading: loadingSchedules } = useDoctorSchedules(
    selectedDoctorId,
    selectedClinicId,
    selectedDate
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  // Auto-select active schedule
  useEffect(() => {
    const active = schedules.filter((s) => s.isActive);
    if (active.length > 0 && !active.some((s) => s.id === selectedScheduleId)) {
      setSelectedScheduleId(active[0].id);
    } else if (schedules.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(schedules[0].id);
    } else if (schedules.length === 0) {
      setSelectedScheduleId('');
    }
  }, [schedules, selectedScheduleId]);

  // Live Queue Query (with push Socket.io events!)
  const {
    data: queue,
    isLoading: loadingQueue,
    isFetching: fetchingQueue,
    refetch: refetchQueue,
  } = useDoctorQueue(selectedDoctorId, selectedClinicId, selectedDate, selectedScheduleId);

  // Queue Mutations
  const nextMutation = useQueueNext();
  const prevMutation = useQueuePrevious();
  const skipMutation = useQueueSkip();
  const pauseMutation = useQueuePause();
  const resumeMutation = useQueueResume();
  const recallMutation = useQueueRecall();

  // Delay Notification Modal
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState('15');
  const [delayReason, setDelayReason] = useState('Doctor is attending an emergency');
  const [sendingDelay, setSendingDelay] = useState(false);

  // Status Filter for Tokens List
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'CHECKED_IN' | 'COMPLETED' | 'ABSENT'>('ALL');

  // Handle Quick Actions
  const handleNext = async () => {
    if (!selectedDoctorId || !selectedClinicId) return;
    try {
      await nextMutation.mutateAsync({
        doctorId: selectedDoctorId,
        clinicId: selectedClinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
      });
    } catch (err: any) {
      Alert.alert('Queue Error', err?.response?.data?.message || 'Failed to call next token.');
    }
  };

  const handlePrev = async () => {
    if (!selectedDoctorId || !selectedClinicId) return;
    try {
      await prevMutation.mutateAsync({
        doctorId: selectedDoctorId,
        clinicId: selectedClinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
      });
    } catch (err: any) {
      Alert.alert('Queue Error', err?.response?.data?.message || 'Failed to go to previous token.');
    }
  };

  const handleSkip = async () => {
    if (!selectedDoctorId || !selectedClinicId) return;
    try {
      await skipMutation.mutateAsync({
        doctorId: selectedDoctorId,
        clinicId: selectedClinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
      });
    } catch (err: any) {
      Alert.alert('Queue Error', err?.response?.data?.message || 'Failed to skip token.');
    }
  };

  const handleTogglePause = async () => {
    if (!selectedDoctorId || !selectedClinicId) return;
    const isPaused = queue?.status === 'PAUSED';
    try {
      if (isPaused) {
        await resumeMutation.mutateAsync({
          doctorId: selectedDoctorId,
          clinicId: selectedClinicId,
          date: selectedDate,
          scheduleId: selectedScheduleId || undefined,
        });
      } else {
        await pauseMutation.mutateAsync({
          doctorId: selectedDoctorId,
          clinicId: selectedClinicId,
          date: selectedDate,
          scheduleId: selectedScheduleId || undefined,
        });
      }
    } catch (err: any) {
      Alert.alert('Queue Error', err?.response?.data?.message || 'Failed to update queue state.');
    }
  };

  const handleRecallToken = async (tokenNumber: number) => {
    if (!selectedDoctorId || !selectedClinicId) return;
    try {
      await recallMutation.mutateAsync({
        doctorId: selectedDoctorId,
        clinicId: selectedClinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
        body: { tokenNumber },
      });
      Alert.alert('Announced', `Token #${tokenNumber} called to chamber.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to call token.');
    }
  };

  const handleSendDelay = async () => {
    if (!selectedDoctorId || !selectedClinicId) return;
    setSendingDelay(true);
    try {
      await api.post(`/doctors/${selectedDoctorId}/clinics/${selectedClinicId}/delay`, {
        delayMinutes: Number(delayMinutes) || 15,
        reason: delayReason.trim(),
      });
      setDelayModalOpen(false);
      Alert.alert('Broadcast Sent', `Waiting patients notified of ~${delayMinutes} min delay.`);
    } catch (err: any) {
      Alert.alert('Notification Failed', err?.response?.data?.message || 'Could not send delay alert.');
    } finally {
      setSendingDelay(false);
    }
  };

  // Filter Tokens
  const filteredTokens = useMemo(() => {
    const list = queue?.tokens || [];
    if (statusFilter === 'ALL') return list;
    return list.filter((t) => t.status === statusFilter);
  }, [queue?.tokens, statusFilter]);

  const currentPatientToken = queue?.tokens?.find((t) => t.token === queue.currentToken);
  const waitingTokens = (queue?.tokens || []).filter(
    (t) => t.status === 'WAITING' || t.status === 'CHECKED_IN'
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={fetchingQueue && !loadingQueue}
            onRefresh={() => {
              refetchDoctors();
              refetchQueue();
            }}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Header Strip */}
        <View style={styles.headerBox}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Live Chamber Queue</Text>
            <Text style={styles.headerSubtitle}>
              Announce tokens, manage chamber consultation flow in real-time
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={() => refetchQueue()}
            disabled={fetchingQueue}
          >
            <Icon name="refresh-cw" size={14} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* 1. Assigned Doctors Switcher Chips */}
        {loadingDoctors ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 8 }} />
        ) : doctors.length === 0 ? (
          <View style={styles.noDocCard}>
            <Icon name="stethoscope" size={24} color={Colors.light.ink400} />
            <Text style={styles.noDocText}>No doctors assigned to your reception desk.</Text>
          </View>
        ) : (
          <View style={styles.doctorPickerSection}>
            <Text style={styles.subSectionTitle}>Select Doctor Chamber</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorChipScroll}>
              {doctors.map((doc) => {
                const isSelected = doc.id === selectedDoctorId;
                const dName = doc.user?.name || 'Doctor';
                const cId = doc.clinic?.id || doc.clinicId || '';

                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.doctorChip, isSelected && styles.doctorChipActive]}
                    onPress={() => {
                      setSelectedDoctorId(doc.id);
                      setSelectedClinicId(cId);
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name="stethoscope"
                      size={13}
                      color={isSelected ? '#FFFFFF' : Colors.light.primary}
                    />
                    <Text
                      style={[styles.doctorChipText, isSelected && styles.doctorChipTextActive]}
                      numberOfLines={1}
                    >
                      Dr. {dName.replace(/^dr\.?\s*/i, '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 2. Session / Schedule Selector */}
        {schedules.length > 0 && (
          <View style={styles.sessionSection}>
            <Text style={styles.subSectionTitle}>Consultation Session</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionScroll}>
              {schedules.map((slot) => {
                const isSelected = slot.id === selectedScheduleId;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.sessionPill, isSelected && styles.sessionPillActive]}
                    onPress={() => setSelectedScheduleId(slot.id)}
                  >
                    <Icon
                      name="clock"
                      size={12}
                      color={isSelected ? '#FFFFFF' : Colors.light.ink600}
                    />
                    <Text
                      style={[styles.sessionPillText, isSelected && styles.sessionPillTextActive]}
                    >
                      {slot.startTime} – {slot.endTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 3. Quick Queue Controls (Prominent for Counter Receptionist) */}
        <View style={styles.quickControlCard}>
          <View style={styles.controlHeader}>
            <View>
              <Text style={styles.controlTitle}>Counter Control</Text>
              <Text style={styles.controlDesc}>Tap Next to call next patient in line</Text>
            </View>

            <View
              style={[
                styles.queueStatusBadge,
                queue?.status === 'OPEN'
                  ? styles.queueOpen
                  : queue?.status === 'PAUSED'
                    ? styles.queuePaused
                    : styles.queueClosed,
              ]}
            >
              <Text
                style={[
                  styles.queueStatusBadgeText,
                  queue?.status === 'OPEN'
                    ? { color: '#059669' }
                    : queue?.status === 'PAUSED'
                      ? { color: '#D97706' }
                      : { color: '#DC2626' },
                ]}
              >
                {queue?.status || 'OPEN'}
              </Text>
            </View>
          </View>

          {/* Big Next Token Button */}
          <TouchableOpacity
            style={styles.bigNextBtn}
            onPress={handleNext}
            disabled={nextMutation.isPending}
            activeOpacity={0.88}
          >
            {nextMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="bell" size={20} color="#FFFFFF" />
                <View style={styles.nextBtnTextCol}>
                  <Text style={styles.nextBtnTitle}>Call Next Token</Text>
                  <Text style={styles.nextBtnSub}>
                    {waitingTokens[0]
                      ? `Next: #${waitingTokens[0].token} (${waitingTokens[0].patientName || 'Patient'})`
                      : 'No more waiting patients'}
                  </Text>
                </View>
                <Icon name="arrow-right" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Auxiliary Action Row: Prev, Skip, Pause/Resume, Delay */}
          <View style={styles.auxControlsRow}>
            <TouchableOpacity
              style={styles.auxBtn}
              onPress={handlePrev}
              disabled={prevMutation.isPending || !queue?.currentToken || queue.currentToken <= 1}
            >
              <Icon name="skip-back" size={14} color={Colors.light.ink700} />
              <Text style={styles.auxBtnText}>Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.auxBtn}
              onPress={handleSkip}
              disabled={skipMutation.isPending}
            >
              <Icon name="skip-forward" size={14} color={Colors.light.ink700} />
              <Text style={styles.auxBtnText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.auxBtn} onPress={handleTogglePause}>
              <Icon
                name={queue?.status === 'PAUSED' ? 'play' : 'pause'}
                size={14}
                color={queue?.status === 'PAUSED' ? '#059669' : '#D97706'}
              />
              <Text
                style={[
                  styles.auxBtnText,
                  queue?.status === 'PAUSED' && { color: '#059669' },
                ]}
              >
                {queue?.status === 'PAUSED' ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.auxBtn, styles.delayBtn]}
              onPress={() => setDelayModalOpen(true)}
            >
              <Icon name="clock" size={14} color="#DC2626" />
              <Text style={[styles.auxBtnText, { color: '#DC2626' }]}>Delay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Current Patient & Chamber Status */}
        <View style={styles.statusCardsRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>#{queue?.currentToken || 0}</Text>
            <Text style={styles.kpiTitle}>Now Serving</Text>
            <Text style={styles.kpiSub}>
              {currentPatientToken?.patientName || 'Chamber Empty'}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={[styles.kpiNumber, { color: '#2563EB' }]}>
              #{queue?.lastTokenIssued || 0}
            </Text>
            <Text style={styles.kpiTitle}>Last Issued</Text>
            <Text style={styles.kpiSub}>{waitingTokens.length} waiting</Text>
          </View>
        </View>

        {/* 5. Live Token Queue List with Filters */}
        <View style={styles.tokensSection}>
          <View style={styles.tokensHeader}>
            <Text style={styles.tokensTitle}>Chamber Token List</Text>
            <Text style={styles.tokensCount}>{queue?.tokens?.length || 0} Total</Text>
          </View>

          {/* Status Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(['ALL', 'WAITING', 'CHECKED_IN', 'COMPLETED', 'ABSENT'] as const).map((st) => {
              const isSel = statusFilter === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, isSel && styles.filterChipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                    {st === 'ALL' ? 'All Tokens' : st.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tokens Stream */}
          {loadingQueue ? (
            <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 20 }} />
          ) : filteredTokens.length === 0 ? (
            <View style={styles.emptyTokensBox}>
              <Icon name="list-ordered" size={24} color={Colors.light.ink400} />
              <Text style={styles.emptyTokensText}>No tokens in this queue category.</Text>
            </View>
          ) : (
            filteredTokens.map((item: QueueToken) => {
              const isServing = item.token === queue?.currentToken;
              const isWaiting = item.status === 'WAITING' || item.status === 'CHECKED_IN';

              return (
                <View
                  key={item.id || item.token}
                  style={[styles.tokenCard, isServing && styles.tokenCardServing]}
                >
                  <View
                    style={[
                      styles.tokenNumberBadge,
                      isServing && styles.tokenNumberBadgeServing,
                      item.status === 'COMPLETED' && styles.tokenBadgeDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tokenNumberText,
                        isServing && { color: '#FFFFFF' },
                        item.status === 'COMPLETED' && { color: '#047857' },
                      ]}
                    >
                      #{item.token}
                    </Text>
                  </View>

                  <View style={styles.tokenMeta}>
                    <Text style={styles.tokenPatientName}>
                      {item.patientName || 'Walk-in Patient'}
                    </Text>
                    <Text style={styles.tokenStatusSub}>
                      Status: {item.status.replace('_', ' ')}
                      {item.patientPhone ? ` • ${item.patientPhone}` : ''}
                    </Text>
                  </View>

                  {/* Actions for this token */}
                  <View style={styles.tokenActions}>
                    {isWaiting && (
                      <TouchableOpacity
                        style={styles.callTokenBtn}
                        onPress={() => handleRecallToken(item.token)}
                        activeOpacity={0.8}
                      >
                        <Icon name="bell" size={13} color={Colors.light.primary} />
                        <Text style={styles.callTokenBtnText}>Call</Text>
                      </TouchableOpacity>
                    )}
                    {isServing && (
                      <View style={styles.inChamberPill}>
                        <Text style={styles.inChamberText}>In Chamber</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Delay Quick Broadcast Modal */}
      <Modal
        visible={delayModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDelayModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Icon name="clock" size={18} color="#DC2626" />
                <Text style={styles.modalTitle}>Broadcast Running Late</Text>
              </View>
              <TouchableOpacity onPress={() => setDelayModalOpen(false)}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Notify all patients waiting in queue about an unexpected consultation delay.
            </Text>

            <Text style={styles.inputLabel}>Estimated Delay (Minutes)</Text>
            <View style={styles.delayChipsRow}>
              {['10', '15', '20', '30', '45', '60'].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[styles.delayChip, delayMinutes === mins && styles.delayChipActive]}
                  onPress={() => setDelayMinutes(mins)}
                >
                  <Text
                    style={[
                      styles.delayChipText,
                      delayMinutes === mins && styles.delayChipTextActive,
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Reason / Announcement Note</Text>
            <TextInput
              style={styles.modalInput}
              value={delayReason}
              onChangeText={setDelayReason}
              placeholder="e.g. Doctor attending an emergency patient"
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSendDelay}
              disabled={sendingDelay}
            >
              {sendingDelay ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="megaphone" size={15} color="#FFFFFF" />
                  <Text style={styles.modalSubmitBtnText}>Send Delay Notification</Text>
                </>
              )}
            </TouchableOpacity>
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
    paddingBottom: 90,
    gap: Spacing.three,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  headerLeft: {
    flex: 1,
    gap: 3,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    lineHeight: 16,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  doctorPickerSection: {
    gap: 6,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.ink700,
    paddingHorizontal: 2,
  },
  doctorChipScroll: {
    flexDirection: 'row',
  },
  doctorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
    ...Shadows.sm,
  },
  doctorChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  doctorChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  doctorChipTextActive: {
    color: '#FFFFFF',
  },
  noDocCard: {
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.four,
    borderRadius: Radius.xl,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  noDocText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  sessionSection: {
    gap: 6,
  },
  sessionScroll: {
    flexDirection: 'row',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  sessionPillActive: {
    backgroundColor: '#1E293B',
  },
  sessionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  sessionPillTextActive: {
    color: '#FFFFFF',
  },
  quickControlCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  controlDesc: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  queueStatusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  queueOpen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  queuePaused: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  queueClosed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  queueStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bigNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: Spacing.three,
    ...Shadows.sm,
  },
  nextBtnTextCol: {
    flex: 1,
  },
  nextBtnTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  nextBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  auxControlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  auxBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  delayBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  auxBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  statusCardsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    ...Shadows.sm,
  },
  kpiNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.light.primary,
  },
  kpiTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 11,
    color: Colors.light.ink700,
    marginTop: 1,
  },
  tokensSection: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  tokensHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokensTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  tokensCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  filterScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyTokensBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTokensText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    gap: Spacing.two,
  },
  tokenCardServing: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tokenNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenNumberBadgeServing: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tokenBadgeDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  tokenNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.light.ink900,
  },
  tokenMeta: {
    flex: 1,
  },
  tokenPatientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  tokenStatusSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  tokenActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callTokenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  inChamberPill: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  inChamberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  modalDesc: {
    fontSize: 12,
    color: Colors.light.ink500,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    marginTop: 4,
  },
  delayChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  delayChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
  },
  delayChipActive: {
    backgroundColor: '#DC2626',
  },
  delayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  delayChipTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: 8,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
