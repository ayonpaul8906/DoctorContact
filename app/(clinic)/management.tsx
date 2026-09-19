import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useDailyDashboard,
  useClinicDoctors,
  useWorkingHours,
  useSetWorkingHours,
  useHolidays,
  useAddHoliday,
  useRemoveHoliday,
  useClinicReceivedRequests,
  useClinicSentRequests,
  useRespondToDoctorRequest,
  useClinicProfile,
} from '../../hooks/useClinic';
import {
  useClinicFollowups,
  useScheduleFollowup,
  useCancelFollowup,
  useCompleteFollowup,
} from '../../hooks/useFollowups';
import { useSearchPatientByPhone } from '../../hooks/useDoctor';
import { useAppointmentRealtime } from '../../hooks/useAppointmentRealtime';
import {
  GradientCard,
  ClinicQueueCard,
  StatCard,
  Icon,
  ClinicLiveQueueManager,
  ClinicAppointmentsView,
  ClinicAddPatientFlow,
  TimePickerModal,
  DatePickerModal,
  DropdownModal,
} from '../../components';
import type { SentDoctorRequest, WorkingHour, FollowupStatus, ClinicDoctor } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';
import { getImageUrl } from '../../utils/image';

type ManagementSubTab = 'queue' | 'appointments' | 'schedule' | 'followups' | 'requests';

