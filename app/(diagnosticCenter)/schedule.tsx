import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCenterWorkingHours,
  useUpdateCenterWorkingHours,
  type WorkingHour,
} from '../../hooks/useDiagnostic';
import { Icon } from '../../components/Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

const DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
];

export default function CenterScheduleScreen() {
  const { data: serverHours, isLoading, refetch, isRefetching } = useCenterWorkingHours();
  const updateMutation = useUpdateCenterWorkingHours();

  const [hours, setHours] = useState<WorkingHour[]>([]);

  useEffect(() => {
    if (serverHours) {
      const formatted: WorkingHour[] = DAYS.map((d) => {
        const match = serverHours.find((h) => h.dayOfWeek === d.key);
        return {
          dayOfWeek: d.key,
          openTime: match?.openTime || '09:00',
          closeTime: match?.closeTime || '18:00',
          isClosed: match?.isClosed ?? false,
        };
      });
      setHours(formatted);
    } else if (!isLoading) {
      setHours(
        DAYS.map((d) => ({
          dayOfWeek: d.key,
          openTime: '09:00',
          closeTime: '18:00',
          isClosed: d.key === 'SUNDAY',
        }))
      );
    }
  }, [serverHours, isLoading]);

  const handleToggleClosed = (index: number) => {
    setHours((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isClosed: !next[index].isClosed };
      return next;
    });
  };

  const handleTimeChange = (
    index: number,
    field: 'openTime' | 'closeTime',
    val: string
  ) => {
    setHours((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleApplyToAllWeekdays = () => {
    if (hours.length === 0) return;
    const monday = hours[0];
    setHours((prev) =>
      prev.map((h, i) => {
        if (i > 0 && i < 5) {
          return {
            ...h,
            openTime: monday.openTime,
            closeTime: monday.closeTime,
            isClosed: monday.isClosed,
          };
        }
        return h;
      })
    );
    Alert.alert('Applied', "Monday's operating hours applied to Tuesday through Friday.");
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(hours);
      Alert.alert('Success', 'Diagnostic Center operating hours saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save working hours.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Operating Hours & Schedule</Text>
            <Text style={styles.headerSubtitle}>
              Define opening times and sample collection days for patients
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetch()}
            disabled={isRefetching}
          >
            <Icon name="refresh-cw" size={16} color="#0F766E" />
          </TouchableOpacity>
        </View>

        {/* Quick Shortcut Card */}
        <View style={styles.shortcutCard}>
          <View style={styles.shortcutInfo}>
            <Icon name="sparkles" size={16} color="#0F766E" />
            <Text style={styles.shortcutText}>
              Set Monday's timing once, then copy to all weekdays
            </Text>
          </View>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={handleApplyToAllWeekdays}
          >
            <Text style={styles.shortcutBtnText}>Copy Mon → Fri</Text>
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        )}

        {/* Schedule List */}
        {!isLoading && (
          <View style={styles.daysList}>
            {DAYS.map((d, index) => {
              const current = hours[index] || {
                dayOfWeek: d.key,
                openTime: '09:00',
                closeTime: '18:00',
                isClosed: false,
              };

              return (
                <View
                  key={d.key}
                  style={[
                    styles.dayCard,
                    current.isClosed && styles.dayCardClosed,
                  ]}
                >
                  <View style={styles.dayHeader}>
                    <View style={styles.dayLabelWrap}>
                      <Text
                        style={[
                          styles.dayName,
                          current.isClosed && styles.dayNameClosed,
                        ]}
                      >
                        {d.label}
                      </Text>
                      <View
                        style={[
                          styles.dayStatusBadge,
                          {
                            backgroundColor: current.isClosed
                              ? '#FEF2F2'
                              : '#F0FDFA',
                            borderColor: current.isClosed
                              ? '#FECACA'
                              : '#CCFBF1',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayStatusText,
                            {
                              color: current.isClosed
                                ? '#DC2626'
                                : '#0F766E',
                            },
                          ]}
                        >
                          {current.isClosed ? 'Closed' : 'Open'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.toggleWrap}>
                      <Text style={styles.toggleLabel}>Open</Text>
                      <Switch
                        value={!current.isClosed}
                        onValueChange={() => handleToggleClosed(index)}
                        trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
                        thumbColor={!current.isClosed ? '#0F766E' : '#94A3B8'}
                      />
                    </View>
                  </View>

                  {!current.isClosed ? (
                    <View style={styles.timeInputsRow}>
                      <View style={styles.timeInputCol}>
                        <Text style={styles.timeFieldLabel}>Opening Time</Text>
                        <View style={styles.timeInputBox}>
                          <Icon name="clock" size={14} color="#64748B" />
                          <TextInput
                            style={styles.timeTextInput}
                            value={current.openTime}
                            onChangeText={(t) =>
                              handleTimeChange(index, 'openTime', t)
                            }
                            placeholder="09:00"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>
                      </View>

                      <View style={styles.timeArrowBox}>
                        <Icon name="arrow-right" size={14} color="#94A3B8" />
                      </View>

                      <View style={styles.timeInputCol}>
                        <Text style={styles.timeFieldLabel}>Closing Time</Text>
                        <View style={styles.timeInputBox}>
                          <Icon name="clock" size={14} color="#64748B" />
                          <TextInput
                            style={styles.timeTextInput}
                            value={current.closeTime}
                            onChangeText={(t) =>
                              handleTimeChange(index, 'closeTime', t)
                            }
                            placeholder="18:00"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.closedNoticeRow}>
                      <Icon name="clock" size={13} color="#94A3B8" />
                      <Text style={styles.closedNoticeText}>
                        Center is closed on this day. No tests will be scheduled.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveScheduleBtn,
                updateMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="save" size={18} color="#FFFFFF" />
                  <Text style={styles.saveScheduleBtnText}>Save Operating Schedule</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 90,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.one,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.two,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  shortcutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  shortcutText: {
    fontSize: 11.5,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
  },
  shortcutBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  shortcutBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  loadingBox: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  daysList: {
    gap: Spacing.three,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dayCardClosed: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E2E8F0',
    opacity: 0.9,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayNameClosed: {
    color: '#64748B',
  },
  dayStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  dayStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeInputCol: {
    flex: 1,
  },
  timeFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  timeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    height: 38,
  },
  timeTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeArrowBox: {
    paddingTop: 16,
  },
  closedNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.one,
  },
  closedNoticeText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  saveScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginTop: Spacing.two,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
