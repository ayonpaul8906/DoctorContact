import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { useBookAppointment, useDoctorSchedules } from '../../hooks/useDoctorSearch';
import {
  BookingDoctorCard,
  DateSelector,
  TimeSlotPicker,
  BookingSummary,
  BookingSuccessModal,
  Icon,
} from '../../components';
import type { Doctor, Appointment, DoctorScheduleSlot } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    doctorId?: string;
    doctorName?: string;
    qualification?: string;
    specialization?: string;
    experience?: string;
    clinicId?: string;
    clinicName?: string;
    city?: string;
    fee?: string;
  }>();

  const { user } = useAuth();
  const bookMutation = useBookAppointment();

  // Initial date is today in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Construct doctor object from parameters
  const doctor: Doctor = useMemo(
    () => ({
      id: params.doctorId || 'doc-1',
      clinicId: params.clinicId || 'clinic-1',
      qualification: params.qualification || 'MBBS, MD',
      specialization: params.specialization || 'General Physician',
      experience: params.experience ? parseInt(params.experience, 10) : 5,
      fee: params.fee ? parseInt(params.fee, 10) : 500,
      user: {
        name: params.doctorName || 'Dr. Specialist',
      },
      clinic: {
        id: params.clinicId || 'clinic-1',
        clinicName: params.clinicName || 'Dewasi Healthcare Clinic',
        city: params.city || 'Main Branch',
        address: params.city || 'Main Road',
      },
    }),
    [params]
  );

  // Fetch real consultation schedules for this doctor at this clinic
  const { data: schedulesData, isLoading: isLoadingSchedules } = useDoctorSchedules(
    doctor.id,
    doctor.clinicId
  );
  const schedules: DoctorScheduleSlot[] = useMemo(() => schedulesData ?? [], [schedulesData]);
  const activeSchedules = useMemo(() => schedules.filter((s) => s.isActive), [schedules]);

  // Pre-select first active schedule if none selected yet
  useEffect(() => {
    if (activeSchedules.length > 0 && !selectedScheduleId) {
      const first = activeSchedules[0];
      setSelectedScheduleId(first.id);
      setSelectedTime(first.startTime);
    }
  }, [activeSchedules, selectedScheduleId]);

  const selectedSession = useMemo(
    () => schedules.find((s) => s.id === selectedScheduleId),
    [schedules, selectedScheduleId]
  );

  const sessionLabel = selectedSession
    ? `${selectedSession.startTime} – ${selectedSession.endTime}`
    : undefined;

  const handleSelectSession = (slot: DoctorScheduleSlot) => {
    setSelectedScheduleId(slot.id);
    setSelectedTime(slot.startTime);
    setErrorMessage('');
  };

  const handleConfirmBooking = () => {
    setErrorMessage('');

    if (!user) {
      router.replace('/(auth)');
      return;
    }

    if (!selectedDate) {
      setErrorMessage('Please select an appointment date.');
      return;
    }

    if (activeSchedules.length > 0 && !selectedScheduleId) {
      setErrorMessage('Please select a consultation session.');
      return;
    }

    if (activeSchedules.length === 0 && !selectedTime) {
      setErrorMessage('Please select a consultation time slot.');
      return;
    }

    const timeToUse = selectedTime || (selectedSession ? selectedSession.startTime : '09:00');
    const [hours, minutes] = timeToUse.split(':').map(Number);
    const appointmentDateTime = new Date(selectedDate);
    appointmentDateTime.setHours(hours || 9, minutes || 0, 0, 0);

    bookMutation.mutate(
      {
        doctorId: doctor.id,
        clinicId: doctor.clinicId,
        date: appointmentDateTime.toISOString(),
        scheduleId: selectedScheduleId || undefined,
      },
      {
        onSuccess: (appointment) => {
          setBookedAppointment(appointment);
          setShowSuccessModal(true);
        },
        onError: (err: unknown) => {
          if (typeof err === 'object' && err !== null && 'response' in err) {
            const res = (err as { response?: { data?: { message?: string } } }).response;
            setErrorMessage(
              res?.data?.message ||
                'The selected slot is no longer available. Please select another time.'
            );
          } else if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Unable to confirm appointment. Please try again.');
          }
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={20} color={Colors.light.ink900} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <Text style={styles.headerSubtitle}>
            Select date & consultation session for your clinic visit
          </Text>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Summary Card */}
        <BookingDoctorCard doctor={doctor} />

        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setErrorMessage('');
          }}
        />

        {/* Consultation Sessions Selection */}
        {isLoadingSchedules ? (
          <View style={styles.schedulesLoadingContainer}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.schedulesLoadingText}>Loading available sessions...</Text>
          </View>
        ) : activeSchedules.length > 0 ? (
          <View style={styles.sessionsSection}>
            <View style={styles.sessionSectionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <Icon name="clock" size={15} color={Colors.light.primary} />
                <Text style={styles.sessionSectionTitle}>Consultation Session</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{activeSchedules.length} Available</Text>
              </View>
            </View>

            <View style={styles.sessionsGrid}>
              {activeSchedules.map((slot) => {
                const isSelected = selectedScheduleId === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[styles.sessionCard, isSelected && styles.sessionCardSelected]}
                    onPress={() => handleSelectSession(slot)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionCardHeader}>
                      <Text
                        style={[
                          styles.sessionTimeText,
                          isSelected && styles.sessionTimeTextSelected,
                        ]}
                      >
                        {slot.startTime} – {slot.endTime}
                      </Text>
                      {isSelected ? (
                        <View style={styles.selectedCircle}>
                          <Icon name="check" size={12} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.unselectedCircle} />
                      )}
                    </View>

                    <View style={styles.sessionMetaRow}>
                      <Text style={styles.sessionRecurrenceText}>
                        {slot.recurrenceType}
                      </Text>
                      <Text style={styles.sessionCapacityText}>
                        Max {slot.maxPatients} patients
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          /* Fallback generic time picker if no clinic schedules exist */
          <TimeSlotPicker
            selectedTime={selectedTime}
            onSelectTime={(time) => {
              setSelectedTime(time);
              setErrorMessage('');
            }}
            selectedDate={selectedDate}
          />
        )}

        {/* Booking Summary */}
        <BookingSummary
          doctor={doctor}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          sessionName={sessionLabel}
        />

        {/* Error State Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={16} color={Colors.light.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Confirmation Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.feeCol}>
            <Text style={styles.feeLabel}>Total Amount</Text>
            <Text style={styles.feeAmount}>₹{doctor.fee ?? 500}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedDate ||
                (activeSchedules.length > 0 ? !selectedScheduleId : !selectedTime) ||
                bookMutation.isPending) &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmBooking}
            disabled={
              !selectedDate ||
              (activeSchedules.length > 0 ? !selectedScheduleId : !selectedTime) ||
              bookMutation.isPending
            }
            activeOpacity={0.85}
          >
            {bookMutation.isPending ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirming...</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Icon name="calendar" size={16} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Success Modal */}
      <BookingSuccessModal
        visible={showSuccessModal}
        appointment={bookedAppointment}
        onViewAppointments={() => {
          setShowSuccessModal(false);
          router.replace('/(patient)');
        }}
        onBookAnother={() => {
          setShowSuccessModal(false);
          setSelectedTime('');
          setSelectedScheduleId('');
          router.replace('/(patient)/doctors');
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  schedulesLoadingContainer: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  schedulesLoadingText: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  sessionsSection: {
    marginBottom: Spacing.four,
  },
  sessionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionSectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activePill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  sessionsGrid: {
    gap: Spacing.two,
  },
  sessionCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  sessionCardSelected: {
    borderColor: '#252a67',
    backgroundColor: '#F8FAFC',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  sessionTimeTextSelected: {
    color: '#252a67',
  },
  selectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#252a67',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.ink300,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sessionRecurrenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  sessionCapacityText: {
    fontSize: 11,
    color: Colors.light.ink400,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  bottomBar: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    ...Shadows.lg,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  feeCol: {
    justifyContent: 'center',
  },
  feeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink400,
    textTransform: 'uppercase',
  },
  feeAmount: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: '#059669',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#252a67',
    borderRadius: Radius.md,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
