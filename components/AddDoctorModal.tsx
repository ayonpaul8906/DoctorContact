import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAddDoctor } from '../hooks/useClinic';
import { api } from '../lib/api';
import { Icon } from './Icon';
import { DropdownModal } from './DropdownModal';
import { TimePickerModal } from './TimePickerModal';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId?: string;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const WEEKS = [
  { label: '1st', val: '1' },
  { label: '2nd', val: '2' },
  { label: '3rd', val: '3' },
  { label: '4th', val: '4' },
  { label: 'Last', val: 'LAST' },
];

const SCHEDULE_TYPE_OPTIONS = [
  { label: 'Daily (Every Day)', value: 'DAILY' },
  { label: 'Weekly (Custom Days)', value: 'WEEKLY' },
  { label: 'Monthly (Specific Date)', value: 'MONTHLY_DATE' },
  { label: 'Monthly (Specific Weekday)', value: 'MONTHLY_WEEKDAY' },
  { label: 'Specific Date (Exception)', value: 'SPECIFIC_DATE' },
];

export function AddDoctorModal({ isOpen, onClose, clinicId }: AddDoctorModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');

  // Dropdown states
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const [showScheduleTypeDropdown, setShowScheduleTypeDropdown] = useState(false);
  const [pickingTimeFor, setPickingTimeFor] = useState<'start' | 'end' | null>(null);

  // Initial Schedule Setup state
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [capacity, setCapacity] = useState('20');
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY_DATE' | 'MONTHLY_WEEKDAY' | 'SPECIFIC_DATE'>('DAILY');
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [recurrenceDate, setRecurrenceDate] = useState('1');
  const [recurrenceWeek, setRecurrenceWeek] = useState('1');
  const [recurrenceWeekday, setRecurrenceWeekday] = useState('MONDAY');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);

  const [specializationsList, setSpecializationsList] = useState<{ id: string; name: string }[]>([]);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isExistingDoctor, setIsExistingDoctor] = useState(false);

  const addDoctorMutation = useAddDoctor();

  useEffect(() => {
    async function fetchSpecializations() {
      try {
        const res = await api.get('/specializations');
        if (res.data?.success && Array.isArray(res.data?.data?.specializations)) {
          setSpecializationsList(res.data.data.specializations);
        }
      } catch {
        // ignore
      }
    }
    if (isOpen) {
      fetchSpecializations();
    }
  }, [isOpen]);

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;
    setIsCheckingEmail(true);
    try {
      const res = await api.get(`/doctors/search-email?email=${email.trim()}`);
      const foundDoctor = res.data?.data?.doctors?.[0];
      if (foundDoctor) {
        setName(foundDoctor.user?.name || name);
        setPhone(foundDoctor.user?.phone || phone);
        setSpecialization(foundDoctor.specialization || specialization);
        setQualification(foundDoctor.qualification || qualification);
        if (foundDoctor.experience != null) setExperience(String(foundDoctor.experience));
        if (foundDoctor.fee != null) setFee(String(foundDoctor.fee));
        setIsExistingDoctor(true);
        Alert.alert('Doctor Found', 'Existing doctor account profile found and auto-filled.');
      } else {
        setIsExistingDoctor(false);
      }
    } catch {
      setIsExistingDoctor(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setSpecialization('');
    setQualification('');
    setExperience('');
    setFee('');
    setStartTime('09:00 AM');
    setEndTime('05:00 PM');
    setCapacity('20');
    setRecurrenceType('DAILY');
    setRecurrenceDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
    setIsExistingDoctor(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter doctor full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address.');
      return;
    }
    if (!isExistingDoctor && (!password.trim() || password.length < 6)) {
      Alert.alert('Required', 'Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await addDoctorMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || (undefined as any),
        phone: phone.trim() || undefined,
        specialization: specialization.trim() || undefined,
        qualification: qualification.trim() || undefined,
        experience: experience ? parseInt(experience, 10) : undefined,
        fee: fee ? parseInt(fee, 10) : undefined,
      });

      const doctorId = res?.doctor?.id || res?.id || res?.data?.doctor?.id || res?.data?.id;

      if (doctorId && clinicId) {
        let recurrencePattern: any = {};
        if (recurrenceType === 'WEEKLY') recurrencePattern = { days: recurrenceDays };
        if (recurrenceType === 'MONTHLY_DATE') recurrencePattern = { date: Number(recurrenceDate) };
        if (recurrenceType === 'MONTHLY_WEEKDAY') recurrencePattern = { week: recurrenceWeek === 'LAST' ? 'LAST' : Number(recurrenceWeek), day: recurrenceWeekday };
        if (recurrenceType === 'SPECIFIC_DATE') recurrencePattern = { exactDate: specificDate };

        try {
          await api.post(`/doctors/${doctorId}/clinics/${clinicId}/schedules`, {
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            maxPatients: capacity ? Number(capacity) : 20,
            recurrenceType,
            recurrencePattern,
          });
        } catch (scheduleErr) {
          console.error('Schedule setup failed', scheduleErr);
        }
      }

      onClose();
      resetForm();
      Alert.alert('Success', 'Doctor and Initial Schedule registered successfully under clinic.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to add doctor.');
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', flex: 1, justifyContent: 'center' }}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add New Doctor</Text>
                <Text style={styles.modalSubtitle}>Register doctor and configure initial schedule</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="x" size={18} color={Colors.light.ink600} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
            <View style={styles.formContainer}>
              {/* Email Address with lookup */}
              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.formLabel}>Email Address *</Text>
                  {isCheckingEmail && <ActivityIndicator size="small" color={Colors.light.primary} />}
                  {isExistingDoctor && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>
                      Existing Doctor Profile Auto-filled
                    </Text>
                  )}
                </View>
                <TextInput
                  style={[styles.formInput, isExistingDoctor && styles.existingInput]}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={handleEmailBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="doctor@example.com"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              {/* Doctor Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Doctor Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {isExistingDoctor ? 'Account Password (Optional for existing doctor)' : 'Account Password *'}
                </Text>
                <TextInput
                  style={styles.formInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder={isExistingDoctor ? 'Leave blank to keep existing password' : 'Minimum 6 characters'}
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              {/* Specialization Category Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Specialization Category</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setShowSpecDropdown(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownTriggerText,
                      !specialization && styles.dropdownTriggerPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {specialization || '-- Select Specialization --'}
                  </Text>
                  <Icon name="chevron-down" size={13} color={Colors.light.ink500} />
                </TouchableOpacity>
              </View>

              {/* Qualification & Experience */}
              <View style={styles.rowTwo}>
                <View style={styles.flex1}>
                  <Text style={styles.formLabel}>Qualification</Text>
                  <TextInput
                    style={styles.formInput}
                    value={qualification}
                    onChangeText={setQualification}
                    placeholder="e.g. MBBS, MD"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.flex1}>
                  <Text style={styles.formLabel}>Experience (Yrs)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={experience}
                    onChangeText={setExperience}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>
              </View>

              {/* Consultation Fee */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Consultation Fee (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  value={fee}
                  onChangeText={setFee}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor={Colors.light.ink400}
                />
              </View>

              {/* ============================================================ */}
              {/* INITIAL SCHEDULE SETUP (Matching webapp) */}
              {/* ============================================================ */}
              <View style={styles.scheduleBox}>
                <View style={styles.scheduleHeaderRow}>
                  <Icon name="calendar" size={16} color="#047857" />
                  <Text style={styles.scheduleTitle}>Initial Schedule Setup</Text>
                </View>
                <Text style={styles.scheduleSubtitle}>Configure the doctor's initial practicing time slot</Text>

                <View style={styles.rowTwo}>
                  <View style={styles.flex1}>
                    <Text style={styles.scheduleLabel}>Start Time *</Text>
                    <TouchableOpacity
                      style={styles.timePickerTrigger}
                      onPress={() => setPickingTimeFor('start')}
                      activeOpacity={0.8}
                    >
                      <Icon name="clock" size={13} color="#166534" />
                      <Text style={styles.timePickerTriggerText}>{startTime || '09:00 AM'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.scheduleLabel}>End Time *</Text>
                    <TouchableOpacity
                      style={styles.timePickerTrigger}
                      onPress={() => setPickingTimeFor('end')}
                      activeOpacity={0.8}
                    >
                      <Icon name="clock" size={13} color="#166534" />
                      <Text style={styles.timePickerTriggerText}>{endTime || '05:00 PM'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.rowTwo, { marginTop: 10 }]}>
                  <View style={styles.flex1}>
                    <Text style={styles.scheduleLabel}>Capacity (Slots)</Text>
                    <TextInput
                      style={styles.scheduleInput}
                      value={capacity}
                      onChangeText={setCapacity}
                      keyboardType="numeric"
                      placeholder="20"
                      placeholderTextColor={Colors.light.ink400}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.scheduleLabel}>Schedule Type</Text>
                    <TouchableOpacity
                      style={styles.scheduleDropdownTrigger}
                      onPress={() => setShowScheduleTypeDropdown(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.scheduleDropdownTriggerText} numberOfLines={1}>
                        {SCHEDULE_TYPE_OPTIONS.find((o) => o.value === recurrenceType)?.label || 'Daily (Every Day)'}
                      </Text>
                      <Icon name="chevron-down" size={13} color="#166534" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Day selector for weekly recurrence */}
                {recurrenceType === 'WEEKLY' && (
                  <View style={styles.weeklyDaysRow}>
                    <Text style={styles.scheduleLabel}>Practice Days</Text>
                    <View style={styles.daysChipWrap}>
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = recurrenceDays.includes(day);
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[styles.dayChip, isSelected && styles.dayChipActive]}
                            onPress={() => {
                              setRecurrenceDays((prev) =>
                                prev.includes(day)
                                  ? prev.filter((d) => d !== day)
                                  : [...prev, day]
                              );
                            }}
                          >
                            <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                              {day.slice(0, 3)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Monthly Date */}
                {recurrenceType === 'MONTHLY_DATE' && (
                  <View style={styles.customRecurrenceRow}>
                    <Text style={styles.customRecurrenceLabel}>Every Month on Day:</Text>
                    <TextInput
                      style={styles.smallNumInput}
                      value={recurrenceDate}
                      onChangeText={setRecurrenceDate}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                )}

                {/* Monthly Weekday */}
                {recurrenceType === 'MONTHLY_WEEKDAY' && (
                  <View style={styles.customRecurrenceRow}>
                    <Text style={styles.customRecurrenceLabel}>Every:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      {WEEKS.map((w) => (
                        <TouchableOpacity
                          key={w.val}
                          style={[styles.miniChip, recurrenceWeek === w.val && styles.miniChipActive]}
                          onPress={() => setRecurrenceWeek(w.val)}
                        >
                          <Text style={[styles.miniChipText, recurrenceWeek === w.val && styles.miniChipTextActive]}>
                            {w.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Specific Date */}
                {recurrenceType === 'SPECIFIC_DATE' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.scheduleLabel}>Exception Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.scheduleInput}
                      value={specificDate}
                      onChangeText={setSpecificDate}
                      placeholder="2026-09-25"
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
                disabled={addDoctorMutation.isPending}
                activeOpacity={0.85}
              >
                {addDoctorMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm & Save Doctor</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>

      {/* Specialization Dropdown */}
      <DropdownModal
        visible={showSpecDropdown}
        title="Select Specialization"
        options={specializationsList.map((s) => ({ label: s.name, value: s.name }))}
        selectedValue={specialization}
        onSelect={(val) => setSpecialization(val)}
        onClose={() => setShowSpecDropdown(false)}
        placeholder="Search specialization..."
      />

      {/* Schedule Type Dropdown */}
      <DropdownModal
        visible={showScheduleTypeDropdown}
        title="Select Schedule Type"
        options={SCHEDULE_TYPE_OPTIONS}
        selectedValue={recurrenceType}
        onSelect={(val) => setRecurrenceType(val as any)}
        onClose={() => setShowScheduleTypeDropdown(false)}
        searchable={false}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={pickingTimeFor !== null}
        title={pickingTimeFor === 'start' ? 'Select Start Time' : 'Select End Time'}
        value={pickingTimeFor === 'start' ? startTime : endTime}
        onSelect={(time) => {
          if (pickingTimeFor === 'start') setStartTime(time);
          if (pickingTimeFor === 'end') setEndTime(time);
        }}
        onClose={() => setPickingTimeFor(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: '600',
    color: Colors.light.ink900,
    flex: 1,
    marginRight: 6,
  },
  dropdownTriggerPlaceholder: {
    color: Colors.light.ink400,
  },
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timePickerTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  scheduleDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scheduleDropdownTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
    marginRight: 4,
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
  modalSubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    marginTop: Spacing.two,
  },
  formContainer: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  formGroup: {
    gap: 4,
  },
  existingInput: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
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
  chipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  specChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginRight: 6,
  },
  specChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  specChipTextActive: {
    color: '#FFFFFF',
  },
  scheduleBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    marginTop: 4,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  scheduleSubtitle: {
    fontSize: 11,
    color: '#15803D',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  scheduleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
  },
  recurrencePillWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  typeMiniBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  typeMiniBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  typeMiniBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  typeMiniBtnTextActive: {
    color: '#FFFFFF',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  extraTypeBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  extraTypeBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  extraTypeBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  extraTypeBtnTextActive: {
    color: '#FFFFFF',
  },
  weeklyDaysRow: {
    marginTop: 8,
  },
  daysChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  dayChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  dayChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  dayChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  customRecurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  customRecurrenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  smallNumInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
    width: 40,
    textAlign: 'center',
  },
  miniChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginRight: 4,
  },
  miniChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  miniChipTextActive: {
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
});
