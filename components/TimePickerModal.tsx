import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface TimePickerModalProps {
  visible: boolean;
  title?: string;
  value?: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}

const COMMON_TIME_SLOTS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
];

export function TimePickerModal({
  visible,
  title = 'Select Time',
  value = '',
  onSelect,
  onClose,
}: TimePickerModalProps) {
  const [selectedSlot, setSelectedSlot] = useState(value);
  const [customTime, setCustomTime] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    setSelectedSlot(value || '09:00 AM');
  }, [value, visible]);

  const handlePick = (slot: string) => {
    setSelectedSlot(slot);
    onSelect(slot);
    onClose();
  };

  const handleConfirmCustom = () => {
    if (customTime.trim()) {
      onSelect(customTime.trim());
      setCustomTime('');
      setIsCustomMode(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Icon name="clock" size={16} color={Colors.light.primary} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="x" size={18} color={Colors.light.ink600} />
            </TouchableOpacity>
          </View>

          {/* Current Selection & Mode Toggle */}
          <View style={styles.selectionBar}>
            <Text style={styles.selectionLabel}>Active Time:</Text>
            <Text style={styles.selectionValue}>{selectedSlot || 'None selected'}</Text>
          </View>

          {/* Slots Grid */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>Common Time Slots</Text>
            <View style={styles.grid}>
              {COMMON_TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot?.toLowerCase() === slot.toLowerCase();
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                    onPress={() => handlePick(slot)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Input Section */}
            <View style={styles.customSection}>
              <Text style={styles.sectionHeader}>Or Enter Custom Time</Text>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="e.g. 09:15 AM or 14:30"
                  value={customTime}
                  onChangeText={setCustomTime}
                  placeholderTextColor={Colors.light.ink400}
                />
                <TouchableOpacity
                  style={[styles.customConfirmBtn, !customTime.trim() && styles.customConfirmBtnDisabled]}
                  onPress={handleConfirmCustom}
                  disabled={!customTime.trim()}
                >
                  <Text style={styles.customConfirmBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.light.surfaceWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    maxHeight: '75%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  closeBtn: {
    padding: 4,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  selectionValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  scrollArea: {
    marginTop: Spacing.three,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.four,
  },
  slotCard: {
    width: '23%',
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
  customSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  customConfirmBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customConfirmBtnDisabled: {
    backgroundColor: Colors.light.ink300,
  },
  customConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
