import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DatePickerModalProps {
  visible: boolean;
  title?: string;
  value?: string; // Format: YYYY-MM-DD
  onSelect: (dateStr: string) => void;
  onClose: () => void;
  minDate?: string; // Format: YYYY-MM-DD
}

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DatePickerModal({
  visible,
  title = 'Select Date',
  value,
  onSelect,
  onClose,
  minDate,
}: DatePickerModalProps) {
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value, visible]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : new Date().toISOString().split('T')[0]
  );

  // Sync state when modal opens
  React.useEffect(() => {
    if (visible) {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
        setSelectedDateStr(value);
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        setSelectedDateStr(now.toISOString().split('T')[0]);
      }
    }
  }, [visible, value]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to fill up to 35 or 42 grid cells
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      for (let d = 1; d <= remaining; d++) {
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ day: d, dateStr, isCurrentMonth: false });
      }
    }

    return days;
  }, [viewYear, viewMonth]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleSelectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
  };

  const handleConfirm = () => {
    if (selectedDateStr) {
      onSelect(selectedDateStr);
      onClose();
    }
  };

  const handleSetToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDateStr(todayStr);
  };

  const handleSetTomorrow = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];
    setViewYear(tom.getFullYear());
    setViewMonth(tom.getMonth());
    setSelectedDateStr(tomStr);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.selectedSubtitle}>
                {selectedDateStr
                  ? new Date(
                      Number(selectedDateStr.split('-')[0]),
                      Number(selectedDateStr.split('-')[1]) - 1,
                      Number(selectedDateStr.split('-')[2])
                    ).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Pick a date'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Icon name="x" size={18} color={Colors.light.ink600} />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={18} color={Colors.light.ink800} />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={handleNextMonth}
              activeOpacity={0.7}
            >
              <Icon name="chevron-right" size={18} color={Colors.light.ink800} />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.quickPresetsRow}>
            <TouchableOpacity
              style={[styles.presetChip, selectedDateStr === todayStr && styles.presetChipActive]}
              onPress={handleSetToday}
              activeOpacity={0.8}
            >
              <Text style={[styles.presetChipText, selectedDateStr === todayStr && styles.presetChipTextActive]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={handleSetTomorrow}
              activeOpacity={0.8}
            >
              <Text style={styles.presetChipText}>Tomorrow</Text>
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekDaysRow}>
            {DAYS_SHORT.map((day) => (
              <Text key={day} style={styles.weekDayHeader}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Day Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, idx) => {
              const isSelected = selectedDateStr === item.dateStr;
              const isToday = todayStr === item.dateStr;
              const isDisabled = minDate ? item.dateStr < minDate : false;

              return (
                <TouchableOpacity
                  key={`${item.dateStr}_${idx}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                    !item.isCurrentMonth && styles.dayCellOutside,
                    isDisabled && styles.dayCellDisabled,
                  ]}
                  onPress={() => !isDisabled && handleSelectDay(item.dateStr)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                      !item.isCurrentMonth && styles.dayTextOutside,
                      isDisabled && styles.dayTextDisabled,
                    ]}
                  >
                    {item.day}
                  </Text>
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  selectedSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginVertical: 6,
  },
  navArrowBtn: {
    padding: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.light.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  presetChipTextActive: {
    color: Colors.light.primary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    marginTop: 4,
  },
  weekDayHeader: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.ink400,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: Colors.light.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  dayCellOutside: {
    opacity: 0.3,
  },
  dayCellDisabled: {
    opacity: 0.2,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: Colors.light.primary,
    fontWeight: '800',
  },
  dayTextOutside: {
    color: Colors.light.ink400,
  },
  dayTextDisabled: {
    color: Colors.light.ink300,
  },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: Spacing.four,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.three,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  confirmBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    ...Shadows.sm,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
