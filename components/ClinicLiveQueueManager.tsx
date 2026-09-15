import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Linking,
  Modal,
} from 'react-native';
import {
  useDoctorQueue,
  useQueueNext,
  useQueuePrevious,
  useQueueSkip,
  useQueueRecall,
  useQueuePause,
  useQueueResume,
  useQueueEmergency,
  useNotifyDoctorDelay,
  useSearchPatientByPhone,
} from '../hooks/useDoctor';
import { useDoctorSchedules } from '../hooks/useDoctorSearch';
import {
  useBookReceptionAppointment,
  useUpdateAppointmentStatus,
} from '../hooks/useClinic';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { ClinicDoctor, QueueToken, QueueStatus } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';

interface ClinicLiveQueueManagerProps {
  doctor: ClinicDoctor;
  clinicId: string;
  doctors?: ClinicDoctor[];
  onSelectDoctor?: (doc: ClinicDoctor) => void;
  onBack: () => void;
}

const PRESET_DELAYS = [10, 15, 30, 45];

export function ClinicLiveQueueManager({
  doctor,
  clinicId,
  doctors = [],
  onSelectDoctor,
  onBack,
}: ClinicLiveQueueManagerProps) {
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [customDelay, setCustomDelay] = useState<string>('');

  const doctorName = doctor.user?.name || 'Doctor';
  const doctorAvatar = doctor.avatar || doctor.profilePhoto;

  // 1. Fetch Doctor Schedules / Sessions
  const { data: schedules = [], isLoading: loadingSchedules } = useDoctorSchedules(
    doctor.id,
    clinicId,
    selectedDate
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  useEffect(() => {
    const active = schedules.filter((s) => s.isActive);
    if (active.length > 0 && !active.some((s) => s.id === selectedScheduleId)) {
      setSelectedScheduleId(active[0].id);
    } else if (active.length === 0 && schedules.length > 0) {
      setSelectedScheduleId(schedules[0].id);
    }
  }, [schedules, selectedScheduleId]);

  // 2. Fetch Doctor Live Queue with WebSocket
  const {
    data: queue,
    isLoading: loadingQueue,
    isFetching: fetchingQueue,
    refetch: refetchQueue,
  } = useDoctorQueue(doctor.id, clinicId, selectedDate, selectedScheduleId || undefined);

  // 3. Queue Action Mutations
  const nextMutation = useQueueNext();
  const prevMutation = useQueuePrevious();
  const skipMutation = useQueueSkip();
  const recallMutation = useQueueRecall();
  const pauseMutation = useQueuePause();
  const resumeMutation = useQueueResume();
  const emergencyMutation = useQueueEmergency();
  const delayMutation = useNotifyDoctorDelay();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const bookWalkInMutation = useBookReceptionAppointment();
  const searchPatientMutation = useSearchPatientByPhone();

  const isBusy =
    nextMutation.isPending ||
    prevMutation.isPending ||
    skipMutation.isPending ||
    recallMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    emergencyMutation.isPending;

  const currentTokenNumber = queue?.currentToken ?? 0;
  const lastTokenIssued = queue?.lastTokenIssued ?? 0;
  const queueStatus = (queue?.status || 'OPEN').toUpperCase();
  const isClosed = queueStatus === 'CLOSED';
  const isPaused = queueStatus === 'PAUSED';

  const tokens = queue?.tokens ?? [];
  const currentPatientToken = tokens.find((t) => t.token === currentTokenNumber);
  const waitingTokens = tokens.filter(
    (t) => t.status === 'WAITING' || (t.status as string) === 'CHECKED_IN'
  );
  const nextPatientToken = waitingTokens[0];

  // Token list filters & search
  const [tokenFilterStatus, setTokenFilterStatus] = useState<
    'ALL' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED'
  >('ALL');
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');

  // Walk-in Token Modal States
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInAge, setWalkInAge] = useState('');
  const [walkInGender, setWalkInGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');

  // Next Token Handler
  const handleNext = async () => {
    try {
      await nextMutation.mutateAsync({
        doctorId: doctor.id,
        clinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not call next patient.');
    }
  };

  // Previous Token Handler
  const handlePrevious = async () => {
    try {
      await prevMutation.mutateAsync({
        doctorId: doctor.id,
        clinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not go to previous token.');
    }
  };

  // Skip Current Token Handler
  const handleSkip = async () => {
    Alert.alert(
      'Skip Token',
      `Are you sure you want to skip token #${currentTokenNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await skipMutation.mutateAsync({
                doctorId: doctor.id,
                clinicId,
                date: selectedDate,
                scheduleId: selectedScheduleId || undefined,
              });
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not skip token.');
            }
          },
        },
      ]
    );
  };

  // Recall Skipped Token Handler
  const handleRecall = async () => {
    try {
      await recallMutation.mutateAsync({
        doctorId: doctor.id,
        clinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
      });
      Alert.alert('Recalled', 'Patient recalled to the active queue.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not recall patient.');
    }
  };

  // Pause / Resume Queue Handler
  const handleTogglePause = async () => {
    try {
      if (isPaused) {
        await resumeMutation.mutateAsync({
          doctorId: doctor.id,
          clinicId,
          date: selectedDate,
          scheduleId: selectedScheduleId || undefined,
        });
      } else {
        await pauseMutation.mutateAsync({
          doctorId: doctor.id,
          clinicId,
          date: selectedDate,
          scheduleId: selectedScheduleId || undefined,
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not toggle pause state.');
    }
  };

  // Emergency Intercept Call
  const handleEmergencyCall = async () => {
    Alert.alert(
      'Emergency Intercept',
      'Do you want to prioritize an urgent patient consultation ahead of the token sequence?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyMutation.mutateAsync({
                doctorId: doctor.id,
                clinicId,
                date: selectedDate,
                scheduleId: selectedScheduleId || undefined,
              });
              Alert.alert('Emergency Alert', 'Emergency consultation call dispatched.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not trigger emergency call.');
            }
          },
        },
      ]
    );
  };

  // Delay Quick Notifier Handler
  const handleNotifyDelay = async (mins: number) => {
    Alert.alert(
      'Broadcast Delay Alert',
      `Notify all waiting patients that Dr. ${doctorName} is running ${mins} minutes late?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Notification',
          onPress: async () => {
            try {
              await delayMutation.mutateAsync({
                doctorId: doctor.id,
                clinicId,
                delayMinutes: mins,
              });
              Alert.alert('Delay Sent', `Waiting patients notified of ${mins} min delay.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not broadcast delay.');
            }
          },
        },
      ]
    );
  };

  // Handle Walk-in Lookup & Submission
  const handleWalkInLookup = async () => {
    if (walkInPhone.trim().length < 8) {
      Alert.alert('Search Phone', 'Please enter at least 8 digits.');
      return;
    }
    try {
      const res = await searchPatientMutation.mutateAsync(walkInPhone.trim());
      if (res && res.id) {
        setWalkInName(res.name || '');
        if (res.age) setWalkInAge(String(res.age));
        Alert.alert('Patient Found', `Loaded record for ${res.name || 'Patient'}.`);
      } else {
        Alert.alert('New Patient', 'No existing record found. Please enter name and age.');
      }
    } catch {
      Alert.alert('New Patient', 'Enter patient details.');
    }
  };

  const handleIssueWalkInToken = async () => {
    if (!walkInPhone.trim() || walkInPhone.trim().length < 8) {
      Alert.alert('Required', 'Please enter a valid patient contact number.');
      return;
    }
    if (!walkInName.trim()) {
      Alert.alert('Required', 'Please enter patient full name.');
      return;
    }

    try {
      const payload: any = {
        doctorId: doctor.id,
        clinicId,
        date: selectedDate,
        scheduleId: selectedScheduleId || undefined,
        bookingSource: 'WALK_IN',
        newPatient: {
          name: walkInName.trim(),
          phone: walkInPhone.trim(),
          age: walkInAge ? Number(walkInAge) : undefined,
          gender: walkInGender,
        },
      };

      const res = await bookWalkInMutation.mutateAsync(payload);
      const tokenNum = res?.token || res?.appointment?.token || 'Issued';

      Alert.alert(
        'Token Issued!',
        `Walk-in Token #${tokenNum} successfully issued for ${walkInName.trim()}. Added to today's queue.`,
        [
          {
            text: 'Done',
            onPress: () => {
              setShowWalkInModal(false);
              setWalkInPhone('');
              setWalkInName('');
              setWalkInAge('');
              refetchQueue();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not issue walk-in token.');
    }
  };

  // Filtered Tokens List
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      // Status filter
      if (tokenFilterStatus !== 'ALL') {
        if (tokenFilterStatus === 'WAITING' && t.status !== 'WAITING' && (t.status as string) !== 'CHECKED_IN') {
          return false;
        }
        if (tokenFilterStatus === 'IN_CONSULTATION' && (t.status as string) !== 'IN_CONSULTATION' && t.token !== currentTokenNumber) {
          return false;
        }
        if (tokenFilterStatus === 'COMPLETED' && t.status !== 'COMPLETED') {
          return false;
        }
        if (tokenFilterStatus === 'SKIPPED' && (t.status as string) !== 'SKIPPED' && t.status !== 'ABSENT') {
          return false;
        }
      }

      // Search query
      if (tokenSearchQuery.trim()) {
        const q = tokenSearchQuery.toLowerCase().trim();
        const pName = (t.patientName || '').toLowerCase();
        const tokStr = String(t.token);
        if (!pName.includes(q) && tokStr !== q) return false;
      }

      return true;
    });
  }, [tokens, tokenFilterStatus, tokenSearchQuery, currentTokenNumber]);

  const waitingCount = tokens.filter((t) => t.status === 'WAITING' || (t.status as string) === 'CHECKED_IN').length;
  const inConsultationCount = tokens.filter((t) => (t.status as string) === 'IN_CONSULTATION' || t.token === currentTokenNumber).length;
  const completedCount = tokens.filter((t) => t.status === 'COMPLETED').length;
  const skippedCount = tokens.filter((t) => (t.status as string) === 'SKIPPED' || t.status === 'ABSENT').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return { label: 'Waiting', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
      case 'CHECKED_IN':
        return { label: 'Checked In', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' };
      case 'IN_CONSULTATION':
        return { label: 'In Room', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' };
      case 'COMPLETED':
        return { label: 'Completed', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' };
      case 'ABSENT':
      case 'SKIPPED':
        return { label: 'Skipped', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: '#BE123C', bg: '#FFF1F2', border: '#FECDD3' };
      case 'PAUSED':
        return { label: 'Paused', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
      default:
        return { label: status, color: Colors.light.ink700, bg: Colors.light.surface100, border: Colors.light.surface200 };
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Quick Doctor Switcher Strip (1-tap switch across doctors) */}
      {doctors.length > 1 && onSelectDoctor && (
        <View style={styles.switcherSection}>
          <Text style={styles.switcherLabel}>SWITCH DOCTOR QUEUE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.switcherStrip}>
            {doctors.map((doc) => {
              const isCur = doc.id === doctor.id;
              const dName = doc.user?.name || 'Doctor';
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.switcherChip, isCur && styles.switcherChipActive]}
                  onPress={() => onSelectDoctor(doc)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="stethoscope"
                    size={11}
                    color={isCur ? '#FFFFFF' : Colors.light.primary}
                  />
                  <Text
                    style={[styles.switcherChipText, isCur && styles.switcherChipTextActive]}
                    numberOfLines={1}
                  >
                    Dr. {dName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 2. Top Navigation Bar */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Icon name="chevron-left" size={16} color={Colors.light.primary} />
          <Text style={styles.backBtnText}>All Doctor Queues</Text>
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.walkInBtnTop}
            onPress={() => setShowWalkInModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="user-plus" size={12} color="#FFFFFF" />
            <Text style={styles.walkInBtnTopText}>+ Walk-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetchQueue()}
            disabled={fetchingQueue}
            activeOpacity={0.7}
          >
            <Icon
              name="refresh-cw"
              size={13}
              color={fetchingQueue ? Colors.light.primary : Colors.light.ink600}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Doctor Info Hero Card */}
      <GradientCard variant="blue" style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.docRow}>
            <View style={styles.avatarWrap}>
              {doctorAvatar ? (
                <Image source={{ uri: getImageUrl(doctorAvatar) }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {doctorName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.docMeta}>
              <View style={styles.docNameTitleRow}>
                <Text style={styles.docName} numberOfLines={1}>
                  Dr. {doctorName}
                </Text>
                <View style={styles.livePracticeBadge}>
                  <View style={[styles.pulseDot, { backgroundColor: isPaused ? '#F59E0B' : '#10B981' }]} />
                  <Text style={styles.livePracticeText}>{isPaused ? 'Paused' : 'Live'}</Text>
                </View>
              </View>

              <Text style={styles.docSpec} numberOfLines={1}>
                {doctor.specialization || 'General Physician'}
              </Text>

              <View style={styles.kpiPillsRow}>
                <View style={styles.kpiMiniPill}>
                  <Text style={styles.kpiMiniVal}>{currentTokenNumber ? `#${currentTokenNumber}` : '--'}</Text>
                  <Text style={styles.kpiMiniLabel}>Serving</Text>
                </View>
                <View style={styles.kpiMiniPill}>
                  <Text style={[styles.kpiMiniVal, { color: '#B45309' }]}>{waitingCount}</Text>
                  <Text style={styles.kpiMiniLabel}>Waiting</Text>
                </View>
                <View style={styles.kpiMiniPill}>
                  <Text style={[styles.kpiMiniVal, { color: '#047857' }]}>{completedCount}</Text>
                  <Text style={styles.kpiMiniLabel}>Completed</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </GradientCard>

      {/* 4. Session / Schedule Slot Selector */}
      <View style={styles.sessionSection}>
        <View style={styles.sessionHeaderRow}>
          <Text style={styles.sectionLabel}>PRACTICE SESSION</Text>
          <TouchableOpacity onPress={() => setShowWalkInModal(true)} style={styles.inlineAddWalkIn}>
            <Icon name="plus" size={11} color={Colors.light.primary} />
            <Text style={styles.inlineAddWalkInText}>Add Walk-in Token</Text>
          </TouchableOpacity>
        </View>

        {loadingSchedules ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 8 }} />
        ) : schedules.length === 0 ? (
          <View style={styles.defaultSessionBanner}>
            <Icon name="info" size={13} color="#B45309" />
            <Text style={styles.defaultSessionText}>
              Standard daily walk-in queue active.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionStrip}>
            {schedules.map((slot) => {
              const isSelected = slot.id === selectedScheduleId;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.sessionPill, isSelected && styles.sessionPillActive]}
                  onPress={() => setSelectedScheduleId(slot.id)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="clock"
                    size={11}
                    color={isSelected ? '#FFFFFF' : Colors.light.ink700}
                  />
                  <Text style={[styles.sessionPillText, isSelected && styles.sessionPillTextActive]}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                  {slot.maxPatients ? (
                    <Text style={[styles.sessionPillCap, isSelected && styles.sessionPillCapActive]}>
                      ({slot.maxPatients} max)
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loadingQueue ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Synchronizing live queue...</Text>
        </View>
      ) : (
        <>
          {/* 5. Quick Queue Control Card (The Core Operational Tool) */}
          <GradientCard variant="indigo" style={styles.controlCard}>
            <View style={styles.controlContent}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlHeading}>LIVE QUEUE CONTROLLER</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        queueStatus === 'PAUSED'
                          ? '#FFFBEB'
                          : queueStatus === 'CLOSED'
                          ? '#FEF2F2'
                          : '#ECFDF5',
                      borderColor:
                        queueStatus === 'PAUSED'
                          ? '#FDE68A'
                          : queueStatus === 'CLOSED'
                          ? '#FECDD3'
                          : '#A7F3D0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          queueStatus === 'PAUSED'
                            ? '#D97706'
                            : queueStatus === 'CLOSED'
                            ? '#DC2626'
                            : '#047857',
                      },
                    ]}
                  >
                    {queueStatus}
                  </Text>
                </View>
              </View>

              {/* Big Now Serving Display */}
              <View style={styles.nowServingRow}>
                <View style={styles.tokenDisplay}>
                  <Text style={styles.tokenSub}>NOW SERVING</Text>
                  <Text style={styles.tokenNumber}>
                    {currentTokenNumber > 0 ? `#${currentTokenNumber < 10 ? '0' : ''}${currentTokenNumber}` : '--'}
                  </Text>
                </View>

                <View style={styles.lastIssuedDisplay}>
                  <Text style={styles.tokenSub}>LAST ISSUED</Text>
                  <Text style={styles.lastIssuedNumber}>
                    {lastTokenIssued > 0 ? `#${lastTokenIssued < 10 ? '0' : ''}${lastTokenIssued}` : '--'}
                  </Text>
                </View>

                <View style={styles.waitingDisplay}>
                  <Text style={styles.tokenSub}>IN QUEUE</Text>
                  <Text style={styles.waitingNumber}>{waitingCount}</Text>
                </View>
              </View>

              {/* Primary Call Controls */}
              <View style={styles.callControlsRow}>
                {/* Previous Token */}
                <TouchableOpacity
                  style={[styles.btn, styles.prevBtn]}
                  onPress={handlePrevious}
                  disabled={isBusy || isClosed || currentTokenNumber <= 1}
                  activeOpacity={0.8}
                >
                  <Icon name="skip-back" size={14} color={Colors.light.ink700} />
                  <Text style={styles.prevBtnText}>Previous</Text>
                </TouchableOpacity>

                {/* Next Token (Primary Action) */}
                <TouchableOpacity
                  style={[styles.btn, styles.nextBtn, isBusy && styles.btnDisabled]}
                  onPress={handleNext}
                  disabled={isBusy || isClosed}
                  activeOpacity={0.85}
                >
                  {nextMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.nextBtnText}>Call Next</Text>
                      <Icon name="chevron-right" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Secondary Controls (Skip, Recall, Pause, Emergency) */}
              <View style={styles.secondaryControlsRow}>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.skipBtn]}
                  onPress={handleSkip}
                  disabled={isBusy || isClosed || currentTokenNumber === 0}
                  activeOpacity={0.8}
                >
                  <Icon name="skip-forward" size={12} color="#D97706" />
                  <Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.recallBtn]}
                  onPress={handleRecall}
                  disabled={isBusy || isClosed || skippedCount === 0}
                  activeOpacity={0.8}
                >
                  <Icon name="rotate-ccw" size={12} color="#6D28D9" />
                  <Text style={styles.recallBtnText}>Recall ({skippedCount})</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.pauseBtn]}
                  onPress={handleTogglePause}
                  disabled={isBusy || isClosed}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={isPaused ? 'play' : 'pause'}
                    size={12}
                    color={isPaused ? '#047857' : '#DC2626'}
                  />
                  <Text
                    style={[
                      styles.pauseBtnText,
                      { color: isPaused ? '#047857' : '#DC2626' },
                    ]}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallBtn, styles.emergencyBtn]}
                  onPress={handleEmergencyCall}
                  disabled={isBusy || isClosed}
                  activeOpacity={0.8}
                >
                  <Icon name="alert-circle" size={12} color="#DC2626" />
                  <Text style={styles.emergencyBtnText}>Urgent</Text>
                </TouchableOpacity>
              </View>

              {/* Delay Notification Presets */}
              <View style={styles.delaySection}>
                <View style={styles.delayHeader}>
                  <Icon name="clock" size={11} color="#B45309" />
                  <Text style={styles.delayTitle}>BROADCAST RUNNING LATE ALERT</Text>
                </View>
                <View style={styles.delayPillsRow}>
                  {PRESET_DELAYS.map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={styles.delayPill}
                      onPress={() => handleNotifyDelay(mins)}
                      disabled={delayMutation.isPending}
                    >
                      <Text style={styles.delayPillText}>+{mins}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </GradientCard>

          {/* 6. Currently Serving Patient Card */}
          <GradientCard variant="green" style={styles.patientCard}>
            <View style={styles.patientContent}>
              <View style={styles.patientCardHeader}>
                <View style={styles.patientCardIconBox}>
                  <Icon name="user" size={14} color="#047857" />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.patientCardTitle}>Current Consultation</Text>
                  <Text style={styles.patientCardSub}>
                    {currentPatientToken ? `Serving Token #${currentTokenNumber}` : 'Room is ready for next patient'}
                  </Text>
                </View>
              </View>

              {currentPatientToken ? (
                <View style={styles.patientDetailsBox}>
                  <View style={styles.patientMainRow}>
                    <Text style={styles.patientName}>
                      {currentPatientToken.patientName || `Patient #${currentPatientToken.token}`}
                    </Text>

                    {currentPatientToken.patientPhone && (
                      <TouchableOpacity
                        style={styles.callPhoneBtn}
                        onPress={() => Linking.openURL(`tel:${currentPatientToken.patientPhone}`)}
                      >
                        <Icon name="phone" size={11} color="#047857" />
                        <Text style={styles.callPhoneBtnText}>Call Phone</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.patientMeta}>
                    {[
                      currentPatientToken.patientAge != null ? `${currentPatientToken.patientAge} years` : null,
                      currentPatientToken.patientGender || null,
                      currentPatientToken.bookedAt
                        ? `Booked at ${new Date(currentPatientToken.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
              ) : (
                <View style={styles.noPatientServingBox}>
                  <Text style={styles.noPatientServingText}>
                    No patient currently called into consultation room. Tap "Call Next" to proceed.
                  </Text>
                </View>
              )}

              {nextPatientToken && (
                <View style={styles.nextInLineBox}>
                  <Icon name="arrow-right" size={12} color={Colors.light.primary} />
                  <Text style={styles.nextInLineText}>
                    Next: <Text style={styles.boldText}>{nextPatientToken.patientName || `Token #${nextPatientToken.token}`}</Text> (#{nextPatientToken.token})
                  </Text>
                </View>
              )}
            </View>
          </GradientCard>

          {/* 7. Actionable Waiting Queue List */}
          <View style={styles.tokensSection}>
            <View style={styles.tokensHeader}>
              <View>
                <Text style={styles.tokensTitle}>Queue Tokens ({tokens.length})</Text>
                <Text style={styles.tokensSub}>Filter, search, and manage patient sequence</Text>
              </View>

              <TouchableOpacity
                style={styles.addWalkInSmallBtn}
                onPress={() => setShowWalkInModal(true)}
              >
                <Icon name="user-plus" size={12} color={Colors.light.primary} />
                <Text style={styles.addWalkInSmallBtnText}>+ Walk-in</Text>
              </TouchableOpacity>
            </View>

            {/* Token Search Bar */}
            <View style={styles.tokenSearchBar}>
              <Icon name="search" size={13} color={Colors.light.ink400} />
              <TextInput
                style={styles.tokenSearchInput}
                placeholder="Search token by patient name or #token..."
                value={tokenSearchQuery}
                onChangeText={setTokenSearchQuery}
                placeholderTextColor={Colors.light.ink400}
              />
              {tokenSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setTokenSearchQuery('')}>
                  <Icon name="x" size={12} color={Colors.light.ink400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenFilterStrip}>
              {(['ALL', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED'] as const).map((st) => {
                const isSel = tokenFilterStatus === st;
                const labels = {
                  ALL: `All (${tokens.length})`,
                  WAITING: `Waiting (${waitingCount})`,
                  IN_CONSULTATION: `In Room (${inConsultationCount})`,
                  COMPLETED: `Completed (${completedCount})`,
                  SKIPPED: `Skipped (${skippedCount})`,
                };
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.tokenFilterPill, isSel && styles.tokenFilterPillActive]}
                    onPress={() => setTokenFilterStatus(st)}
                  >
                    <Text style={[styles.tokenFilterPillText, isSel && styles.tokenFilterPillTextActive]}>
                      {labels[st]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Token Cards */}
            {filteredTokens.length === 0 ? (
              <View style={styles.emptyTokensBox}>
                <Icon name="users" size={24} color={Colors.light.ink400} />
                <Text style={styles.emptyTokensText}>No tokens match selected filter.</Text>
              </View>
            ) : (
              <View style={styles.tokensList}>
                {filteredTokens.map((tokenItem) => {
                  const isCur = tokenItem.token === currentTokenNumber;
                  const badge = getStatusBadge(tokenItem.status);

                  return (
                    <View
                      key={tokenItem.id || `tok-${tokenItem.token}`}
                      style={[styles.tokenRow, isCur && styles.tokenRowCurrent]}
                    >
                      <View style={[styles.tokenNumBox, isCur && styles.tokenNumBoxCurrent]}>
                        <Text style={[styles.tokenNumText, isCur && styles.tokenNumTextCurrent]}>
                          #{tokenItem.token}
                        </Text>
                      </View>

                      <View style={styles.tokenInfoCol}>
                        <View style={styles.tokenPatientHeader}>
                          <Text style={[styles.tokenPatientName, isCur && styles.boldText]} numberOfLines={1}>
                            {tokenItem.patientName || `Patient #${tokenItem.token}`}
                          </Text>

                          <View
                            style={[
                              styles.tokenStatusPill,
                              { backgroundColor: badge.bg, borderColor: badge.border },
                            ]}
                          >
                            <Text style={[styles.tokenStatusText, { color: badge.color }]}>
                              {badge.label}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.tokenSubText}>
                          {[
                            tokenItem.patientAge != null ? `${tokenItem.patientAge}y` : null,
                            tokenItem.patientGender || null,
                            tokenItem.bookedAt
                              ? new Date(tokenItem.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' • ') || 'Scheduled Token'}
                        </Text>

                        {/* Action Buttons for this token */}
                        <View style={styles.tokenRowActions}>
                          {tokenItem.patientPhone ? (
                            <TouchableOpacity
                              style={styles.tokenActionPhoneBtn}
                              onPress={() => Linking.openURL(`tel:${tokenItem.patientPhone}`)}
                            >
                              <Icon name="phone" size={10} color={Colors.light.primary} />
                              <Text style={styles.tokenActionPhoneText}>Call</Text>
                            </TouchableOpacity>
                          ) : null}

                          {tokenItem.token !== currentTokenNumber && tokenItem.status === 'WAITING' && (
                            <TouchableOpacity
                              style={styles.tokenActionCallBtn}
                              onPress={async () => {
                                try {
                                  await emergencyMutation.mutateAsync({
                                    doctorId: doctor.id,
                                    clinicId,
                                    date: selectedDate,
                                    scheduleId: selectedScheduleId || undefined,
                                    body: { patientId: tokenItem.id },
                                  });
                                } catch {}
                              }}
                            >
                              <Icon name="arrow-up-right" size={10} color="#FFFFFF" />
                              <Text style={styles.tokenActionCallText}>Call Now</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}

      {/* ========================================================
          WALK-IN PATIENT / ADD TO QUEUE MODAL
      ======================================================== */}
      <Modal
        visible={showWalkInModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWalkInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Issue Walk-in Token</Text>
                <Text style={styles.modalSub}>
                  Add arriving patient to Dr. {doctorName}'s live queue
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowWalkInModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalForm}>
                {/* Patient Phone Lookup */}
                <Text style={styles.inputLabel}>1. PATIENT MOBILE NUMBER *</Text>
                <View style={styles.lookupRow}>
                  <TextInput
                    style={[styles.textInput, styles.flex1]}
                    placeholder="e.g. 9876543210"
                    value={walkInPhone}
                    onChangeText={setWalkInPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.light.ink400}
                  />
                  <TouchableOpacity
                    style={styles.lookupBtn}
                    onPress={handleWalkInLookup}
                    disabled={searchPatientMutation.isPending}
                  >
                    {searchPatientMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.lookupBtnText}>Find</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Patient Name */}
                <Text style={styles.inputLabel}>2. PATIENT FULL NAME *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter full name"
                  value={walkInName}
                  onChangeText={setWalkInName}
                  placeholderTextColor={Colors.light.ink400}
                />

                {/* Age & Gender */}
                <View style={styles.twoInputsRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.inputLabel}>AGE (YEARS)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 35"
                      value={walkInAge}
                      onChangeText={setWalkInAge}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.ink400}
                    />
                  </View>

                  <View style={styles.flex1}>
                    <Text style={styles.inputLabel}>GENDER</Text>
                    <View style={styles.genderPillsRow}>
                      {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => {
                        const isSel = walkInGender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            style={[styles.genderPill, isSel && styles.genderPillActive]}
                            onPress={() => setWalkInGender(g)}
                          >
                            <Text style={[styles.genderPillText, isSel && styles.genderPillTextActive]}>
                              {g[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Issue Token Action */}
                <TouchableOpacity
                  style={styles.issueTokenBtn}
                  onPress={handleIssueWalkInToken}
                  disabled={bookWalkInMutation.isPending}
                  activeOpacity={0.88}
                >
                  {bookWalkInMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.issueTokenBtnText}>
                        Generate Token & Add to Queue
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  flex1: {
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  switcherSection: {
    gap: 4,
  },
  switcherLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.ink500,
    letterSpacing: 0.6,
  },
  switcherStrip: {
    flexDirection: 'row',
  },
  switcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginRight: 6,
  },
  switcherChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  switcherChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  switcherChipTextActive: {
    color: '#FFFFFF',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walkInBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  walkInBtnTopText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    marginBottom: 0,
  },
  heroContent: {
    padding: Spacing.four,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 50,
    height: 50,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docMeta: {
    flex: 1,
    gap: 2,
  },
  docNameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docName: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    flex: 1,
  },
  livePracticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  livePracticeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  docSpec: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  kpiPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  kpiMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  kpiMiniVal: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  kpiMiniLabel: {
    fontSize: 9,
    color: Colors.light.ink500,
    fontWeight: '600',
  },
  sessionSection: {
    gap: Spacing.one,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.ink500,
    letterSpacing: 0.6,
  },
  inlineAddWalkIn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inlineAddWalkInText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  defaultSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  defaultSessionText: {
    fontSize: 11,
    color: '#B45309',
    flex: 1,
  },
  sessionStrip: {
    flexDirection: 'row',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginRight: 6,
  },
  sessionPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  sessionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  sessionPillTextActive: {
    color: '#FFFFFF',
  },
  sessionPillCap: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  sessionPillCapActive: {
    color: 'rgba(255,255,255,0.85)',
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
  controlCard: {
    marginBottom: 0,
  },
  controlContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink500,
    letterSpacing: 0.6,
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  nowServingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  tokenDisplay: {
    alignItems: 'flex-start',
  },
  tokenSub: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.ink500,
    letterSpacing: 0.6,
  },
  tokenNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.light.primary,
    letterSpacing: -1,
  },
  lastIssuedDisplay: {
    alignItems: 'center',
  },
  lastIssuedNumber: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  waitingDisplay: {
    alignItems: 'flex-end',
  },
  waitingNumber: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: '800',
    color: '#B45309',
  },
  callControlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  prevBtn: {
    flex: 1,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  prevBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: Colors.light.primary,
    ...Shadows.sm,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  smallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  skipBtn: {},
  skipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  recallBtn: {},
  recallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  pauseBtn: {},
  pauseBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emergencyBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  emergencyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  delaySection: {
    backgroundColor: '#FFFBEB',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  delayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  delayTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  delayPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  delayPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  delayPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  patientCard: {
    marginBottom: 0,
  },
  patientContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  patientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientCardIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  patientCardSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  patientDetailsBox: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 4,
  },
  patientMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  callPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  callPhoneBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  patientMeta: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  noPatientServingBox: {
    padding: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  noPatientServingText: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  nextInLineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  nextInLineText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  tokensSection: {
    gap: Spacing.two,
  },
  tokensHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokensTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  tokensSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  addWalkInSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addWalkInSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  tokenSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 6,
  },
  tokenSearchInput: {
    flex: 1,
    fontSize: 11,
    color: Colors.light.ink900,
    padding: 0,
  },
  tokenFilterStrip: {
    flexDirection: 'row',
  },
  tokenFilterPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginRight: 6,
  },
  tokenFilterPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tokenFilterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  tokenFilterPillTextActive: {
    color: '#FFFFFF',
  },
  emptyTokensBox: {
    padding: Spacing.six,
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 4,
  },
  emptyTokensText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  tokensList: {
    gap: Spacing.two,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  tokenRowCurrent: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EFF6FF',
  },
  tokenNumBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenNumBoxCurrent: {
    backgroundColor: Colors.light.primary,
  },
  tokenNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink800,
  },
  tokenNumTextCurrent: {
    color: '#FFFFFF',
  },
  tokenInfoCol: {
    flex: 1,
    gap: 2,
  },
  tokenPatientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  tokenPatientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
    flex: 1,
  },
  tokenStatusPill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tokenStatusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tokenSubText: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  tokenRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  tokenActionPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
  },
  tokenActionPhoneText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  tokenActionCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
  },
  tokenActionCallText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Walk-in Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.six,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  modalSub: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalScroll: {
    padding: Spacing.four,
  },
  modalForm: {
    gap: Spacing.three,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink600,
    letterSpacing: 0.5,
  },
  lookupRow: {
    flexDirection: 'row',
    gap: 6,
  },
  textInput: {
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    fontSize: 12,
    color: Colors.light.ink900,
  },
  lookupBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  twoInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderPillsRow: {
    flexDirection: 'row',
    gap: 4,
    height: 38,
  },
  genderPill: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  genderPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  genderPillTextActive: {
    color: '#FFFFFF',
  },
  issueTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    marginTop: 8,
    ...Shadows.sm,
  },
  issueTokenBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
