import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Icon } from './Icon';
import type { DoctorScheduleSlot } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

function getSessionLabel(startTime: string) {
  if (startTime < '12:00') return 'Morning';
  if (startTime < '17:00') return 'Afternoon';
  return 'Evening';
}

interface DoctorSessionSelectorProps {
  schedules: DoctorScheduleSlot[];
  selectedScheduleId: string;
  onSelect: (scheduleId: string) => void;
}

export function DoctorSessionSelector({
  schedules,
  selectedScheduleId,
  onSelect,
}: DoctorSessionSelectorProps) {
  const activeSchedules = schedules.filter((s) => s.isActive);

  // If 1 or fewer sessions, no picker needed
  if (activeSchedules.length <= 1) return null;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Icon name="clock" size={14} color={Colors.light.ink500} />
        <Text style={styles.label}>Select Session:</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {activeSchedules.map((schedule) => {
          const isSelected = schedule.id === selectedScheduleId;
          const label = getSessionLabel(schedule.startTime);

          return (
            <TouchableOpacity
              key={schedule.id}
              style={[
                styles.sessionChip,
                isSelected ? styles.sessionChipActive : styles.sessionChipInactive,
              ]}
              onPress={() => onSelect(schedule.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.sessionChipText,
                  isSelected ? styles.sessionChipTextActive : styles.sessionChipTextInactive,
                ]}
              >
                {label} · {schedule.startTime}–{schedule.endTime}
              </Text>
              {schedule.maxPatients > 0 && (
                <View
                  style={[
                    styles.capacityBadge,
                    isSelected ? styles.capacityBadgeActive : styles.capacityBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.capacityText,
                      isSelected ? styles.capacityTextActive : styles.capacityTextInactive,
                    ]}
                  >
                    Max {schedule.maxPatients}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  sessionChipActive: {
    backgroundColor: '#252a67',
    borderColor: '#252a67',
    ...Shadows.sm,
  },
  sessionChipInactive: {
    backgroundColor: Colors.light.surface50,
    borderColor: Colors.light.surface200,
  },
  sessionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sessionChipTextActive: {
    color: '#FFFFFF',
  },
  sessionChipTextInactive: {
    color: Colors.light.ink700,
  },
  capacityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  capacityBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  capacityBadgeInactive: {
    backgroundColor: Colors.light.surface200,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  capacityTextActive: {
    color: '#FFFFFF',
  },
  capacityTextInactive: {
    color: Colors.light.ink600,
  },
});
