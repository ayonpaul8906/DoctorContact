import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { api } from '../lib/api';
import { useBookReceptionAppointment } from '../hooks/useClinic';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';
import type { ClinicDoctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';

interface ClinicAddPatientFlowProps {
  clinicId: string;
  doctors: ClinicDoctor[];
  onOpenLiveQueue?: (doctor: ClinicDoctor) => void;
}

function getDoctorInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDoctorName(name?: string) {
  if (!name?.trim()) return 'Dr. Doctor';
  const clean = name.trim().replace(/^(dr\.?\s*)+/i, '').trim();
  return clean ? `Dr. ${clean}` : 'Dr. Doctor';
}

function getTodayLocal() {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
}

function formatDateStripLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const today = new Date();
  const isToday =
    dt.getFullYear() === today.getFullYear() &&
    dt.getMonth() === today.getMonth() &&
    dt.getDate() === today.getDate();

  if (isToday) {
    return {
      top: 'Today',
      bottom: dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    };
  }
  return {
    top: dt.toLocaleDateString('en-US', { weekday: 'short' }),
    bottom: dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
  };
}

interface AvailableDateEntry {
  date: string;
  sessions?: any[];
}

export function ClinicAddPatientFlow({
  clinicId,
  doctors,
  onOpenLiveQueue,
}: ClinicAddPatientFlowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<ClinicDoctor | null>(null);

  // Patient states
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [patientId, setPatientId] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(false);

  // Schedule & Date states
  const [date, setDate] = useState('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [isFetchingSchedules, setIsFetchingSchedules] = useState(false);

  // Date strip states
  const [availableDates, setAvailableDates] = useState<AvailableDateEntry[]>([]);
  const [isFetchingDates, setIsFetchingDates] = useState(false);

  const bookAppointmentMutation = useBookReceptionAppointment();

  // Filtered doctors list
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase().trim();
    return doctors.filter((d) => {
      const docName = (d.user?.name || '').toLowerCase();
      const spec = (d.specialization || '').toLowerCase();
      return docName.includes(q) || spec.includes(q);
    });
  }, [doctors, searchQuery]);

  // Fetch available dates when doctor is selected
  useEffect(() => {
    async function fetchAvailableDates() {
      if (!selectedDoctor || !clinicId) return;

      setIsFetchingDates(true);
      setAvailableDates([]);
      setDate('');
      setSchedules([]);
      setSelectedScheduleId('');

      try {
        const response = await api.get(
          `/doctors/${selectedDoctor.id}/clinics/${clinicId}/schedules/available-dates?limit=10`
        );
        if (response.data?.success) {
          const dates: AvailableDateEntry[] = response.data.data.dates || [];
          setAvailableDates(dates);
          if (dates.length > 0) {
            setDate(dates[0].date);
          }
        }
      } catch (error) {
        setAvailableDates([]);
        Alert.alert('Error', 'Failed to load upcoming available dates.');
      } finally {
        setIsFetchingDates(false);
      }
    }

    fetchAvailableDates();
  }, [selectedDoctor, clinicId]);

  // Fetch schedules when date changes
  useEffect(() => {
    async function fetchSchedulesForDate() {
      if (!selectedDoctor || !clinicId || !date) return;

      setIsFetchingSchedules(true);
      setSelectedScheduleId('');

      try {
        const response = await api.get(
          `/doctors/${selectedDoctor.id}/clinics/${clinicId}/schedules?date=${date}`
        );
        if (response.data?.success) {
          setSchedules(response.data.data.schedules || []);
        }
      } catch (error) {
        setSchedules([]);
        Alert.alert('Error', 'Failed to load sessions for this date.');
      } finally {
        setIsFetchingSchedules(false);
      }
    }

    fetchSchedulesForDate();
  }, [selectedDoctor, clinicId, date]);

  // 10-Digit Phone Auto-Lookup
  const handlePhoneChange = async (val: string) => {
    const cleanPhone = val.replace(/\D/g, '');
    if (cleanPhone.length > 10) return;
    setPhone(cleanPhone);

    if (cleanPhone.length !== 10) {
      setIsExistingPatient(false);
      setPatientId('');
      return;
    }

    setIsCheckingPhone(true);
    try {
      const response = await api.get('/patient/search', { params: { phone: cleanPhone } });
      const patient = response.data?.data?.patient;

      if (patient) {
        setPatientId(patient.id);
        setName(patient.name || '');
        setAge(patient.age != null ? String(patient.age) : '');
        setIsExistingPatient(true);
      } else {
        setPatientId('');
        setName('');
        setAge('');
        setIsExistingPatient(false);
      }
    } catch {
      setPatientId('');
      setName('');
      setAge('');
      setIsExistingPatient(false);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedScheduleId || !date) {
      Alert.alert('Selection Required', 'Please select an appointment date and session.');
      return;
    }
    if (phone.length !== 10) {
      Alert.alert('Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter the patient name.');
      return;
    }
    if (!age.trim()) {
      Alert.alert('Age Required', 'Please enter the patient age.');
      return;
    }

    try {
      const isToday = date === getTodayLocal();
      const payload: any = {
        doctorId: selectedDoctor.id,
        clinicId,
        scheduleId: selectedScheduleId,
        date,
        bookingSource: isToday ? 'WALK_IN' : 'RECEPTION',
      };

      if (isExistingPatient && patientId) {
        payload.patientId = patientId;
      } else {
        payload.newPatient = {
          name: name.trim(),
          phone,
          age: Number(age),
        };
      }

      const res: any = await bookAppointmentMutation.mutateAsync(payload);
      const tokenNumber = res?.token || res?.appointment?.token || 'Confirmed';

      Alert.alert(
        'Booking Confirmed',
        `Appointment successfully booked!\nToken #${tokenNumber} issued.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setPhone('');
              setName('');
              setAge('');
              setPatientId('');
              setIsExistingPatient(false);
              setSelectedDoctor(null);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Booking Failed',
        err?.response?.data?.message || err?.message || 'Failed to book appointment'
      );
    }
  };

  // ============================================================
  // STAGE 2: SELECTED DOCTOR & BOOK APPOINTMENT FORM
  // ============================================================
  if (selectedDoctor) {
    const avatarSrc =
      selectedDoctor.user?.avatar ||
      selectedDoctor.user?.profilePhoto ||
      (selectedDoctor as any).profilePhoto ||
      null;
    const docName = formatDoctorName(selectedDoctor.user?.name);
    const spec = selectedDoctor.specialization || 'General Physician';

    return (
      <KeyboardAwareScrollView
        style={styles.bookingContainer}
        contentContainerStyle={{ paddingBottom: 60 }}
        extraHeight={140}
      >
        {/* Top Back Row */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSelectedDoctor(null)}
          activeOpacity={0.8}
        >
          <Icon name="arrow-left" size={16} color={Colors.light.primary} />
          <Text style={styles.backBtnText}>Back to Doctor List</Text>
        </TouchableOpacity>

        {/* Selected Doctor Hero Banner */}
        <View style={styles.selectedDocCard}>
          <View style={styles.selectedDocContent}>
            <View style={styles.selectedDocAvatar}>
              {avatarSrc ? (
                <Image
                  source={{ uri: getImageUrl(avatarSrc) }}
                  style={styles.selectedDocImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.selectedDocInitials}>
                  {getDoctorInitials(selectedDoctor.user?.name)}
                </Text>
              )}
              <View style={styles.verifiedBadge}>
                <Icon name="check-circle" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.selectedDocMeta}>
              <Text style={styles.selectedDocName} numberOfLines={1}>
                {docName}
              </Text>
              <Text style={styles.selectedDocSpec} numberOfLines={1}>
                {spec}
              </Text>
              {selectedDoctor.fee != null && (
                <View style={styles.selectedDocFeeBadge}>
                  <Text style={styles.selectedDocFee}>
                    Consultation Fee: ₹{selectedDoctor.fee}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Booking Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formContent}>
            <View style={styles.formHeaderRow}>
              <View style={styles.formIconCircle}>
                <Icon name="stethoscope" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.formHeaderMeta}>
                <Text style={styles.formTitle}>Book Appointment</Text>
                <Text style={styles.formSubtitle}>
                  Select a date, session, and enter patient details.
                </Text>
              </View>
            </View>

            {/* 1. Appointment Date Strip */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Appointment Date</Text>
              {isFetchingDates ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                  <Text style={styles.loadingText}>Finding next available dates...</Text>
                </View>
              ) : availableDates.length === 0 ? (
                <View style={styles.noDatesBox}>
                  <Text style={styles.noDatesText}>
                    No upcoming availability found for this doctor at this clinic.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateStripScroll}
                >
                  {availableDates.map((entry) => {
                    const isSelected = date === entry.date;
                    const label = formatDateStripLabel(entry.date);
                    return (
                      <TouchableOpacity
                        key={entry.date}
                        style={[
                          styles.dateChip,
                          isSelected && styles.dateChipSelected,
                        ]}
                        onPress={() => setDate(entry.date)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.dateChipTop,
                            isSelected && styles.dateChipTopSelected,
                          ]}
                        >
                          {label.top}
                        </Text>
                        <Text
                          style={[
                            styles.dateChipBottom,
                            isSelected && styles.dateChipBottomSelected,
                          ]}
                        >
                          {label.bottom}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* 2. Select Session */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Select Session</Text>
              {!date ? (
                <View style={styles.noDatesBox}>
                  <Text style={styles.emptySessionPrompt}>
                    Please select a date first
                  </Text>
                </View>
              ) : isFetchingSchedules ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                  <Text style={styles.loadingText}>Loading sessions...</Text>
                </View>
              ) : schedules.length > 0 ? (
                <View style={styles.sessionList}>
                  {schedules.map((s) => {
                    const isFull = s.slotsLeft <= 0;
                    const isSelected = selectedScheduleId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        disabled={isFull}
                        onPress={() => setSelectedScheduleId(s.id)}
                        style={[
                          styles.sessionCard,
                          isSelected && styles.sessionCardSelected,
                          isFull && styles.sessionCardFull,
                        ]}
                        activeOpacity={0.85}
                      >
                        <View style={styles.sessionTimeRow}>
                          <Icon
                            name="clock"
                            size={14}
                            color={isSelected ? Colors.light.primary : Colors.light.ink400}
                          />
                          <Text
                            style={[
                              styles.sessionTimeText,
                              isSelected && styles.sessionTimeTextSelected,
                            ]}
                          >
                            {s.startTime} - {s.endTime}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.slotsBadge,
                            isFull ? styles.slotsBadgeFull : styles.slotsBadgeOpen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.slotsBadgeText,
                              isFull ? styles.slotsBadgeTextFull : styles.slotsBadgeTextOpen,
                            ]}
                          >
                            {isFull ? 'Full' : `${s.slotsLeft} Slots Left`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noSessionsBox}>
                  <Text style={styles.noSessionsText}>
                    No active sessions for this doctor on selected date.
                  </Text>
                </View>
              )}
            </View>

            {/* 3. Patient Mobile Number */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Patient Mobile Number</Text>
              <View
                style={[
                  styles.inputWrap,
                  isExistingPatient && styles.inputWrapExisting,
                ]}
              >
                <Icon name="phone" size={15} color={Colors.light.ink400} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor={Colors.light.ink400}
                />
                {isCheckingPhone && (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                )}
              </View>

              {isExistingPatient && (
                <View style={styles.existingPatientAlert}>
                  <Icon name="check-circle" size={12} color="#047857" />
                  <Text style={styles.existingPatientAlertText}>
                    Existing patient auto-filled (You can edit details below)
                  </Text>
                </View>
              )}
            </View>

            {/* 4. Patient Name & Age */}
            <View style={styles.nameAgeRow}>
              <View style={styles.nameCol}>
                <Text style={styles.sectionLabel}>Patient Name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter patient name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>
              </View>

              <View style={styles.ageCol}>
                <Text style={styles.sectionLabel}>Age</Text>
                <View style={[styles.inputWrap, styles.ageInputWrap]}>
                  <TextInput
                    style={[styles.textInput, styles.ageTextInput]}
                    placeholder="Age"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>
              </View>
            </View>

            {/* 5. Submit Booking Button */}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (phone.length !== 10 ||
                  !name.trim() ||
                  !age.trim() ||
                  !selectedScheduleId ||
                  bookAppointmentMutation.isPending) &&
                  styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirmBooking}
              disabled={
                phone.length !== 10 ||
                !name.trim() ||
                !age.trim() ||
                !selectedScheduleId ||
                bookAppointmentMutation.isPending
              }
              activeOpacity={0.88}
            >
              {bookAppointmentMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.confirmBtnInner}>
                  <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                  <Icon name="arrow-right" size={15} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // ============================================================
  // STAGE 1: DOCTOR SELECTION SCREEN
  // ============================================================
  return (
    <View style={styles.container}>
      {/* Title & Subtitle */}
      <View style={styles.headerBlock}>
        <Text style={styles.mainTitle}>Select a Doctor</Text>
        <Text style={styles.mainSubtitle}>
          Choose a doctor to book a patient appointment.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={16} color={Colors.light.ink400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctor by name, specialization..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.ink400}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x" size={14} color={Colors.light.ink400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Doctors Grid / List */}
      {filteredDoctors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="stethoscope" size={32} color={Colors.light.ink400} />
          <Text style={styles.emptyTitle}>No doctors found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? `No doctors match "${searchQuery}"`
              : 'No doctors registered with your clinic yet.'}
          </Text>
        </View>
      ) : (
        <View style={styles.doctorsGrid}>
          {filteredDoctors.map((doctor) => {
            const avatarSrc =
              doctor.user?.avatar ||
              doctor.user?.profilePhoto ||
              (doctor as any).profilePhoto ||
              null;
            const docName = formatDoctorName(doctor.user?.name);
            const spec = doctor.specialization || 'General Physician';
            const exp = Number(doctor.experience || 0);

            return (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorItemCard}
                onPress={() => setSelectedDoctor(doctor)}
                activeOpacity={0.88}
              >
                <View style={styles.doctorCardContent}>
                  {/* Doctor Avatar / Image */}
                  <View style={styles.doctorAvatarBox}>
                    {avatarSrc ? (
                      <Image
                        source={{ uri: getImageUrl(avatarSrc) }}
                        style={styles.doctorCardImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.doctorCardInitials}>
                        {getDoctorInitials(doctor.user?.name)}
                      </Text>
                    )}

                    {exp > 0 && (
                      <View style={styles.expBadge}>
                        <Icon name="award" size={10} color="#F59E0B" />
                        <Text style={styles.expBadgeText}>{exp}+ yrs</Text>
                      </View>
                    )}
                  </View>

                  {/* Meta info */}
                  <View style={styles.doctorCardMeta}>
                    <Text style={styles.doctorCardName} numberOfLines={1}>
                      {docName}
                    </Text>
                    <View style={styles.specRow}>
                      <Icon name="stethoscope" size={12} color="#0D9488" />
                      <Text style={styles.doctorCardSpec} numberOfLines={1}>
                        {spec}
                      </Text>
                    </View>

                    {doctor.fee != null && (
                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Fee: </Text>
                        <Text style={styles.feeValue}>₹{doctor.fee}</Text>
                      </View>
                    )}

                    {/* Select Doctor Pill */}
                    <View style={styles.selectBtnPill}>
                      <Text style={styles.selectBtnPillText}>Select Doctor</Text>
                      <Icon name="arrow-right" size={13} color={Colors.light.primary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  headerBlock: {
    gap: 3,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  mainSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    padding: 0,
  },
  doctorsGrid: {
    gap: Spacing.three,
  },
  doctorItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    ...Shadows.sm,
    overflow: 'hidden',
  },
  doctorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  doctorAvatarBox: {
    width: 68,
    height: 68,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorCardImg: {
    width: '100%',
    height: '100%',
  },
  doctorCardInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  expBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doctorCardMeta: {
    flex: 1,
    gap: 3,
  },
  doctorCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doctorCardSpec: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
    flex: 1,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  feeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink500,
  },
  feeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  selectBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  selectBtnPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.light.ink400,
    textAlign: 'center',
  },

  // STAGE 2 STYLES
  bookingContainer: {
    gap: Spacing.three,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  selectedDocCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    ...Shadows.sm,
  },
  selectedDocContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  selectedDocAvatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: '#EFF6FF',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  selectedDocImg: {
    width: '100%',
    height: '100%',
  },
  selectedDocInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#059669',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDocMeta: {
    flex: 1,
    gap: 2,
  },
  selectedDocName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  selectedDocSpec: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  selectedDocFeeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.md,
    marginTop: 2,
  },
  selectedDocFee: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    ...Shadows.md,
  },
  formContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: Spacing.three,
  },
  formIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formHeaderMeta: {
    flex: 1,
    gap: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  formSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  formSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.three,
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  loadingText: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  noDatesBox: {
    padding: Spacing.three,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  noDatesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  dateStripScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    minWidth: 62,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    gap: 2,
  },
  dateChipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EFF6FF',
  },
  dateChipTop: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.ink400,
    textTransform: 'uppercase',
  },
  dateChipTopSelected: {
    color: Colors.light.primary,
  },
  dateChipBottom: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.ink800,
  },
  dateChipBottomSelected: {
    color: Colors.light.primary,
  },
  emptySessionPrompt: {
    fontSize: 11,
    color: Colors.light.ink400,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sessionList: {
    gap: 8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  sessionCardSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  sessionCardFull: {
    opacity: 0.5,
    backgroundColor: Colors.light.surface100,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  sessionTimeTextSelected: {
    color: '#0D9488',
  },
  slotsBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },
  slotsBadgeOpen: {
    backgroundColor: '#ECFDF5',
  },
  slotsBadgeFull: {
    backgroundColor: '#FEF2F2',
  },
  slotsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  slotsBadgeTextOpen: {
    color: '#047857',
  },
  slotsBadgeTextFull: {
    color: '#DC2626',
  },
  noSessionsBox: {
    padding: Spacing.three,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  noSessionsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  inputWrapExisting: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.ink900,
    padding: 0,
  },
  existingPatientAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  existingPatientAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  nameAgeRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  nameCol: {
    flex: 2,
    gap: 6,
  },
  ageCol: {
    flex: 1,
    gap: 6,
  },
  ageInputWrap: {
    justifyContent: 'center',
  },
  ageTextInput: {
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
