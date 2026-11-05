import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth-context';
import {
  useBookAppointment,
  useDoctorSchedules,
  useDoctorAvailableDates,
} from '../hooks/useDoctorSearch';
import {
  BookingDoctorCard,
  DateSelector,
  BookingSummary,
  BookingSuccessModal,
  Icon,
} from '../components';
import type { Doctor, Appointment, DoctorScheduleSlot } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

function SessionSkeletonCard() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.sessionCard, { opacity: pulseAnim, backgroundColor: '#FFFFFF', marginBottom: Spacing.two }]}>
      <View style={styles.sessionCardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ width: '50%', height: 16, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
          <View style={{ width: '40%', height: 12, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={{ width: 64, height: 22, backgroundColor: '#E2E8F0', borderRadius: 12 }} />
          <View style={{ width: 70, height: 12, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
        </View>
      </View>
    </Animated.View>
  );
}

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

  const { user, isAuthenticated, loading } = useAuth();
  const queryClient = useQueryClient();
  const bookMutation = useBookAppointment();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      Alert.alert(
        'Login Required',
        'Please login or register to book an appointment.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)' as any),
          },
        ]
      );
    }
  }, [loading, isAuthenticated, user, router]);

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

  // Fetch real available dates computed by the backend availability engine
  const { data: availableDatesData, isLoading: isLoadingDates } = useDoctorAvailableDates(
    doctor.id,
    doctor.clinicId
  );
  const availableDates = useMemo(() => availableDatesData ?? [], [availableDatesData]);

  // When available dates load, auto-select first valid date if selectedDate is not among them
  useEffect(() => {
    if (availableDates.length > 0) {
      const exists = availableDates.some((d) => d.date === selectedDate);
      if (!exists) {
        setSelectedDate(availableDates[0].date);
      }
    }
  }, [availableDates, selectedDate]);

  // Fetch real consultation schedules for this doctor at this clinic on the selected date
  const { data: schedulesData, isLoading: isLoadingSchedules } = useDoctorSchedules(
    doctor.id,
    doctor.clinicId,
    selectedDate
  );
  const schedules: DoctorScheduleSlot[] = useMemo(() => schedulesData ?? [], [schedulesData]);
  const activeSchedules = useMemo(
    () =>
      schedules.filter(
        (s) => s.onlineBookingEnabled !== false && (s.isActive !== undefined ? s.isActive : true)
      ),
    [schedules]
  );

  // Pre-select first available schedule if none selected yet or when date changes
  useEffect(() => {
    if (activeSchedules.length > 0) {
      const match = activeSchedules.find((s) => s.id === selectedScheduleId);
      if (!match || (match.slotsLeft !== undefined && match.slotsLeft <= 0)) {
        const firstAvailable =
          activeSchedules.find((s) => (s.slotsLeft ?? 1) > 0) || activeSchedules[0];
        setSelectedScheduleId(firstAvailable.id);
        setSelectedTime(`${firstAvailable.startTime} - ${firstAvailable.endTime}`);
      }
    } else {
      setSelectedScheduleId('');
      setSelectedTime('');
    }
  }, [activeSchedules, selectedDate]);

  const selectedSession = useMemo(
    () => schedules.find((s) => s.id === selectedScheduleId),
    [schedules, selectedScheduleId]
  );

  const sessionLabel = selectedSession
    ? `${selectedSession.startTime < '12:00' ? 'Morning' : selectedSession.startTime < '17:00' ? 'Afternoon' : 'Evening'} Session (${selectedSession.startTime} - ${selectedSession.endTime})`
    : undefined;

  const handleSelectSession = (slot: DoctorScheduleSlot) => {
    const isFull = slot.slotsLeft !== undefined && slot.slotsLeft <= 0;
    if (isFull) return;
    setSelectedScheduleId(slot.id);
    setSelectedTime(`${slot.startTime} - ${slot.endTime}`);
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

    if (!selectedScheduleId) {
      setErrorMessage('Please select an available consultation session.');
      return;
    }

    if (selectedSession && selectedSession.slotsLeft !== undefined && selectedSession.slotsLeft <= 0) {
      setErrorMessage('The selected session is fully booked. Please select another session.');
      return;
    }

    bookMutation.mutate(
      {
        doctorId: doctor.id,
        clinicId: doctor.clinicId,
        date: selectedDate, // YYYY-MM-DD matches backend zod validation
        scheduleId: selectedScheduleId,
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
                'The selected slot is no longer available. Please select another session.'
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

        {/* Date Selector with Real Available Dates from Backend */}
        <DateSelector
          selectedDate={selectedDate}
          availableDates={availableDates}
          isLoading={isLoadingDates}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setErrorMessage('');
          }}
        />

        {/* Consultation Sessions Selection (Integrated 1:1 with Backend Availability Engine) */}
        {isLoadingSchedules ? (
          <View style={styles.sessionsSection}>
            <View style={styles.sessionSectionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <Icon name="clock" size={15} color={Colors.light.primary} />
                <Text style={styles.sessionSectionTitle}>Consultation Session & Time</Text>
              </View>
            </View>
            <View style={styles.sessionsGrid}>
              <SessionSkeletonCard />
              <SessionSkeletonCard />
            </View>
          </View>
        ) : activeSchedules.length > 0 ? (
          <View style={styles.sessionsSection}>
            <View style={styles.sessionSectionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <Icon name="clock" size={15} color={Colors.light.primary} />
                <Text style={styles.sessionSectionTitle}>Consultation Session & Time</Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>
                  {activeSchedules.filter((s) => (s.slotsLeft ?? 1) > 0).length} Available
                </Text>
              </View>
            </View>

            <View style={styles.sessionsGrid}>
              {activeSchedules.map((slot) => {
                const isSelected = selectedScheduleId === slot.id;
                const isFull = slot.slotsLeft !== undefined && slot.slotsLeft <= 0;
                const sessionTitle =
                  slot.startTime < '12:00'
                    ? 'Morning Session'
                    : slot.startTime < '17:00'
                    ? 'Afternoon Session'
                    : 'Evening Session';

                return (
                  <View key={slot.id} style={styles.sessionCardWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.sessionCard,
                        isSelected && styles.sessionCardSelected,
                        isFull && styles.sessionCardFull,
                      ]}
                      onPress={() => handleSelectSession(slot)}
                      activeOpacity={isFull ? 1 : 0.8}
                      disabled={isFull}
                    >
                      <View style={styles.sessionCardHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text
                            style={[
                              styles.sessionTitleText,
                              isSelected && styles.sessionTitleTextSelected,
                              isFull && styles.sessionTitleTextFull,
                            ]}
                          >
                            {sessionTitle}
                          </Text>
                          <View style={styles.sessionTimeRow}>
                            <Icon
                              name="clock"
                              size={12}
                              color={
                                isSelected
                                  ? '#252a67'
                                  : isFull
                                  ? Colors.light.ink300
                                  : Colors.light.ink500
                              }
                            />
                            <Text
                              style={[
                                styles.sessionTimeText,
                                isSelected && styles.sessionTimeTextSelected,
                                isFull && styles.sessionTimeTextFull,
                              ]}
                            >
                              {slot.startTime} - {slot.endTime}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.sessionStatusCol}>
                          <View
                            style={[
                              styles.statusBadge,
                              isFull ? styles.statusBadgeFull : styles.statusBadgeAvailable,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isFull
                                  ? styles.statusBadgeTextFull
                                  : styles.statusBadgeTextAvailable,
                              ]}
                            >
                              {isFull ? 'Full' : 'Available'}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.slotsLeftText,
                              isFull ? styles.slotsLeftTextFull : styles.slotsLeftTextAvailable,
                            ]}
                          >
                            {slot.slotsLeft !== undefined
                              ? `${slot.slotsLeft} Slots Left`
                              : `Max ${slot.maxPatients}`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.noSchedulesCard}>
            <Icon name="calendar" size={24} color={Colors.light.danger} />
            <Text style={styles.noSchedulesTitle}>No Sessions Available</Text>
            <Text style={styles.noSchedulesSub}>
              There are no available consultation sessions on this date for this chamber. Please select another date above.
            </Text>
          </View>
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
            <Text style={styles.feeAmount}>{'\u20B9'}{doctor.fee ?? 500}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedDate ||
                !selectedScheduleId ||
                bookMutation.isPending ||
                (selectedSession?.slotsLeft !== undefined && selectedSession.slotsLeft <= 0)) &&
                styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmBooking}
            disabled={
              !selectedDate ||
              !selectedScheduleId ||
              bookMutation.isPending ||
              (selectedSession?.slotsLeft !== undefined && selectedSession.slotsLeft <= 0)
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
          if (bookedAppointment?.id) {
            queryClient.setQueryData(
              ['appointment', String(bookedAppointment.id).trim()],
              bookedAppointment
            );
            router.replace({
              pathname: '/(patient)/appointment/[id]' as any,
              params: { id: bookedAppointment.id },
            });
          } else {
            router.replace('/(patient)');
          }
        }}
        onBookAnother={() => {
          setShowSuccessModal(false);
          setSelectedTime('');
          setSelectedScheduleId('');
          router.replace('/doctors');
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
  sessionCardWrapper: {
    marginBottom: 2,
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
    borderWidth: 2,
  },
  sessionCardFull: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.65,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  sessionTitleTextSelected: {
    color: '#252a67',
  },
  sessionTitleTextFull: {
    color: Colors.light.ink400,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sessionTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  sessionTimeTextSelected: {
    color: '#252a67',
    fontWeight: '700',
  },
  sessionTimeTextFull: {
    color: Colors.light.ink400,
  },
  sessionStatusCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusBadgeAvailable: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeFull: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBadgeTextAvailable: {
    color: '#059669',
  },
  statusBadgeTextFull: {
    color: '#DC2626',
  },
  slotsLeftText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotsLeftTextAvailable: {
    color: '#0F766E',
  },
  slotsLeftTextFull: {
    color: Colors.light.ink400,
  },
  noSchedulesCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    gap: 6,
  },
  noSchedulesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink800,
    marginTop: 4,
  },
  noSchedulesSub: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 17,
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