export default function ClinicManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<ManagementSubTab>('queue');

  useEffect(() => {
    if (
      params.tab &&
      ['queue', 'appointments', 'schedule', 'followups', 'requests'].includes(params.tab)
    ) {
      setActiveTab(params.tab as ManagementSubTab);
    }
  }, [params.tab]);

  const { isConnected } = useAppointmentRealtime();
  const { data: clinic } = useClinicProfile();
  const clinicId = clinic?.id;

  // 1. Queue & Appointments Queries
  const {
    data: dailyDashboard,
    isLoading: loadingDashboard,
    refetch: refetchDashboard,
    isRefetching: refetchingDashboard,
  } = useDailyDashboard();

  const {
    data: doctors = [],
    isLoading: loadingDoctors,
    refetch: refetchDoctors,
  } = useClinicDoctors();

  // 2. Schedule Queries
  const {
    data: workingHoursData = [],
    isLoading: loadingHours,
    refetch: refetchHours,
  } = useWorkingHours();

  const {
    data: holidays = [],
    isLoading: loadingHolidays,
    refetch: refetchHolidays,
  } = useHolidays();

  const setWorkingHoursMutation = useSetWorkingHours();
  const addHolidayMutation = useAddHoliday();
  const removeHolidayMutation = useRemoveHoliday();

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');

  useEffect(() => {
    if (workingHoursData.length > 0) {
      setWorkingHours(workingHoursData);
    }
  }, [workingHoursData]);

  // 3. Follow-ups Queries & State
  const [followupStatusFilter, setFollowupStatusFilter] = useState<'' | FollowupStatus>('');
  const {
    data: followups = [],
    isLoading: loadingFollowups,
    refetch: refetchFollowups,
    isRefetching: refetchingFollowups,
  } = useClinicFollowups(clinicId, followupStatusFilter ? { status: followupStatusFilter } : {});

  const scheduleFollowupMutation = useScheduleFollowup();
  const cancelFollowupMutation = useCancelFollowup();
  const completeFollowupMutation = useCompleteFollowup();
  const searchPatientMutation = useSearchPatientByPhone();

  const [showScheduleFollowupModal, setShowScheduleFollowupModal] = useState(false);
  const [patientPhone, setPatientPhone] = useState('');
  const [matchedPatient, setMatchedPatient] = useState<{ id: string; name: string } | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');
  const [showFollowupDoctorDropdown, setShowFollowupDoctorDropdown] = useState(false);
  const [showFollowupDatePicker, setShowFollowupDatePicker] = useState(false);
  const [pickingScheduleTime, setPickingScheduleTime] = useState<{ dayIndex: number; field: 'openTime' | 'closeTime' } | null>(null);
  const [showHolidayDatePicker, setShowHolidayDatePicker] = useState(false);

  // 4. Doctor Requests Queries & State
  const [requestsSubTab, setRequestsSubTab] = useState<'received' | 'sent'>('received');
  const [requestsStatusFilter, setRequestsStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');

  const {
    data: receivedRequests = [],
    isLoading: loadingReceived,
    refetch: refetchReceived,
  } = useClinicReceivedRequests();

  const {
    data: sentRequests = [],
    isLoading: loadingSent,
    refetch: refetchSent,
  } = useClinicSentRequests();

  const respondMutation = useRespondToDoctorRequest();

  const handleRefreshAll = () => {
    refetchDashboard();
    refetchDoctors();
    refetchHours();
    refetchHolidays();
    refetchFollowups();
    refetchReceived();
    refetchSent();
  };

  // Queue metrics
  const queueSummary = dailyDashboard?.queueSummary || [];
  const totalWaiting = queueSummary.reduce(
    (acc, curr) => acc + Math.max(0, (curr.lastTokenIssued || 0) - (curr.currentToken || 0)),
    0
  );
  const activeQueuesCount = queueSummary.filter((q) => q.status?.toUpperCase() === 'ACTIVE').length;

  // Appointments metrics
  const totalAppointments = dailyDashboard?.totalAppointments ?? 0;
  const totalPatients = dailyDashboard?.totalPatients ?? 0;
  const newPatients = dailyDashboard?.newPatients ?? 0;
  const returningPatients = dailyDashboard?.returningPatients ?? 0;
  const statusBreakdown = dailyDashboard?.statusBreakdown ?? {};
  const doctorWiseList = Object.entries(dailyDashboard?.doctorWise ?? {});

  // Schedule Handlers
  const handleToggleDayClosed = (index: number) => {
    setWorkingHours((prev) => {
      const next = [...prev];
      const curr = next[index];
      next[index] = {
        ...curr,
        isClosed: !curr.isClosed,
      };
      return next;
    });
  };

  const handleUpdateTime = (index: number, field: 'openTime' | 'closeTime', val: string) => {
    setWorkingHours((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSaveWorkingHours = async () => {
    try {
      const payload = workingHours.map((wh) => ({
        dayOfWeek: wh.dayOfWeek,
        isClosed: wh.isClosed,
        openTime: wh.isClosed ? null : wh.openTime || '09:00',
        closeTime: wh.isClosed ? null : wh.closeTime || '21:00',
      }));
      await setWorkingHoursMutation.mutateAsync(payload);
      Alert.alert('Saved', 'Weekly operating hours updated successfully.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save hours.');
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate.trim()) {
      Alert.alert('Required', 'Please enter holiday date (YYYY-MM-DD).');
      return;
    }
    try {
      await addHolidayMutation.mutateAsync({
        date: holidayDate.trim(),
        reason: holidayReason.trim() || undefined,
      });
      setShowAddHolidayModal(false);
      setHolidayDate('');
      setHolidayReason('');
      Alert.alert('Added', 'Clinic holiday registered.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add holiday.');
    }
  };

  const handleRemoveHoliday = (holidayId: string, date: string) => {
    Alert.alert('Remove Holiday', `Remove holiday on ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeHolidayMutation.mutateAsync(holidayId);
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove holiday.');
          }
        },
      },
    ]);
  };

  // Follow-up Handlers
  const handleLookupPatient = async () => {
    if (patientPhone.trim().length < 6) {
      Alert.alert('Search', 'Please enter a valid phone number.');
      return;
    }
    setMatchedPatient(null);
    try {
      const res = await searchPatientMutation.mutateAsync(patientPhone.trim());
      if (res && res.id) {
        setMatchedPatient({ id: res.id, name: res.name || 'Patient' });
      } else {
        Alert.alert('Not Found', 'No registered patient found with this phone number.');
      }
    } catch {
      Alert.alert('Search Failed', 'Could not search patient records.');
    }
  };

  const handleScheduleFollowup = async () => {
    if (!matchedPatient || !selectedDoctorId || !followupDate || !clinicId) {
      Alert.alert('Required', 'Patient, Doctor, and Follow-up date are required.');
      return;
    }
    try {
      await scheduleFollowupMutation.mutateAsync({
        patientId: matchedPatient.id,
        doctorId: selectedDoctorId,
        clinicId,
        followUpDate: followupDate.trim(),
        notes: followupNotes.trim() || undefined,
      });
      setShowScheduleFollowupModal(false);
      setPatientPhone('');
      setMatchedPatient(null);
      setSelectedDoctorId('');
      setFollowupDate('');
      setFollowupNotes('');
      Alert.alert('Scheduled', 'Follow-up scheduled — patient will be notified.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not schedule follow-up.');
    }
  };

  // Requests Handlers
  const currentRequestsList = requestsSubTab === 'received' ? receivedRequests : sentRequests;
  const filteredRequests = useMemo(() => {
    if (requestsStatusFilter === 'ALL') return currentRequestsList;
    return currentRequestsList.filter((r) => {
      const s = r.status?.toUpperCase();
      if (requestsStatusFilter === 'ACCEPTED') {
        return s === 'ACCEPTED' || s === 'APPROVED';
      }
      return s === requestsStatusFilter;
    });
  }, [currentRequestsList, requestsStatusFilter]);

  const handleRespondDoctorRequest = (associationId: string, action: 'ACCEPT' | 'REJECT', name: string) => {
    Alert.alert(
      action === 'ACCEPT' ? 'Accept Doctor' : 'Decline Request',
      `Are you sure you want to ${action.toLowerCase()} connection request from Dr. ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'ACCEPT' ? 'Accept' : 'Decline',
          style: action === 'ACCEPT' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await respondMutation.mutateAsync({ associationId, action });
              Alert.alert('Updated', 'Doctor association request updated.');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Action failed.');
            }
          },
        },
      ]
    );
  };

  const SUB_TABS: { key: ManagementSubTab; label: string; icon: any }[] = [
    { key: 'queue', label: 'Queue / Add Patient', icon: 'list-ordered' },
    { key: 'appointments', label: 'Appointments', icon: 'calendar' },
    { key: 'schedule', label: 'Schedule', icon: 'calendar-days' },
    { key: 'followups', label: 'Follow-ups', icon: 'calendar-clock' },
    { key: 'requests', label: 'Requests', icon: 'inbox' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Top Sub-Tab Navigation Bar */}
      <View style={styles.topNavContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabStrip}
        >
          {SUB_TABS.map((tab) => {
            const isSel = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.subTabPill, isSel && styles.subTabPillActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Icon
                  name={tab.icon}
                  size={14}
                  color={isSel ? '#FFFFFF' : Colors.light.ink600}
                />
                <Text style={[styles.subTabPillText, isSel && styles.subTabPillTextActive]}>
                  {tab.label}
                  {tab.key === 'requests' && receivedRequests.filter((r) => r.status === 'PENDING').length > 0
                    ? ` (${receivedRequests.filter((r) => r.status === 'PENDING').length})`
                    : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Sub-Tab Views */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refetchingDashboard || refetchingFollowups}
            onRefresh={handleRefreshAll}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* ========================================================
            SUB-TAB: QUEUE / ADD PATIENT
        ======================================================== */}
        {activeTab === 'queue' && (
          <View style={styles.tabSection}>
            <ClinicAddPatientFlow
              clinicId={clinicId || ''}
              doctors={doctors}
            />
          </View>
        )}

        {/* ========================================================
            SUB-TAB: APPOINTMENTS & CLINIC BOOKING
        ======================================================== */}
        {activeTab === 'appointments' && (
          <View style={styles.tabSection}>
            <ClinicAppointmentsView />
          </View>
        )}

        {/* ========================================================
            SUB-TAB: SCHEDULE & HOLIDAYS
        ======================================================== */}
        {activeTab === 'schedule' && (
          <View style={styles.tabSection}>
            <GradientCard variant="blue" style={styles.bannerCard}>
              <View style={styles.bannerContent}>
                <View style={styles.headerRow}>
                  <View style={styles.sectionIconBox}>
                    <Icon name="clock" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionHeading}>Weekly Operating Hours</Text>
                </View>

                <View style={styles.hoursList}>
                  {workingHours.map((wh, idx) => (
                    <View key={wh.dayOfWeek} style={styles.dayCard}>
                      <View style={styles.dayRow}>
                        <View>
                          <Text style={styles.dayName}>{wh.dayOfWeek}</Text>
                          <Text
                            style={[
                              styles.dayStatus,
                              { color: wh.isClosed ? '#BE123C' : '#047857' },
                            ]}
                          >
                            {wh.isClosed ? 'Closed All Day' : 'Open for Consultations'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.toggleBtn,
                            wh.isClosed ? styles.toggleClosed : styles.toggleOpen,
                          ]}
                          onPress={() => handleToggleDayClosed(idx)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.toggleBtnText,
                              wh.isClosed ? styles.toggleTextClosed : styles.toggleTextOpen,
                            ]}
                          >
                            {wh.isClosed ? 'Mark Open' : 'Mark Closed'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!wh.isClosed && (
                        <View style={styles.timeInputsRow}>
                          <View style={styles.timeCol}>
                            <Text style={styles.timeLabel}>Open Time</Text>
                            <TouchableOpacity
                              style={styles.timePickerTrigger}
                              onPress={() => setPickingScheduleTime({ dayIndex: idx, field: 'openTime' })}
                              activeOpacity={0.7}
                            >
                              <Icon name="clock" size={12} color={Colors.light.ink600} />
                              <Text style={styles.timePickerTriggerText}>{wh.openTime || '09:00'}</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.timeSeparator}>to</Text>
                          <View style={styles.timeCol}>
                            <Text style={styles.timeLabel}>Close Time</Text>
                            <TouchableOpacity
                              style={styles.timePickerTrigger}
                              onPress={() => setPickingScheduleTime({ dayIndex: idx, field: 'closeTime' })}
                              activeOpacity={0.7}
                            >
                              <Icon name="clock" size={12} color={Colors.light.ink600} />
                              <Text style={styles.timePickerTriggerText}>{wh.closeTime || '21:00'}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.saveHoursBtn}
                  onPress={handleSaveWorkingHours}
                  disabled={setWorkingHoursMutation.isPending}
                  activeOpacity={0.85}
                >
                  {setWorkingHoursMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="save" size={14} color="#FFFFFF" />
                      <Text style={styles.saveHoursBtnText}>Save Working Hours</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </GradientCard>

            {/* Scheduled Holidays */}
            <GradientCard variant="green" style={styles.bannerCard}>
              <View style={styles.bannerContent}>
                <View style={styles.headerRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#10B981' }]}>
                    <Icon name="calendar-days" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.sectionHeading}>Scheduled Holidays</Text>
                    <Text style={styles.bannerSubtitle}>{holidays.length} Registered dates</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addHolidayBtn}
                    onPress={() => setShowAddHolidayModal(true)}
                    activeOpacity={0.85}
                  >
                    <Icon name="plus" size={12} color="#FFFFFF" />
                    <Text style={styles.addHolidayBtnText}>Add Holiday</Text>
                  </TouchableOpacity>
                </View>

                {holidays.length === 0 ? (
                  <Text style={styles.emptySubtitle}>No upcoming holidays scheduled.</Text>
                ) : (
                  <View style={styles.holidaysList}>
                    {holidays.map((h) => (
                      <View key={h.id} style={styles.holidayRow}>
                        <View style={styles.flex1}>
                          <Text style={styles.holidayDate}>{h.date}</Text>
                          <Text style={styles.holidayReason}>{h.reason || 'General Holiday'}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveHoliday(h.id, h.date)}
                          style={styles.trashBtn}
                        >
                          <Icon name="trash-2" size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </GradientCard>
          </View>
        )}

        {/* ========================================================
            SUB-TAB: FOLLOW-UPS
        ======================================================== */}
        {activeTab === 'followups' && (
          <View style={styles.tabSection}>
            <GradientCard variant="indigo" style={styles.bannerCard}>
              <View style={styles.bannerContent}>
                <View style={styles.headerRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#4F46E5' }]}>
                    <Icon name="calendar-clock" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.bannerTitle}>Patient Follow-ups</Text>
                    <Text style={styles.bannerSubtitle}>
                      Auto-notify patients when their follow-up date arrives
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#4F46E5' }]}
                    onPress={() => setShowScheduleFollowupModal(true)}
                    activeOpacity={0.85}
                  >
                    <Icon name="plus" size={13} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GradientCard>

            {/* Status Filter Pills */}
            <View style={styles.statusPillsRow}>
              {(['', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map((st) => {
                const isSel = followupStatusFilter === st;
                return (
                  <TouchableOpacity
                    key={st || 'ALL'}
                    style={[styles.statusPill, isSel && styles.statusPillActive]}
                    onPress={() => setFollowupStatusFilter(st)}
                  >
                    <Text style={[styles.statusPillText, isSel && styles.statusPillTextActive]}>
                      {st || 'All'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loadingFollowups ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.centerStateText}>Loading patient follow-ups...</Text>
              </View>
            ) : followups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="calendar-clock" size={32} color={Colors.light.ink400} />
                <Text style={styles.emptyTitle}>No Follow-ups Found</Text>
                <Text style={styles.emptySubtitle}>
                  Schedule follow-ups for patients to automatically remind them when their visit date arrives.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#4F46E5', marginTop: 10 }]}
                  onPress={() => setShowScheduleFollowupModal(true)}
                >
                  <Icon name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Schedule First Follow-up</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.followupList}>
                {followups.map((f) => {
                  const patName = f.patient?.user?.name || f.patient?.name || 'Patient';
                  const patPhone = f.patient?.user?.phone || f.patient?.phone || 'N/A';
                  const docName = f.doctor?.user?.name || 'Doctor';
                  const isScheduled = f.status === 'SCHEDULED';
                  const isCompleted = f.status === 'COMPLETED';

                  return (
                    <GradientCard
                      key={f.id}
                      variant={isScheduled ? 'blue' : isCompleted ? 'green' : 'pink'}
                      style={styles.followupCard}
                    >
                      <View style={styles.followupCardContent}>
                        <View style={styles.headerRow}>
                          <View style={styles.flex1}>
                            <Text style={styles.patientName}>{patName}</Text>
                            <Text style={styles.patientPhone}>{patPhone}</Text>
                          </View>

                          <View
                            style={[
                              styles.badge,
                              {
                                backgroundColor: isScheduled
                                  ? '#EFF6FF'
                                  : isCompleted
                                  ? '#ECFDF5'
                                  : '#FEF2F2',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                {
                                  color: isScheduled
                                    ? Colors.light.primary
                                    : isCompleted
                                    ? '#047857'
                                    : '#BE123C',
                                },
                              ]}
                            >
                              {f.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.followupMetaRow}>
                          <View style={styles.metaItem}>
                            <Icon name="stethoscope" size={12} color={Colors.light.primary} />
                            <Text style={styles.metaVal}>Dr. {docName}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Icon name="calendar" size={12} color={Colors.light.primary} />
                            <Text style={styles.metaVal}>{f.followUpDate}</Text>
                          </View>
                        </View>

                        {f.notes && <Text style={styles.notesText}>Note: {f.notes}</Text>}

                        {isScheduled && (
                          <View style={styles.followupActionsRow}>
                            <TouchableOpacity
                              style={styles.cancelActionBtn}
                              onPress={() => completeFollowupMutation.mutate(f.id)}
                              disabled={completeFollowupMutation.isPending}
                            >
                              <Icon name="check" size={13} color="#047857" />
                              <Text style={styles.completeActionText}>Complete</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.cancelActionBtn}
                              onPress={() => cancelFollowupMutation.mutate(f.id)}
                              disabled={cancelFollowupMutation.isPending}
                            >
                              <Icon name="x" size={13} color="#DC2626" />
                              <Text style={styles.cancelActionText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </GradientCard>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ========================================================
            SUB-TAB: DOCTOR REQUESTS
        ======================================================== */}
        {activeTab === 'requests' && (
          <View style={styles.tabSection}>
            <View style={styles.requestsToggleRow}>
              <TouchableOpacity
                style={[styles.reqToggleBtn, requestsSubTab === 'received' && styles.reqToggleBtnActive]}
                onPress={() => setRequestsSubTab('received')}
              >
                <Text
                  style={[
                    styles.reqToggleText,
                    requestsSubTab === 'received' && styles.reqToggleTextActive,
                  ]}
                >
                  Incoming ({receivedRequests.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reqToggleBtn, requestsSubTab === 'sent' && styles.reqToggleBtnActive]}
                onPress={() => setRequestsSubTab('sent')}
              >
                <Text
                  style={[
                    styles.reqToggleText,
                    requestsSubTab === 'sent' && styles.reqToggleTextActive,
                  ]}
                >
                  Sent Requests ({sentRequests.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter pills */}
            <View style={styles.statusPillsRow}>
              {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((st) => {
                const isSel = requestsStatusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusPill, isSel && styles.statusPillActive]}
                    onPress={() => setRequestsStatusFilter(st)}
                  >
                    <Text style={[styles.statusPillText, isSel && styles.statusPillTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loadingReceived || loadingSent ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.centerStateText}>Loading connection requests...</Text>
              </View>
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={32} color={Colors.light.ink400} />
                <Text style={styles.emptyTitle}>No Requests</Text>
                <Text style={styles.emptySubtitle}>No doctor connection requests matching filter.</Text>
              </View>
            ) : (
              <View style={styles.followupList}>
                {filteredRequests.map((item) => {
                  const rawName = item.doctor?.user?.name || 'Doctor';
                  const docName = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`;
                  const isPending = item.status?.toUpperCase() === 'PENDING';
                  const isAccepted =
                    item.status?.toUpperCase() === 'ACCEPTED' ||
                    item.status?.toUpperCase() === 'APPROVED';

                  return (
                    <GradientCard
                      key={item.id}
                      variant={isPending ? 'blue' : isAccepted ? 'green' : 'pink'}
                      style={styles.followupCard}
                    >
                      <View style={styles.followupCardContent}>
                        <View style={styles.headerRow}>
                          <View style={styles.flex1}>
                            <Text style={styles.patientName}>{docName}</Text>
                            <Text style={styles.patientPhone}>
                              {item.doctor?.user?.email || 'Registered Doctor'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.badge,
                              {
                                backgroundColor: isAccepted
                                  ? '#ECFDF5'
                                  : isPending
                                  ? '#FEF3C7'
                                  : '#FEF2F2',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                {
                                  color: isAccepted
                                    ? '#047857'
                                    : isPending
                                    ? '#B45309'
                                    : '#DC2626',
                                },
                              ]}
                            >
                              {item.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.followupMetaRow}>
                          <View style={styles.metaItem}>
                            <Icon name="calendar-days" size={12} color={Colors.light.primary} />
                            <Text style={styles.metaVal}>{item.dayOfWeek || 'All Days'}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Icon name="clock" size={12} color={Colors.light.primary} />
                            <Text style={styles.metaVal}>
                              {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : 'General'}
                            </Text>
                          </View>
                          {item.fee != null && (
                            <View style={styles.metaItem}>
                              <Text style={styles.metaVal}>Fee: ₹{item.fee}</Text>
                            </View>
                          )}
                        </View>

                        {requestsSubTab === 'received' && isPending && (
                          <View style={styles.followupActionsRow}>
                            <TouchableOpacity
                              style={styles.cancelActionBtn}
                              onPress={() => handleRespondDoctorRequest(item.id, 'ACCEPT', rawName)}
                              disabled={respondMutation.isPending}
                            >
                              <Icon name="check" size={13} color="#047857" />
                              <Text style={styles.completeActionText}>Accept Doctor</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.cancelActionBtn}
                              onPress={() => handleRespondDoctorRequest(item.id, 'REJECT', rawName)}
                              disabled={respondMutation.isPending}
                            >
                              <Icon name="x" size={13} color="#DC2626" />
                              <Text style={styles.cancelActionText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </GradientCard>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Schedule Followup Modal */}
      <Modal
        visible={showScheduleFollowupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleFollowupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Patient Follow-up</Text>
              <TouchableOpacity onPress={() => setShowScheduleFollowupModal(false)} style={styles.closeBtn}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* 1. Patient lookup */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>1. Patient Mobile Number *</Text>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={patientPhone}
                      onChangeText={(t) => setPatientPhone(t.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit phone"
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholderTextColor={Colors.light.ink400}
                    />
                    <TouchableOpacity
                      style={styles.lookupBtn}
                      onPress={handleLookupPatient}
                      disabled={searchPatientMutation.isPending}
                    >
                      {searchPatientMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.lookupBtnText}>Find</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {matchedPatient && (
                    <View style={styles.patientMatchBox}>
                      <Icon name="check-circle" size={14} color="#047857" />
                      <Text style={styles.patientMatchText}>Patient: {matchedPatient.name}</Text>
                    </View>
                  )}
                </View>

                {/* 2. Doctor selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>2. Select Doctor *</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowFollowupDoctorDropdown(true)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Icon name="stethoscope" size={14} color={Colors.light.primary} />
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          !selectedDoctorId && { color: Colors.light.ink400 },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedDoctorId
                          ? `Dr. ${doctors.find((d) => d.id === selectedDoctorId)?.user?.name || 'Doctor'}`
                          : 'Choose Doctor'}
                      </Text>
                    </View>
                    <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                  </TouchableOpacity>
                </View>

                {/* 3. Followup date */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>3. Follow-up Date *</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowFollowupDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Icon name="calendar" size={14} color={Colors.light.primary} />
                      <Text
                        style={[
                          styles.dropdownTriggerText,
                          !followupDate && { color: Colors.light.ink400 },
                        ]}
                      >
                        {followupDate || 'Select Date from Calendar'}
                      </Text>
                    </View>
                    <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                  </TouchableOpacity>
                </View>

                {/* 4. Clinical notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Clinical Notes (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={followupNotes}
                    onChangeText={setFollowupNotes}
                    placeholder="e.g. review blood glucose & CBC"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: '#4F46E5' }]}
                  onPress={handleScheduleFollowup}
                  disabled={scheduleFollowupMutation.isPending}
                  activeOpacity={0.85}
                >
                  {scheduleFollowupMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Confirm Follow-up</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal
        visible={showAddHolidayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddHolidayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Clinic Holiday</Text>
              <TouchableOpacity onPress={() => setShowAddHolidayModal(false)} style={styles.closeBtn}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Holiday Date *</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setShowHolidayDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Icon name="calendar" size={14} color={Colors.light.primary} />
                    <Text
                      style={[
                        styles.dropdownTriggerText,
                        !holidayDate && { color: Colors.light.ink400 },
                      ]}
                    >
                      {holidayDate || 'Select Date from Calendar'}
                    </Text>
                  </View>
                  <Icon name="chevron-down" size={14} color={Colors.light.ink400} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reason / Festival</Text>
                <TextInput
                  style={styles.formInput}
                  value={holidayReason}
                  onChangeText={setHolidayReason}
                  placeholder="e.g. Gandhi Jayanti"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#10B981' }]}
                onPress={handleAddHoliday}
                disabled={addHolidayMutation.isPending}
                activeOpacity={0.85}
              >
                {addHolidayMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm Holiday</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pickers & Modals */}
      <TimePickerModal
        visible={!!pickingScheduleTime}
        value={
          pickingScheduleTime
            ? (workingHours[pickingScheduleTime.dayIndex]?.[pickingScheduleTime.field] || '09:00')
            : '09:00'
        }
        onSelect={(val: string) => {
          if (pickingScheduleTime) {
            handleUpdateTime(pickingScheduleTime.dayIndex, pickingScheduleTime.field, val);
          }
          setPickingScheduleTime(null);
        }}
        onClose={() => setPickingScheduleTime(null)}
        title={pickingScheduleTime?.field === 'openTime' ? 'Select Open Time' : 'Select Close Time'}
      />

      <DatePickerModal
        visible={showHolidayDatePicker}
        value={holidayDate}
        onSelect={(date: string) => {
          setHolidayDate(date);
          setShowHolidayDatePicker(false);
        }}
        onClose={() => setShowHolidayDatePicker(false)}
        title="Select Holiday Date"
      />

      <DatePickerModal
        visible={showFollowupDatePicker}
        value={followupDate}
        onSelect={(date: string) => {
          setFollowupDate(date);
          setShowFollowupDatePicker(false);
        }}
        onClose={() => setShowFollowupDatePicker(false)}
        title="Select Follow-up Date"
      />

      <DropdownModal
        visible={showFollowupDoctorDropdown}
        onClose={() => setShowFollowupDoctorDropdown(false)}
        title="Select Doctor"
        options={doctors.map((d) => ({
          label: `Dr. ${d.user?.name || 'Doctor'} (${d.specialization || 'General'})`,
          value: d.id,
        }))}
        selectedValue={selectedDoctorId}
        onSelect={(val) => {
          setSelectedDoctorId(val);
          setShowFollowupDoctorDropdown(false);
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
  topNavContainer: {
    backgroundColor: Colors.light.surfaceWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingVertical: 6,
  },
  subTabStrip: {
    paddingHorizontal: Spacing.four,
    gap: 6,
    alignItems: 'center',
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
  },
  subTabPillActive: {
    backgroundColor: Colors.light.primary,
  },
  subTabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  subTabPillTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  tabSection: {
    gap: Spacing.three,
  },
  bannerCard: {
    marginBottom: 0,
  },
  bannerContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  realtimeText: {
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
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
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
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.six,
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
  },
  listContainer: {
    gap: Spacing.two,
  },
  twoColsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statusBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  statusVal: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
  },
  doctorWiseList: {
    gap: Spacing.two,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  docSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  pillBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hoursList: {
    gap: Spacing.two,
  },
  dayCard: {
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  dayStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  toggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  toggleOpen: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleClosed: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleTextOpen: {
    color: '#DC2626',
  },
  toggleTextClosed: {
    color: '#047857',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
  },
  timeCol: {
    flex: 1,
    gap: 2,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.surface300,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
    textAlign: 'center',
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.surface300,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 7,
  },
  timePickerTriggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  dropdownTriggerText: {
    fontSize: 13,
    color: Colors.light.ink900,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink400,
    marginTop: 14,
  },
  saveHoursBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  saveHoursBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addHolidayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  addHolidayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  holidaysList: {
    gap: Spacing.two,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  holidayDate: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  holidayReason: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
  trashBtn: {
    padding: 6,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  primaryActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
  },
  statusPillActive: {
    backgroundColor: Colors.light.primary,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  followupList: {
    gap: Spacing.two,
  },
  followupCard: {
    marginBottom: 0,
  },
  followupCardContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  patientPhone: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  followupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  notesText: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontStyle: 'italic',
  },
  followupActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    paddingTop: 4,
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
  },
  completeActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  cancelActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  requestsToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface100,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
  },
  reqToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  reqToggleBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  reqToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  reqToggleTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.five,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  closeBtn: {
    padding: 4,
  },
  scrollForm: {
    marginTop: Spacing.two,
  },
  formContainer: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    paddingTop: Spacing.two,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  lookupBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  patientMatchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  patientMatchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  docPickerStrip: {
    flexDirection: 'row',
  },
  docPickerPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    marginRight: 6,
  },
  docPickerPillActive: {
    backgroundColor: Colors.light.primary,
  },
  docPickerPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  docPickerPillTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginBottom: Spacing.two,
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
  queueSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface100,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 3,
    marginBottom: Spacing.two,
  },
  queueSwitcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  queueSwitcherBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  queueSwitcherText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  queueSwitcherTextActive: {
    color: '#FFFFFF',
  },
});
