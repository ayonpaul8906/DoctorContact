import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useWorkingHours,
  useSetWorkingHours,
  useHolidays,
  useAddHoliday,
  useRemoveHoliday,
} from '../../hooks/useClinic';
import {
  GradientCard,
  Icon,
  TimePickerModal,
  DatePickerModal,
} from '../../components';
import type { WorkingHour, DayOfWeek } from '../../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const ALL_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export default function ClinicScheduleScreen() {
  const {
    data: hoursData = [],
    isLoading: loadingHours,
    refetch: refetchHours,
    isRefetching: refetchingHours,
  } = useWorkingHours();

  const {
    data: holidays = [],
    isLoading: loadingHolidays,
    refetch: refetchHolidays,
    isRefetching: refetchingHolidays,
  } = useHolidays();

  const setWorkingHoursMutation = useSetWorkingHours();
  const addHolidayMutation = useAddHoliday();
  const removeHolidayMutation = useRemoveHoliday();

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [pickingScheduleTime, setPickingScheduleTime] = useState<{
    dayIndex: number;
    field: 'openTime' | 'closeTime';
  } | null>(null);
  const [showHolidayDatePicker, setShowHolidayDatePicker] = useState(false);

  useEffect(() => {
    if (hoursData.length > 0) {
      setWorkingHours(hoursData);
    } else {
      // Default structure
      setWorkingHours(
        ALL_DAYS.map((day) => ({
          dayOfWeek: day,
          isClosed: day === 'SUNDAY',
          openTime: '09:00',
          closeTime: '21:00',
        }))
      );
    }
  }, [hoursData]);

  const handleRefreshAll = () => {
    refetchHours();
    refetchHolidays();
  };

  const handleToggleDayClosed = (index: number) => {
    setWorkingHours((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        isClosed: !copy[index].isClosed,
      };
      return copy;
    });
  };

  const handleSaveWorkingHours = async () => {
    try {
      const payload = workingHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isClosed: h.isClosed,
        openTime: h.isClosed ? null : h.openTime || '09:00',
        closeTime: h.isClosed ? null : h.closeTime || '21:00',
      }));
      await setWorkingHoursMutation.mutateAsync(payload as any);
      Alert.alert('Hours Saved', 'Clinic operating hours have been updated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to save hours.');
    }
  };

  const handleUpdateTime = (index: number, field: 'openTime' | 'closeTime', val: string) => {
    setWorkingHours((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddHoliday = async () => {
    if (!holidayDate.trim()) {
      Alert.alert('Required', 'Please select a holiday date from the calendar.');
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
      Alert.alert('Holiday Added', 'The practice holiday has been registered.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to add holiday.');
    }
  };

  const handleRemoveHoliday = (holidayId: string, date: string) => {
    Alert.alert(
      'Remove Holiday',
      `Are you sure you want to remove the holiday on ${date}?`,
      [
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
      ]
    );
  };

  const isLoading = loadingHours || loadingHolidays;
  const isRefetching = refetchingHours || refetchingHolidays;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefreshAll}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* 1. Header Card */}
        <GradientCard variant="blue" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Operating Schedule</Text>
            <Text style={styles.headerSubtitle}>
              Configure your clinic weekly working hours and scheduled holidays
            </Text>
          </View>
        </GradientCard>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.centerStateText}>Loading operating schedule...</Text>
          </View>
        ) : (
          <>
            {/* 2. Weekly Working Hours */}
            <GradientCard variant="blue" style={styles.sectionCard}>
              <View style={styles.sectionContent}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionIconBox}>
                    <Icon name="clock" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sectionTitle}>Weekly Working Hours</Text>
                </View>

                <View style={styles.hoursList}>
                  {workingHours.map((wh, idx) => (
                    <View key={wh.dayOfWeek} style={styles.dayCard}>
                      <View style={styles.dayRow}>
                        <View style={styles.dayCol}>
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
                            styles.toggleDayBtn,
                            wh.isClosed ? styles.toggleClosed : styles.toggleOpen,
                          ]}
                          onPress={() => handleToggleDayClosed(idx)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.toggleDayText,
                              wh.isClosed ? styles.toggleTextClosed : styles.toggleTextOpen,
                            ]}
                          >
                            {wh.isClosed ? 'Mark Open' : 'Mark Closed'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!wh.isClosed && (
                        <View style={styles.timeInputsRow}>
                          <View style={styles.timeInputCol}>
                            <Text style={styles.timeInputLabel}>Open Time</Text>
                            <TouchableOpacity
                              style={styles.timePickerTrigger}
                              onPress={() => setPickingScheduleTime({ dayIndex: idx, field: 'openTime' })}
                              activeOpacity={0.7}
                            >
                              <Icon name="clock" size={12} color={Colors.light.ink600} />
                              <Text style={styles.timePickerTriggerText}>{wh.openTime || '09:00'}</Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.timeToText}>to</Text>

                          <View style={styles.timeInputCol}>
                            <Text style={styles.timeInputLabel}>Close Time</Text>
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

            {/* 3. Clinic Holidays */}
            <GradientCard variant="green" style={styles.sectionCard}>
              <View style={styles.sectionContent}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#10B981' }]}>
                    <Icon name="calendar-days" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.sectionTitle}>Scheduled Holidays</Text>
                    <Text style={styles.sectionSub}>{holidays.length} Registered dates</Text>
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
                  <Text style={styles.noHolidaysText}>
                    No upcoming holidays scheduled for this clinic center.
                  </Text>
                ) : (
                  <View style={styles.holidaysList}>
                    {holidays.map((h) => (
                      <View key={h.id} style={styles.holidayRow}>
                        <View style={styles.holidayInfoCol}>
                          <Text style={styles.holidayDate}>{h.date}</Text>
                          <Text style={styles.holidayReason}>{h.reason || 'General Holiday'}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.removeHolidayBtn}
                          onPress={() => handleRemoveHoliday(h.id, h.date)}
                          activeOpacity={0.8}
                        >
                          <Icon name="trash-2" size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </GradientCard>
          </>
        )}
      </ScrollView>

      {/* Add Holiday Modal */}
      <Modal
        visible={showAddHolidayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddHolidayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Practice Holiday</Text>
                <TouchableOpacity
                  onPress={() => setShowAddHolidayModal(false)}
                  style={styles.closeBtn}
                >
                  <Icon name="x" size={18} color={Colors.light.ink600} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
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
                  style={styles.submitHolidayBtn}
                  onPress={handleAddHoliday}
                  disabled={addHolidayMutation.isPending}
                  activeOpacity={0.85}
                >
                  {addHolidayMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitHolidayBtnText}>Confirm Holiday</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Pickers */}
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
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  headerCard: {
    marginBottom: 0,
  },
  headerContent: {
    padding: Spacing.four,
    gap: 2,
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
  centerState: {
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  centerStateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  sectionCard: {
    marginBottom: 0,
  },
  sectionContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  sectionSub: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  flex1: {
    flex: 1,
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
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
  },
  timeInputCol: {
    flex: 1,
    gap: 2,
  },
  timeInputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  timeInputBox: {
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
  timeToText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink400,
    marginTop: 14,
  },
  dayCol: {
    gap: 2,
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
  toggleDayBtn: {
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
  toggleDayText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleTextOpen: {
    color: '#DC2626',
  },
  toggleTextClosed: {
    color: '#047857',
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
  noHolidaysText: {
    fontSize: 12,
    color: Colors.light.ink500,
    fontStyle: 'italic',
    paddingVertical: Spacing.two,
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
  holidayInfoCol: {
    gap: 2,
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
  removeHolidayBtn: {
    padding: 6,
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
  modalForm: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingBottom: Spacing.six,
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
  submitHolidayBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.sm,
  },
  submitHolidayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
