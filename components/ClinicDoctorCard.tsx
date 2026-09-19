import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { DropdownModal } from './DropdownModal';
import { TimePickerModal } from './TimePickerModal';
import { api } from '../lib/api';
import type { ClinicDoctor } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';

interface ClinicDoctorCardProps {
  doctor: ClinicDoctor;
  clinicId?: string;
  onEdit: (doctor: ClinicDoctor) => void;
  onViewQueue?: (doctor: ClinicDoctor) => void;
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

function getDoctorInitials(name?: string) {
  if (!name) return 'DR';
  return name
    .replace(/^(dr\.?\s*)+/i, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ClinicDoctorCard({
  doctor,
  clinicId,
  onEdit,
  onViewQueue,
}: ClinicDoctorCardProps) {
  const [showSchedules, setShowSchedules] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // New slot form states
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [maxPatients, setMaxPatients] = useState('20');
  const [recurrenceType, setRecurrenceType] = useState('DAILY');
  const [selectedDays, setSelectedDays] = useState<string[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [recurrenceDate, setRecurrenceDate] = useState('1');
  const [recurrenceWeek, setRecurrenceWeek] = useState('1');
  const [recurrenceWeekday, setRecurrenceWeekday] = useState('MONDAY');
  const [specificDate, setSpecificDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // Dropdown and time picker modal states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [pickingTimeFor, setPickingTimeFor] = useState<'start' | 'end' | null>(null);

  // Editing capacity inline
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editCapVal, setEditCapVal] = useState('20');

  const doctorName = doctor.user?.name || 'Practicing Doctor';
  const isActive = doctor.user?.isActive ?? true;
  const initials = getDoctorInitials(doctorName);
  const avatarUrl =
    doctor.user?.avatar ||
    doctor.user?.profilePhoto ||
    (doctor as any).profilePhoto ||
    (doctor as any).avatar ||
    null;
  const resolvedAvatar = getImageUrl(avatarUrl);

  const fetchSchedules = async () => {
    if (!clinicId || !doctor.id) return;
    setLoadingSchedules(true);
    try {
      const res = await api.get(`/doctors/${doctor.id}/clinics/${clinicId}/schedules`);
      if (res.data?.success) {
        setSchedules(res.data.data.schedules || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    if (showSchedules && clinicId) {
      fetchSchedules();
    }
  }, [showSchedules, clinicId, doctor.id]);

  const handleAddSession = async () => {
    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert('Required', 'Start Time and End Time are required (e.g. 09:00, 13:00).');
      return;
    }
    if (!clinicId) {
      Alert.alert('Error', 'Clinic ID unavailable.');
      return;
    }

    let recurrencePattern: any = {};
    if (recurrenceType === 'WEEKLY') {
      if (selectedDays.length === 0) {
        Alert.alert('Required', 'Please select at least one day for weekly schedule.');
        return;
      }
      recurrencePattern = { days: selectedDays };
    }
    if (recurrenceType === 'MONTHLY_DATE') {
      recurrencePattern = { date: Number(recurrenceDate || '1') };
    }
    if (recurrenceType === 'MONTHLY_WEEKDAY') {
      recurrencePattern = { week: recurrenceWeek === 'LAST' ? 'LAST' : Number(recurrenceWeek), day: recurrenceWeekday };
    }
    if (recurrenceType === 'SPECIFIC_DATE') {
      recurrencePattern = { exactDate: specificDate };
    }

    setIsSavingSlot(true);
    try {
      await api.post(`/doctors/${doctor.id}/clinics/${clinicId}/schedules`, {
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        maxPatients: maxPatients ? parseInt(maxPatients, 10) : 20,
        recurrenceType,
        recurrencePattern,
      });

      Alert.alert('Success', 'New time slot session added!');
      fetchSchedules();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message || 'Failed to save session');
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleUpdateCapacity = async (scheduleId: string) => {
    if (!clinicId) return;
    try {
      await api.put(`/doctors/${doctor.id}/clinics/${clinicId}/schedules/${scheduleId}`, {
        maxPatients: parseInt(editCapVal, 10) || 20,
      });
      setEditingScheduleId(null);
      fetchSchedules();
    } catch {
      Alert.alert('Error', 'Failed to update capacity');
    }
  };

  const handleDeleteSession = (scheduleId: string) => {
    if (!clinicId) return;
    Alert.alert('Delete Session', 'Remove this session completely?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/doctors/${doctor.id}/clinics/${clinicId}/schedules/${scheduleId}`);
            fetchSchedules();
          } catch {
            Alert.alert('Error', 'Failed to delete session');
          }
        },
      },
    ]);
  };

  return (
    <GradientCard variant="blue" style={styles.card}>
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.doctorInfoRow}>
            <View style={styles.avatarCircle}>
              {resolvedAvatar ? (
                <Image source={{ uri: resolvedAvatar }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
              {isActive && (
                <View style={styles.activeCheckBadge}>
                  <Icon name="check-circle" size={10} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.nameCol}>
              <View style={styles.titleRow}>
                <Text style={styles.doctorNameText} numberOfLines={1}>
                  Dr. {doctorName.replace(/^(dr\.?\s*)+/i, '')}
                </Text>
              </View>

              <Text style={styles.specText} numberOfLines={1}>
                {doctor.specialization || 'General Physician'}
              </Text>

              {doctor.user?.email ? (
                <View style={styles.emailRow}>
                  <Icon name="mail" size={11} color={Colors.light.ink400} />
                  <Text style={styles.emailText} numberOfLines={1}>
                    {doctor.user.email}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Action Buttons Row: Sessions & Edit Profile */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.sessionToggleBtn, showSchedules && styles.sessionToggleBtnActive]}
            onPress={() => setShowSchedules(!showSchedules)}
            activeOpacity={0.8}
          >
            <Icon
              name="calendar-days"
              size={13}
              color={showSchedules ? '#FFFFFF' : '#0D9488'}
            />
            <Text
              style={[
                styles.sessionToggleBtnText,
                showSchedules && styles.sessionToggleBtnTextActive,
              ]}
            >
              Sessions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => onEdit(doctor)}
            activeOpacity={0.8}
          >
            <Icon name="sliders" size={13} color={Colors.light.primary} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* 4 Info Tiles (when not viewing schedules) */}
        {!showSchedules && (
          <View style={styles.infoTilesGrid}>
            <View style={styles.infoTile}>
              <View style={styles.infoTileLabelRow}>
                <Icon name="award" size={11} color={Colors.light.primary} />
                <Text style={styles.infoTileLabel}>QUALIFICATION</Text>
              </View>
              <Text style={styles.infoTileVal} numberOfLines={1}>
                {doctor.qualification || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoTile}>
              <View style={styles.infoTileLabelRow}>
                <Icon name="star" size={11} color="#D97706" />
                <Text style={styles.infoTileLabel}>EXPERIENCE</Text>
              </View>
              <Text style={styles.infoTileVal} numberOfLines={1}>
                {doctor.experience != null ? `${doctor.experience} Yrs` : 'N/A'}
              </Text>
            </View>

            <View style={styles.infoTile}>
              <View style={styles.infoTileLabelRow}>
                <Icon name="dollar-sign" size={11} color="#059669" />
                <Text style={styles.infoTileLabel}>CONSULTATION FEE</Text>
              </View>
              <Text style={styles.infoTileVal} numberOfLines={1}>
                {doctor.fee != null ? `₹${doctor.fee}` : 'Free'}
              </Text>
            </View>

            <View style={styles.infoTile}>
              <View style={styles.infoTileLabelRow}>
                <Icon name="user-check" size={11} color={isActive ? '#047857' : '#DC2626'} />
                <Text style={styles.infoTileLabel}>STATUS</Text>
              </View>
              <Text
                style={[
                  styles.infoTileVal,
                  { color: isActive ? '#047857' : '#DC2626', fontWeight: '800' },
                ]}
                numberOfLines={1}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        )}

        {/* Expanded Inline Sessions Manager */}
        {showSchedules && (
          <View style={styles.sessionsPanel}>
            {/* Add New Time Slot Card */}
            <View style={styles.newSlotCard}>
              <Text style={styles.newSlotTitle}>Add New Time Slot</Text>

              <View style={styles.slotInputsRow}>
                <View style={styles.slotInputCol}>
                  <Text style={styles.slotInputLabel}>START TIME</Text>
                  <TouchableOpacity
                    style={styles.timeSlotTrigger}
                    onPress={() => setPickingTimeFor('start')}
                    activeOpacity={0.8}
                  >
                    <Icon name="clock" size={13} color={Colors.light.primary} />
                    <Text style={styles.timeSlotTriggerText}>{startTime || 'Select Time'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.slotInputCol}>
                  <Text style={styles.slotInputLabel}>END TIME</Text>
                  <TouchableOpacity
                    style={styles.timeSlotTrigger}
                    onPress={() => setPickingTimeFor('end')}
                    activeOpacity={0.8}
                  >
                    <Icon name="clock" size={13} color={Colors.light.primary} />
                    <Text style={styles.timeSlotTriggerText}>{endTime || 'Select Time'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.slotInputsRow}>
                <View style={styles.slotInputCol}>
                  <Text style={styles.slotInputLabel}>CAPACITY (PATIENTS)</Text>
                  <TextInput
                    style={styles.slotInput}
                    value={maxPatients}
                    onChangeText={setMaxPatients}
                    keyboardType="number-pad"
                    placeholder="20"
                    placeholderTextColor={Colors.light.ink400}
                  />
                </View>

                <View style={styles.slotInputCol}>
                  <Text style={styles.slotInputLabel}>SCHEDULE TYPE</Text>
                  <TouchableOpacity
                    style={styles.scheduleTypeDropdown}
                    onPress={() => setShowTypeDropdown(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.scheduleTypeDropdownText} numberOfLines={1}>
                      {SCHEDULE_TYPE_OPTIONS.find((o) => o.value === recurrenceType)?.label || 'Daily (Every Day)'}
                    </Text>
                    <Icon name="chevron-down" size={13} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {recurrenceType === 'WEEKLY' && (
                <View style={styles.daySelectorRow}>
                  {DAYS_OF_WEEK.map((d) => {
                    const isSel = selectedDays.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, isSel && styles.dayChipActive]}
                        onPress={() =>
                          setSelectedDays((prev) =>
                            prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
                          )
                        }
                      >
                        <Text style={[styles.dayChipText, isSel && styles.dayChipTextActive]}>
                          {d.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

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
                  <Text style={[styles.customRecurrenceLabel, { marginLeft: 4 }]}>{recurrenceWeekday}</Text>
                </View>
              )}

              {recurrenceType === 'SPECIFIC_DATE' && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.customRecurrenceLabel}>Exception Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={styles.slotInput}
                    value={specificDate}
                    onChangeText={setSpecificDate}
                    placeholder="2026-09-25"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.saveSlotBtn}
                onPress={handleAddSession}
                disabled={isSavingSlot}
                activeOpacity={0.85}
              >
                {isSavingSlot ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveSlotBtnText}>Save Time Slot</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Active Sessions List */}
            <View style={styles.activeSessionsSection}>
              <View style={styles.activeSessionsHeader}>
                <Icon name="calendar-days" size={13} color={Colors.light.ink500} />
                <Text style={styles.activeSessionsTitle}>Active Sessions</Text>
              </View>

              {loadingSchedules ? (
                <View style={styles.loadingSessionsBox}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                </View>
              ) : schedules.length === 0 ? (
                <Text style={styles.noSessionsText}>No sessions configured for this doctor.</Text>
              ) : (
                <View style={styles.schedulesList}>
                  {schedules.map((s) => (
                    <View key={s.id} style={styles.sessionItemBox}>
                      <View style={styles.sessionItemTop}>
                        <View>
                          <Text style={styles.sessionRecurrenceBadge}>
                            {(s.recurrenceType || 'DAILY').replace('_', ' ')}
                          </Text>
                          <Text style={styles.sessionTimeTitle}>
                            {s.startTime} - {s.endTime}
                          </Text>
                        </View>

                        <View style={styles.sessionActions}>
                          <TouchableOpacity
                            style={styles.sessionActionIconBtn}
                            onPress={() => {
                              setEditingScheduleId(s.id);
                              setEditCapVal(String(s.maxPatients || 20));
                            }}
                          >
                            <Icon name="sliders" size={12} color={Colors.light.primary} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.sessionActionIconBtn}
                            onPress={() => handleDeleteSession(s.id)}
                          >
                            <Icon name="trash-2" size={12} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {editingScheduleId === s.id ? (
                        <View style={styles.inlineCapEditRow}>
                          <Text style={styles.capLabel}>Limit:</Text>
                          <TextInput
                            style={styles.capInput}
                            value={editCapVal}
                            onChangeText={setEditCapVal}
                            keyboardType="number-pad"
                          />
                          <TouchableOpacity
                            style={styles.capSaveBtn}
                            onPress={() => handleUpdateCapacity(s.id)}
                          >
                            <Text style={styles.capSaveBtnText}>Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.capCancelBtn}
                            onPress={() => setEditingScheduleId(null)}
                          >
                            <Text style={styles.capCancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.sessionLimitRow}>
                          <Icon name="users" size={11} color={Colors.light.primary} />
                          <Text style={styles.sessionLimitText}>
                            Limit: <Text style={{ fontWeight: '800' }}>{s.maxPatients} Patients</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Schedule Type Dropdown */}
      <DropdownModal
        visible={showTypeDropdown}
        title="Select Schedule Type"
        options={SCHEDULE_TYPE_OPTIONS}
        selectedValue={recurrenceType}
        onSelect={(val) => setRecurrenceType(val as any)}
        onClose={() => setShowTypeDropdown(false)}
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
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  timeSlotTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  timeSlotTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  scheduleTypeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  scheduleTypeDropdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink800,
    flex: 1,
    marginRight: 4,
  },
  customRecurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  customRecurrenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  smallNumInput: {
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
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
    backgroundColor: Colors.light.surface100,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    marginRight: 4,
  },
  miniChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  miniChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    marginBottom: Spacing.three,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  nameCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  doctorNameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  activeCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#047857',
    borderRadius: Radius.full,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  specText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emailText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface100,
    paddingTop: Spacing.two,
  },
  sessionToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  sessionToggleBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  sessionToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  sessionToggleBtnTextActive: {
    color: '#FFFFFF',
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  infoTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  infoTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: 2,
  },
  infoTileLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoTileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    letterSpacing: 0.5,
  },
  infoTileVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  sessionsPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  newSlotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.two,
  },
  newSlotTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.ink800,
  },
  slotInputsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  slotInputCol: {
    flex: 1,
    gap: 3,
  },
  slotInputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  slotInput: {
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
  },
  scheduleTypeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  typePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface100,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  daySelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  dayChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  dayChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  dayChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  saveSlotBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  saveSlotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeSessionsSection: {
    gap: Spacing.two,
  },
  activeSessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeSessionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
  },
  loadingSessionsBox: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  noSessionsText: {
    fontSize: 12,
    color: Colors.light.ink400,
    fontStyle: 'italic',
  },
  schedulesList: {
    gap: Spacing.two,
  },
  sessionItemBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  sessionItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionRecurrenceBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionTimeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionActionIconBtn: {
    padding: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface100,
  },
  inlineCapEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  capLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  capInput: {
    width: 45,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  capSaveBtn: {
    backgroundColor: '#059669',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  capSaveBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  capCancelBtn: {
    backgroundColor: Colors.light.surface200,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  capCancelBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink700,
  },
  sessionLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionLimitText: {
    fontSize: 11,
    color: Colors.light.ink600,
  },
});
