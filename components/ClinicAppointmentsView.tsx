import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
  Linking,
} from 'react-native';
import {
  useClinicProfile,
  useClinicDoctors,
  useClinicAppointments,
  useBookReceptionAppointment,
  useCancelClinicAppointment,
  useUpdateAppointmentStatus,
} from '../hooks/useClinic';
import { useDoctorSchedules } from '../hooks/useDoctorSearch';
import { useSearchPatientByPhone } from '../hooks/useDoctor';
import { useAppointmentRealtime } from '../hooks/useAppointmentRealtime';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { StatCard } from './StatCard';
import type { ClinicDoctor, Appointment, AppointmentStatus } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';

const STATUS_FILTERS: { key: AppointmentStatus | 'ALL'; label: string; color: string; bg: string }[] = [
  { key: 'ALL', label: 'All', color: Colors.light.ink700, bg: Colors.light.surface100 },
  { key: 'WAITING', label: 'Waiting', color: '#B45309', bg: '#FEF3C7' },
  { key: 'CHECKED_IN', label: 'Checked In', color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'IN_CONSULTATION', label: 'Consulting', color: '#6D28D9', bg: '#F5F3FF' },
  { key: 'COMPLETED', label: 'Completed', color: '#047857', bg: '#ECFDF5' },
  { key: 'CANCELLED', label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
];

export function ClinicAppointmentsView() {
  const { isConnected } = useAppointmentRealtime();
  const { data: clinic } = useClinicProfile();
  const clinicId = clinic?.id;
  const { data: doctors = [], isLoading: loadingDoctors } = useClinicDoctors();

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
  const searchPatientMutation = useSearchPatientByPhone();
  const bookAppointmentMutation = useBookReceptionAppointment();

  // Booking Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStage, setBookingStage] = useState<1 | 2>(1); // 1: Doctor selection, 2: Slot & Patient details
  const [bookingDoctor, setBookingDoctor] = useState<ClinicDoctor | null>(null);
  const [bookingDateMode, setBookingDateMode] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [bookingCustomDate, setBookingCustomDate] = useState(todayStr);
  const [bookingScheduleId, setBookingScheduleId] = useState<string>('');
  const [bookingSource, setBookingSource] = useState<'WALK_IN' | 'RECEPTION' | 'PHONE'>('WALK_IN');

  // Patient inputs
  const [phoneInput, setPhoneInput] = useState('');
  const [patientLookupResult, setPatientLookupResult] = useState<{ id: string; name: string; age?: number | null } | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');

  const activeBookingDate = useMemo(() => {
    if (bookingDateMode === 'today') return todayStr;
    if (bookingDateMode === 'tomorrow') return tomorrowStr;
    return bookingCustomDate.trim() || todayStr;
  }, [bookingDateMode, todayStr, tomorrowStr, bookingCustomDate]);

  // Fetch Schedules for selected booking doctor and date
  const { data: schedules = [], isLoading: loadingSchedules } = useDoctorSchedules(
    bookingDoctor?.id,
    clinicId,
    activeBookingDate
  );

  // Auto-select first schedule
  React.useEffect(() => {
    if (schedules.length > 0 && !bookingScheduleId) {
      setBookingScheduleId(schedules[0].id);
    }
  }, [schedules, bookingScheduleId]);

  // Patient Lookup Handler
  const handleLookupPatient = async () => {
    const q = phoneInput.trim();
    if (q.length < 8) {
      Alert.alert('Search Phone', 'Please enter at least 8 digits of the patient mobile number.');
      return;
    }
    try {
      const res = await searchPatientMutation.mutateAsync(q);
      if (res && res.id) {
        const foundName = res.name || 'Patient';
        setPatientLookupResult({ id: res.id, name: foundName, age: res.age });
        setPatientName(foundName);
        if (res.age) setPatientAge(String(res.age));
        setIsNewPatient(false);
      } else {
        setPatientLookupResult(null);
        setIsNewPatient(true);
        Alert.alert('New Patient', 'No existing record found for this number. Please fill in patient details.');
      }
    } catch {
      setPatientLookupResult(null);
      setIsNewPatient(true);
      Alert.alert('New Patient', 'No existing record found. Please enter patient information.');
    }
  };

  // Submit Appointment Booking
  const handleConfirmBooking = async () => {
    if (!bookingDoctor || !clinicId) {
      Alert.alert('Required', 'Please select a doctor.');
      return;
    }
    if (!phoneInput.trim() || phoneInput.trim().length < 8) {
      Alert.alert('Required', 'Please enter a valid patient contact number.');
      return;
    }
    if (!patientName.trim()) {
      Alert.alert('Required', 'Please enter patient full name.');
      return;
    }

    try {
      const payload: any = {
        doctorId: bookingDoctor.id,
        clinicId,
        date: activeBookingDate,
        scheduleId: bookingScheduleId || undefined,
        bookingSource,
      };

      if (patientLookupResult?.id && !isNewPatient) {
        payload.patientId = patientLookupResult.id;
      } else {
        payload.newPatient = {
          name: patientName.trim(),
          phone: phoneInput.trim(),
          age: patientAge ? Number(patientAge) : undefined,
          gender: patientGender,
        };
      }

      const res = await bookAppointmentMutation.mutateAsync(payload);
      const tokenNum = res?.token || res?.appointment?.token || 'Confirmed';

      Alert.alert(
        'Appointment Booked!',
        `Token #${tokenNum} successfully issued for ${patientName} with Dr. ${bookingDoctor.user?.name || 'Doctor'} on ${activeBookingDate}.`,
        [
          {
            text: 'Great',
            onPress: () => {
              resetBookingForm();
              refetchAppointments();
            },
          },
        ]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to book appointment.';
      Alert.alert('Booking Error', msg);
    }
  };

  const resetBookingForm = () => {
    setShowBookingModal(false);
    setBookingStage(1);
    setBookingDoctor(null);
    setPhoneInput('');
    setPatientLookupResult(null);
    setIsNewPatient(false);
    setPatientName('');
    setPatientAge('');
    setBookingScheduleId('');
  };

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

  return (
    <View style={styles.container}>
      {/* 1. Header Banner & Actions */}
      <GradientCard variant="blue" style={styles.heroBanner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTopRow}>
            <View style={styles.flex1}>
              <Text style={styles.bannerHeading}>Clinic Appointments</Text>
              <Text style={styles.bannerSub}>
                Manage patient visits, check-ins, and schedule new bookings
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

          {/* Primary Book Appointment Action */}
          <TouchableOpacity
            style={styles.bookAppointmentBtn}
            onPress={() => setShowBookingModal(true)}
            activeOpacity={0.88}
          >
            <View style={styles.bookBtnIconBox}>
              <Icon name="calendar-plus" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.bookBtnText}>+ Book New Appointment</Text>
              <Text style={styles.bookBtnSub}>Choose doctor & register patient / walk-in</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </GradientCard>

      {/* 2. Interactive Filter Controls */}
      <View style={styles.filterSection}>
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

        {/* Date Mode Selector */}
        <View style={styles.dateFilterRow}>
          {(['today', 'tomorrow', 'custom', 'all'] as const).map((mode) => {
            const isSel = selectedDateMode === mode;
            const labels = { today: 'Today', tomorrow: 'Tomorrow', custom: 'Pick Date', all: 'All Dates' };
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.dateFilterPill, isSel && styles.dateFilterPillActive]}
                onPress={() => setSelectedDateMode(mode)}
              >
                <Text style={[styles.dateFilterText, isSel && styles.dateFilterTextActive]}>
                  {labels[mode]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDateMode === 'custom' && (
          <View style={styles.customDateBox}>
            <Text style={styles.customDateLabel}>Enter Date (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.customDateInput}
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.light.ink400}
            />
          </View>
        )}

        {/* Doctor Filter Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
          <TouchableOpacity
            style={[styles.docFilterChip, selectedDoctorFilter === 'ALL' && styles.docFilterChipActive]}
            onPress={() => setSelectedDoctorFilter('ALL')}
          >
            <Icon
              name="building"
              size={12}
              color={selectedDoctorFilter === 'ALL' ? '#FFFFFF' : Colors.light.ink600}
            />
            <Text
              style={[
                styles.docFilterChipText,
                selectedDoctorFilter === 'ALL' && styles.docFilterChipTextActive,
              ]}
            >
              All Doctors
            </Text>
          </TouchableOpacity>

          {doctors.map((doc) => {
            const isSel = selectedDoctorFilter === doc.id;
            const dName = doc.user?.name || 'Doctor';
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.docFilterChip, isSel && styles.docFilterChipActive]}
                onPress={() => setSelectedDoctorFilter(doc.id)}
              >
                <Icon
                  name="stethoscope"
                  size={12}
                  color={isSel ? '#FFFFFF' : Colors.light.primary}
                />
                <Text
                  style={[styles.docFilterChipText, isSel && styles.docFilterChipTextActive]}
                  numberOfLines={1}
                >
                  Dr. {dName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Filter Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
          {STATUS_FILTERS.map((f) => {
            const isSel = selectedStatusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.statusFilterChip,
                  isSel && styles.statusFilterChipActive,
                  { borderColor: isSel ? Colors.light.primary : Colors.light.surface200 },
                ]}
                onPress={() => setSelectedStatusFilter(f.key)}
              >
                <Text
                  style={[
                    styles.statusFilterText,
                    isSel && styles.statusFilterTextActive,
                    { color: isSel ? '#FFFFFF' : f.color },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => setShowBookingModal(true)}
          >
            <Text style={styles.emptyActionBtnText}>+ Book Appointment</Text>
          </TouchableOpacity>
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

      {/* ========================================================
          DOCTOR-LIST-WISE BOOK APPOINTMENT MODAL
      ======================================================== */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="slide"
        onRequestClose={resetBookingForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {bookingStage === 1 ? 'Book Appointment — Select Doctor' : `Book with Dr. ${bookingDoctor?.user?.name || 'Doctor'}`}
                </Text>
                <Text style={styles.modalSub}>
                  {bookingStage === 1 ? 'Step 1 of 2: Pick practicing physician' : 'Step 2 of 2: Session & patient details'}
                </Text>
              </View>
              <TouchableOpacity onPress={resetBookingForm} style={styles.modalCloseBtn}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* STAGE 1: DOCTOR SELECTION LIST */}
              {bookingStage === 1 && (
                <View style={styles.doctorSelectionList}>
                  <Text style={styles.stageTitle}>Available Practicing Doctors</Text>
                  {loadingDoctors ? (
                    <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 20 }} />
                  ) : doctors.length === 0 ? (
                    <Text style={styles.emptyDoctorMsg}>No doctors assigned to this clinic.</Text>
                  ) : (
                    doctors.map((doc) => {
                      const dName = doc.user?.name || 'Doctor';
                      const avatar = doc.avatar || doc.profilePhoto;
                      return (
                        <TouchableOpacity
                          key={doc.id}
                          style={styles.doctorPickCard}
                          onPress={() => {
                            setBookingDoctor(doc);
                            setBookingStage(2);
                          }}
                          activeOpacity={0.85}
                        >
                          <View style={styles.docPickAvatarWrap}>
                            {avatar ? (
                              <Image source={{ uri: getImageUrl(avatar) }} style={styles.docPickAvatarImg} />
                            ) : (
                              <View style={styles.docPickAvatarFallback}>
                                <Text style={styles.docPickAvatarInitials}>
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

                          <View style={styles.docPickMeta}>
                            <View style={styles.docPickNameRow}>
                              <Text style={styles.docPickName}>Dr. {dName}</Text>
                              <Icon name="check-circle" size={13} color="#10B981" />
                            </View>
                            <Text style={styles.docPickSpec}>{doc.specialization || 'General Physician'}</Text>
                            <View style={styles.docPickChipsRow}>
                              {doc.experience != null && doc.experience > 0 && (
                                <View style={styles.docPickChip}>
                                  <Text style={styles.docPickChipText}>{doc.experience}+ yrs</Text>
                                </View>
                              )}
                              {doc.fee != null && doc.fee > 0 && (
                                <View style={[styles.docPickChip, { backgroundColor: '#ECFDF5' }]}>
                                  <Text style={[styles.docPickChipText, { color: '#047857' }]}>₹{doc.fee}</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.docPickSelectBtn}>
                            <Text style={styles.docPickSelectBtnText}>Select</Text>
                            <Icon name="chevron-right" size={14} color={Colors.light.primary} />
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {/* STAGE 2: DATE, SESSION & PATIENT DETAILS */}
              {bookingStage === 2 && bookingDoctor && (
                <View style={styles.stageTwoForm}>
                  {/* Selected Doctor Summary Card */}
                  <View style={styles.selectedDoctorSummary}>
                    <View style={styles.docPickAvatarFallbackSmall}>
                      <Text style={styles.docPickAvatarInitialsSmall}>
                        {(bookingDoctor.user?.name || 'DR')
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.summaryDocName}>Dr. {bookingDoctor.user?.name}</Text>
                      <Text style={styles.summaryDocSpec}>{bookingDoctor.specialization || 'General Physician'}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeDocBtn}
                      onPress={() => setBookingStage(1)}
                    >
                      <Text style={styles.changeDocBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Date Selector */}
                  <Text style={styles.inputGroupLabel}>1. APPOINTMENT DATE</Text>
                  <View style={styles.modalDatePillsRow}>
                    {(['today', 'tomorrow', 'custom'] as const).map((dMode) => {
                      const isSel = bookingDateMode === dMode;
                      const labels = { today: 'Today', tomorrow: 'Tomorrow', custom: 'Pick Date' };
                      return (
                        <TouchableOpacity
                          key={dMode}
                          style={[styles.modalDatePill, isSel && styles.modalDatePillActive]}
                          onPress={() => setBookingDateMode(dMode)}
                        >
                          <Text style={[styles.modalDatePillText, isSel && styles.modalDatePillTextActive]}>
                            {labels[dMode]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {bookingDateMode === 'custom' && (
                    <TextInput
                      style={styles.textInput}
                      value={bookingCustomDate}
                      onChangeText={setBookingCustomDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.light.ink400}
                    />
                  )}

                  {/* Session Slot Selector */}
                  <Text style={styles.inputGroupLabel}>2. PRACTICE SESSION / TIME SLOT</Text>
                  {loadingSchedules ? (
                    <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginVertical: 8 }} />
                  ) : schedules.length === 0 ? (
                    <View style={styles.noScheduleWarnBox}>
                      <Icon name="clock" size={14} color="#B45309" />
                      <Text style={styles.noScheduleWarnText}>
                        No explicit schedule slot found for this date. Default walk-in slot will be assigned.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotsStrip}>
                      {schedules.map((slot) => {
                        const isSel = bookingScheduleId === slot.id;
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[styles.slotCard, isSel && styles.slotCardActive]}
                            onPress={() => setBookingScheduleId(slot.id)}
                          >
                            <Icon name="clock" size={13} color={isSel ? '#FFFFFF' : Colors.light.primary} />
                            <Text style={[styles.slotTimeText, isSel && styles.slotTimeTextActive]}>
                              {slot.startTime} - {slot.endTime}
                            </Text>
                            {slot.maxPatients ? (
                              <Text style={[styles.slotCapText, isSel && styles.slotCapTextActive]}>
                                Max: {slot.maxPatients}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* Booking Source */}
                  <Text style={styles.inputGroupLabel}>3. BOOKING SOURCE</Text>
                  <View style={styles.sourcePillsRow}>
                    {(['WALK_IN', 'RECEPTION', 'PHONE'] as const).map((src) => {
                      const isSel = bookingSource === src;
                      const labels = { WALK_IN: 'Walk-In', RECEPTION: 'Front Desk', PHONE: 'Phone Booking' };
                      return (
                        <TouchableOpacity
                          key={src}
                          style={[styles.sourcePill, isSel && styles.sourcePillActive]}
                          onPress={() => setBookingSource(src)}
                        >
                          <Text style={[styles.sourcePillText, isSel && styles.sourcePillTextActive]}>
                            {labels[src]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Patient Phone Lookup */}
                  <Text style={styles.inputGroupLabel}>4. PATIENT PHONE NUMBER *</Text>
                  <View style={styles.phoneLookupRow}>
                    <TextInput
                      style={[styles.textInput, styles.flex1]}
                      placeholder="e.g. 9876543210"
                      value={phoneInput}
                      onChangeText={(val) => {
                        setPhoneInput(val);
                        if (patientLookupResult) setPatientLookupResult(null);
                      }}
                      keyboardType="phone-pad"
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

                  {/* Lookup Result Indicator */}
                  {patientLookupResult && (
                    <View style={styles.foundPatientCard}>
                      <Icon name="check-circle" size={15} color="#047857" />
                      <View style={styles.flex1}>
                        <Text style={styles.foundPatientName}>{patientLookupResult.name}</Text>
                        <Text style={styles.foundPatientSub}>Verified registered patient record</Text>
                      </View>
                    </View>
                  )}

                  {/* Patient Name & Age Form */}
                  <Text style={styles.inputGroupLabel}>5. PATIENT DEMOGRAPHICS</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Patient Full Name *"
                    value={patientName}
                    onChangeText={setPatientName}
                    placeholderTextColor={Colors.light.ink400}
                  />

                  <View style={styles.twoInputsRow}>
                    <TextInput
                      style={[styles.textInput, styles.flex1]}
                      placeholder="Age (years)"
                      value={patientAge}
                      onChangeText={setPatientAge}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.light.ink400}
                    />

                    <View style={styles.genderRow}>
                      {(['MALE', 'FEMALE', 'OTHER'] as const).map((g) => {
                        const isSel = patientGender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            style={[styles.genderPill, isSel && styles.genderPillActive]}
                            onPress={() => setPatientGender(g)}
                          >
                            <Text style={[styles.genderPillText, isSel && styles.genderPillTextActive]}>
                              {g[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Submit Booking Button */}
                  <TouchableOpacity
                    style={styles.submitBookingBtn}
                    onPress={handleConfirmBooking}
                    disabled={bookAppointmentMutation.isPending}
                    activeOpacity={0.88}
                  >
                    {bookAppointmentMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="check-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.submitBookingBtnText}>
                          Confirm Booking & Issue Token
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
  bookAppointmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  bookBtnIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookBtnSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
  filterSection: {
    gap: Spacing.two,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
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
  dateFilterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  dateFilterPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  dateFilterPillActive: {
    backgroundColor: Colors.light.primary,
  },
  dateFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
  },
  customDateBox: {
    backgroundColor: Colors.light.surfaceWhite,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 4,
  },
  customDateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  customDateInput: {
    fontSize: 12,
    color: Colors.light.ink900,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.primary,
  },
  chipScrollView: {
    flexDirection: 'row',
  },
  docFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginRight: 6,
  },
  docFilterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  docFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  docFilterChipTextActive: {
    color: '#FFFFFF',
  },
  statusFilterChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1,
    marginRight: 6,
  },
  statusFilterChipActive: {
    backgroundColor: Colors.light.primary,
  },
  statusFilterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusFilterTextActive: {
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
  emptyActionBtn: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primary,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appointmentsList: {
    gap: Spacing.three,
  },
  appointmentCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tokenBadgeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tokenBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  cardHeaderMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  liveQueueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  liveQueueDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
  },
  liveQueueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  patientInfoBox: {
    gap: 2,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  sourceTag: {
    backgroundColor: Colors.light.surface100,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  patientDemographics: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  phoneLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface100,
  },
  doctorNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  doctorSpecText: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  checkInBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  checkInBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  consultBtn: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  consultBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  completeBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
    marginLeft: 'auto',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
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
  modalScrollView: {
    padding: Spacing.four,
  },
  stageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
  },
  doctorSelectionList: {
    gap: Spacing.two,
  },
  emptyDoctorMsg: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    marginVertical: 20,
  },
  doctorPickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  docPickAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  docPickAvatarImg: {
    width: 44,
    height: 44,
  },
  docPickAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docPickAvatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docPickMeta: {
    flex: 1,
    gap: 2,
  },
  docPickNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docPickName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  docPickSpec: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  docPickChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  docPickChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface200,
  },
  docPickChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  docPickSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  docPickSelectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  stageTwoForm: {
    gap: Spacing.three,
  },
  selectedDoctorSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  docPickAvatarFallbackSmall: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docPickAvatarInitialsSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryDocName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  summaryDocSpec: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  changeDocBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  changeDocBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  inputGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink600,
    letterSpacing: 0.5,
  },
  modalDatePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modalDatePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  modalDatePillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  modalDatePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  modalDatePillTextActive: {
    color: '#FFFFFF',
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
  slotsStrip: {
    flexDirection: 'row',
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginRight: 6,
  },
  slotCardActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  slotTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  slotTimeTextActive: {
    color: '#FFFFFF',
  },
  slotCapText: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  slotCapTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  noScheduleWarnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noScheduleWarnText: {
    fontSize: 11,
    color: '#B45309',
    flex: 1,
  },
  sourcePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sourcePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  sourcePillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.light.primary,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  sourcePillTextActive: {
    color: Colors.light.primary,
  },
  phoneLookupRow: {
    flexDirection: 'row',
    gap: 6,
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
  foundPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  foundPatientName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  foundPatientSub: {
    fontSize: 10,
    color: '#065F46',
  },
  twoInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderPill: {
    width: 38,
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
  submitBookingBtn: {
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
  submitBookingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
