import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  useClinicProfile,
  useClinicDoctors,
  useClinicAppointments,
  useCancelClinicAppointment,
  useUpdateAppointmentStatus,
} from '../hooks/useClinic';
import { useAppointmentRealtime } from '../hooks/useAppointmentRealtime';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { DropdownModal } from './DropdownModal';
import { DatePickerModal } from './DatePickerModal';
import type { Appointment, AppointmentStatus } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

const STATUS_OPTIONS: { key: AppointmentStatus | 'ALL'; label: string; color: string; bg: string }[] = [
  { key: 'ALL', label: 'All Statuses', color: Colors.light.ink700, bg: Colors.light.surface100 },
  { key: 'WAITING', label: 'Waiting', color: '#B45309', bg: '#FEF3C7' },
  { key: 'CHECKED_IN', label: 'Checked In', color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'IN_CONSULTATION', label: 'Consulting', color: '#6D28D9', bg: '#F5F3FF' },
  { key: 'COMPLETED', label: 'Completed', color: '#047857', bg: '#ECFDF5' },
  { key: 'CANCELLED', label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
  { key: 'ABSENT', label: 'Absent', color: '#4B5563', bg: '#F3F4F6' },
];

export function ClinicAppointmentsView() {
  const { isConnected } = useAppointmentRealtime();
  const { data: clinic } = useClinicProfile();
  const { data: doctors = [] } = useClinicDoctors();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter States
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [selectedDateMode, setSelectedDateMode] = useState<'today' | 'tomorrow' | 'custom' | 'all'>('today');
  const [customDate, setCustomDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown modal visibility
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Determine active date query filter
  const activeDateFilter = useMemo(() => {
    if (selectedDateMode === 'all') return undefined;
    if (selectedDateMode === 'today') return todayStr;
    if (selectedDateMode === 'tomorrow') return tomorrowStr;
    return customDate.trim() || undefined;
  }, [selectedDateMode, todayStr, tomorrowStr, customDate]);

  // Appointments Query
  const {
    data: appointments = [],
    isLoading: loadingAppointments,
    isFetching: fetchingAppointments,
    refetch: refetchAppointments,
  } = useClinicAppointments({
    doctorId: selectedDoctorFilter === 'ALL' ? undefined : selectedDoctorFilter,
    status: selectedStatusFilter === 'ALL' ? undefined : selectedStatusFilter,
    date: activeDateFilter,
  });

  // Action Mutations
  const cancelMutation = useCancelClinicAppointment();
  const statusMutation = useUpdateAppointmentStatus();

  // Status Action Handlers
  const handleCheckIn = async (appointmentId: string) => {
    try {
      await statusMutation.mutateAsync({ appointmentId, status: 'CHECKED_IN' });
      Alert.alert('Success', 'Patient checked in and ready for consultation.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to check in.');
    }
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      await statusMutation.mutateAsync({ appointmentId, status: 'IN_CONSULTATION' });
      Alert.alert('Success', 'Consultation started.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update consultation.');
    }
  };

  const handleMarkCompleted = async (appointmentId: string) => {
    try {
      await statusMutation.mutateAsync({ appointmentId, status: 'COMPLETED' });
      Alert.alert('Completed', 'Patient consultation marked as completed.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to complete visit.');
    }
  };

  const handleCancelAppointment = (appointmentId: string, patientNameDisplay: string) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel the appointment for ${patientNameDisplay}?`,
      [
        { text: 'No, Keep', style: 'cancel' },
        {
          text: 'Cancel Visit',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync({
                appointmentId,
                reason: 'Cancelled by clinic front desk',
              });
              Alert.alert('Cancelled', 'Appointment has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to cancel appointment.');
            }
          },
        },
      ]
    );
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase().trim();
    return appointments.filter((appt) => {
      const pName = (appt.patient?.user?.name || appt.patient?.name || '').toLowerCase();
      const pPhone = (appt.patient?.user?.phone || '').toLowerCase();
      const docName = (appt.doctor?.user?.name || '').toLowerCase();
      const tok = String(appt.token);
      return pName.includes(q) || pPhone.includes(q) || docName.includes(q) || tok === q;
    });
  }, [appointments, searchQuery]);

  // Appointment counts
  const totalCount = appointments.length;
  const waitingCount = appointments.filter((a) => a.status === 'WAITING' || a.status === 'CHECKED_IN').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;

  const getStatusDisplay = (status: AppointmentStatus) => {
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
        return { label: 'Absent', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', border: '#FECDD3' };
      default:
        return { label: status, color: Colors.light.ink700, bg: Colors.light.surface100, border: Colors.light.surface200 };
    }
  };

  const selectedDoctorLabel = useMemo(() => {
    if (selectedDoctorFilter === 'ALL') return 'All Doctors';
    const doc = doctors.find((d) => d.id === selectedDoctorFilter);
    return doc?.user?.name ? `Dr. ${doc.user.name}` : 'Doctor';
  }, [selectedDoctorFilter, doctors]);

  const selectedStatusLabel = useMemo(() => {
    if (selectedStatusFilter === 'ALL') return 'All Statuses';
    const found = STATUS_OPTIONS.find((f) => f.key === selectedStatusFilter);
    return found ? found.label : selectedStatusFilter;
  }, [selectedStatusFilter]);

  return (
    <View style={styles.container}>
      {/* 1. Header Banner */}
      <GradientCard variant="blue" style={styles.heroBanner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTopRow}>
            <View style={styles.flex1}>
              <Text style={styles.bannerHeading}>Clinic Appointments</Text>
              <Text style={styles.bannerSub}>
                All appointments across your clinic — filter by doctor, status, or date
              </Text>
            </View>

            <View style={styles.realtimeBadge}>
              <View
                style={[
                  styles.pulseDot,
                  { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text style={styles.realtimeText}>{isConnected ? 'Live' : 'Syncing'}</Text>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>{totalCount}</Text>
              <Text style={styles.kpiLabel}>Total</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiVal, { color: '#B45309' }]}>{waitingCount}</Text>
              <Text style={styles.kpiLabel}>Waiting</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiVal, { color: '#047857' }]}>{completedCount}</Text>
              <Text style={styles.kpiLabel}>Completed</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{cancelledCount}</Text>
              <Text style={styles.kpiLabel}>Cancelled</Text>
            </View>
          </View>
        </View>
      </GradientCard>

      {/* 2. Professional Filter Section */}
      <View style={styles.filterCard}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={15} color={Colors.light.ink400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name, phone, or token..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.ink400}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Icon name="x" size={13} color={Colors.light.ink400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown Filters Row (Doctor & Status) */}
        <View style={styles.dropdownsRow}>
          {/* Doctor Dropdown Trigger */}
          <TouchableOpacity
            style={[
              styles.dropdownTriggerBtn,
              selectedDoctorFilter !== 'ALL' && styles.dropdownTriggerBtnActive,
            ]}
            onPress={() => setShowDoctorDropdown(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerContent}>
              <Icon
                name="stethoscope"
                size={13}
                color={selectedDoctorFilter !== 'ALL' ? Colors.light.primary : Colors.light.ink500}
              />
              <Text
                style={[
                  styles.dropdownTriggerText,
                  selectedDoctorFilter !== 'ALL' && styles.dropdownTriggerTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedDoctorLabel}
              </Text>
            </View>
            <Icon name="chevron-down" size={13} color={Colors.light.ink400} />
          </TouchableOpacity>

          {/* Status Dropdown Trigger */}
          <TouchableOpacity
            style={[
              styles.dropdownTriggerBtn,
              selectedStatusFilter !== 'ALL' && styles.dropdownTriggerBtnActive,
            ]}
            onPress={() => setShowStatusDropdown(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownTriggerContent}>
              <Icon
                name="filter"
                size={13}
                color={selectedStatusFilter !== 'ALL' ? Colors.light.primary : Colors.light.ink500}
              />
              <Text
                style={[
                  styles.dropdownTriggerText,
                  selectedStatusFilter !== 'ALL' && styles.dropdownTriggerTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedStatusLabel}
              </Text>
            </View>
            <Icon name="chevron-down" size={13} color={Colors.light.ink400} />
          </TouchableOpacity>
        </View>

        {/* Date Selector Row */}
        <View style={styles.dateSelectorRow}>
          <TouchableOpacity
            style={[styles.datePill, selectedDateMode === 'today' && styles.datePillActive]}
            onPress={() => setSelectedDateMode('today')}
          >
            <Text style={[styles.datePillText, selectedDateMode === 'today' && styles.datePillTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.datePill, selectedDateMode === 'tomorrow' && styles.datePillActive]}
            onPress={() => setSelectedDateMode('tomorrow')}
          >
            <Text style={[styles.datePillText, selectedDateMode === 'tomorrow' && styles.datePillTextActive]}>
              Tomorrow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.datePill, selectedDateMode === 'custom' && styles.datePillActive]}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon
              name="calendar"
              size={12}
              color={selectedDateMode === 'custom' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text style={[styles.datePillText, selectedDateMode === 'custom' && styles.datePillTextActive]}>
              {selectedDateMode === 'custom' ? customDate : 'Calendar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.datePill, selectedDateMode === 'all' && styles.datePillActive]}
            onPress={() => setSelectedDateMode('all')}
          >
            <Text style={[styles.datePillText, selectedDateMode === 'all' && styles.datePillTextActive]}>
              All Dates
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Appointments List */}
      {loadingAppointments ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.centerStateText}>Loading appointments...</Text>
        </View>
      ) : filteredAppointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="calendar-x" size={32} color={Colors.light.ink400} />
          <Text style={styles.emptyTitle}>No Appointments Found</Text>
          <Text style={styles.emptySub}>
            No appointments match the selected filters or date range.
          </Text>
        </View>
      ) : (
        <View style={styles.appointmentsList}>
          {filteredAppointments.map((appt) => {
            const patientNameDisplay = appt.patient?.user?.name || appt.patient?.name || 'Patient';
            const patientPhoneDisplay = appt.patient?.user?.phone || '';
            const doctorNameDisplay = appt.doctor?.user?.name || 'Doctor';
            const statusStyle = getStatusDisplay(appt.status);

            return (
              <View key={appt.id} style={styles.appointmentCard}>
                {/* Top Row: Token & Status */}
                <View style={styles.cardTopRow}>
                  <View style={styles.tokenBadgeBox}>
                    <Text style={styles.tokenBadgeText}>#{appt.token}</Text>
                  </View>

                  <View style={styles.cardHeaderMeta}>
                    <Text style={styles.appointmentDateText}>
                      {new Date(appt.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    {appt.queue?.currentToken != null && (
                      <View style={styles.liveQueueIndicator}>
                        <View style={styles.liveQueueDot} />
                        <Text style={styles.liveQueueText}>
                          Serving #{appt.queue.currentToken}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: statusStyle.bg,
                        borderColor: statusStyle.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: statusStyle.color }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                {/* Patient Information */}
                <View style={styles.patientInfoBox}>
                  <View style={styles.patientNameRow}>
                    <Text style={styles.patientName} numberOfLines={1}>
                      {patientNameDisplay}
                    </Text>
                    {appt.bookingSource && (
                      <View style={styles.sourceTag}>
                        <Text style={styles.sourceTagText}>{appt.bookingSource}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.patientMetaRow}>
                    {[
                      appt.patient?.age ? `${appt.patient.age} yrs` : null,
                      appt.patient?.gender || null,
                    ]
                      .filter(Boolean)
                      .join(' • ') ? (
                      <Text style={styles.patientDemographics}>
                        {[
                          appt.patient?.age ? `${appt.patient.age} yrs` : null,
                          appt.patient?.gender || null,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                    ) : null}

                    {patientPhoneDisplay ? (
                      <TouchableOpacity
                        style={styles.phoneLinkBtn}
                        onPress={() => Linking.openURL(`tel:${patientPhoneDisplay}`)}
                      >
                        <Icon name="phone" size={11} color={Colors.light.primary} />
                        <Text style={styles.phoneLinkText}>{patientPhoneDisplay}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* Doctor Row */}
                <View style={styles.doctorInfoRow}>
                  <Icon name="stethoscope" size={13} color={Colors.light.primary} />
                  <Text style={styles.doctorNameText}>
                    Dr. {doctorNameDisplay}
                  </Text>
                  {appt.doctor?.specialization && (
                    <Text style={styles.doctorSpecText}>
                      ({appt.doctor.specialization})
                    </Text>
                  )}
                </View>

                {/* Quick Action Controls */}
                <View style={styles.cardActionsRow}>
                  {appt.status === 'WAITING' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.checkInBtn]}
                        onPress={() => handleCheckIn(appt.id)}
                      >
                        <Icon name="check-circle" size={13} color="#1D4ED8" />
                        <Text style={styles.checkInBtnText}>Check In</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.consultBtn]}
                        onPress={() => handleStartConsultation(appt.id)}
                      >
                        <Icon name="activity" size={13} color="#6D28D9" />
                        <Text style={styles.consultBtnText}>Call In</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {appt.status === 'CHECKED_IN' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.consultBtn]}
                      onPress={() => handleStartConsultation(appt.id)}
                    >
                      <Icon name="activity" size={13} color="#6D28D9" />
                      <Text style={styles.consultBtnText}>Start Visit</Text>
                    </TouchableOpacity>
                  )}

                  {(appt.status === 'CHECKED_IN' || appt.status === 'IN_CONSULTATION') && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.completeBtn]}
                      onPress={() => handleMarkCompleted(appt.id)}
                    >
                      <Icon name="check" size={13} color="#047857" />
                      <Text style={styles.completeBtnText}>Complete</Text>
                    </TouchableOpacity>
                  )}

                  {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => handleCancelAppointment(appt.id, patientNameDisplay)}
                    >
                      <Icon name="x" size={12} color="#DC2626" />
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Filter Modals */}
      <DropdownModal
        visible={showDoctorDropdown}
        onClose={() => setShowDoctorDropdown(false)}
        title="Filter by Doctor"
        options={[
          { label: 'All Doctors', value: 'ALL' },
          ...doctors.map((d) => ({
            label: `Dr. ${d.user?.name || 'Doctor'}${d.specialization ? ` (${d.specialization})` : ''}`,
            value: d.id,
          })),
        ]}
        selectedValue={selectedDoctorFilter}
        onSelect={(val) => {
          setSelectedDoctorFilter(val);
          setShowDoctorDropdown(false);
        }}
      />

      <DropdownModal
        visible={showStatusDropdown}
        onClose={() => setShowStatusDropdown(false)}
        title="Filter by Status"
        options={STATUS_OPTIONS.map((s) => ({
          label: s.label,
          value: s.key,
        }))}
        selectedValue={selectedStatusFilter}
        onSelect={(val) => {
          setSelectedStatusFilter(val as any);
          setShowStatusDropdown(false);
        }}
      />

      <DatePickerModal
        visible={showDatePicker}
        value={customDate}
        onSelect={(d: string) => {
          setCustomDate(d);
          setSelectedDateMode('custom');
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
        title="Select Appointment Date"
      />
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
  heroBanner: {
    marginBottom: 0,
  },
  bannerContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  bannerHeading: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  realtimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink500,
    marginTop: 1,
  },
  kpiDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.light.surface200,
  },
  filterCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.ink900,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  dropdownsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dropdownTriggerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  dropdownTriggerBtnActive: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EFF6FF',
  },
  dropdownTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dropdownTriggerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
    flex: 1,
  },
  dropdownTriggerTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 4,
  },
  datePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
  },
  datePillActive: {
    backgroundColor: Colors.light.primary,
  },
  datePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  datePillTextActive: {
    color: '#FFFFFF',
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
  emptyCard: {
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.six,
    borderRadius: Radius.xl,
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  emptySub: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  appointmentsList: {
    gap: Spacing.three,
  },
  appointmentCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  tokenBadgeBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tokenBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  cardHeaderMeta: {
    flex: 1,
    gap: 2,
  },
  appointmentDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  liveQueueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveQueueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveQueueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  patientInfoBox: {
    gap: 3,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
    flex: 1,
  },
  sourceTag: {
    backgroundColor: Colors.light.surface200,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  patientDemographics: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  phoneLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  phoneLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  doctorNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  doctorSpecText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface100,
    paddingTop: Spacing.two,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  checkInBtn: {
    backgroundColor: '#EFF6FF',
  },
  checkInBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  consultBtn: {
    backgroundColor: '#F5F3FF',
  },
  consultBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  completeBtn: {
    backgroundColor: '#ECFDF5',
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
