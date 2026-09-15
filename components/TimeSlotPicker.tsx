import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface TimeSlotPickerProps {
  selectedTime: string; // HH:mm (e.g. "10:30")
  onSelectTime: (time: string) => void;
  selectedDate: string; // YYYY-MM-DD
}

interface SlotGroup {
  title: string;
  icon: 'clock' | 'activity' | 'pulse';
  slots: { label: string; time: string }[];
}

const SLOT_GROUPS: SlotGroup[] = [
  {
    title: 'Morning Slots',
    icon: 'clock',
    slots: [
      { label: '09:00 AM', time: '09:00' },
      { label: '09:30 AM', time: '09:30' },
      { label: '10:00 AM', time: '10:00' },
      { label: '10:30 AM', time: '10:30' },
      { label: '11:00 AM', time: '11:00' },
      { label: '11:30 AM', time: '11:30' },
    ],
  },
  {
    title: 'Afternoon Slots',
    icon: 'activity',
    slots: [
      { label: '01:00 PM', time: '13:00' },
      { label: '01:30 PM', time: '13:30' },
      { label: '02:00 PM', time: '14:00' },
      { label: '02:30 PM', time: '14:30' },
      { label: '03:00 PM', time: '15:00' },
      { label: '03:30 PM', time: '15:30' },
    ],
  },
  {
    title: 'Evening Slots',
    icon: 'pulse',
    slots: [
      { label: '05:00 PM', time: '17:00' },
      { label: '05:30 PM', time: '17:30' },
      { label: '06:00 PM', time: '18:00' },
      { label: '06:30 PM', time: '18:30' },
      { label: '07:00 PM', time: '19:00' },
      { label: '07:30 PM', time: '19:30' },
    ],
  },
];

export function TimeSlotPicker({
  selectedTime,
  onSelectTime,
  selectedDate,
}: TimeSlotPickerProps) {
  // Check if slot is in the past for today
  const isPastSlot = (timeStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate !== todayStr) return false;

    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);

    return slotDate <= now;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Consultation Time</Text>

      <View style={styles.groupsContainer}>
        {SLOT_GROUPS.map((group) => (
          <View key={group.title} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <Icon name={group.icon} size={14} color={Colors.light.primary} />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>

            <View style={styles.slotsGrid}>
              {group.slots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                const isPast = isPastSlot(slot.time);

                return (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.slotPill,
                      isSelected && styles.slotPillSelected,
                      isPast && styles.slotPillDisabled,
                    ]}
                    onPress={() => !isPast && onSelectTime(slot.time)}
                    disabled={isPast}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <Icon name="check" size={12} color="#FFFFFF" />
                    ) : null}
                    <Text
                      style={[
                        styles.slotText,
                        isSelected && styles.slotTextSelected,
                        isPast && styles.slotTextDisabled,
                      ]}
                    >
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  groupsContainer: {
    gap: Spacing.three,
  },
  groupCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    ...Shadows.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  slotPillSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: '#1E40AF',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  slotPillDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
  slotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  slotTextDisabled: {
    color: Colors.light.ink400,
    textDecorationLine: 'line-through',
  },
});
