import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  daysCount?: number;
}

export function DateSelector({
  selectedDate,
  onSelectDate,
  daysCount = 14,
}: DateSelectorProps) {
  // Generate date items for the next N days
  const dates = React.useMemo(() => {
    const list: {
      dateString: string; // YYYY-MM-DD
      dayOfWeek: string;
      dayNum: string;
      month: string;
      isToday: boolean;
    }[] = [];

    const now = new Date();

    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);

      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthNum}-${dayNum}`;

      const dayOfWeek = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' });
      const month = d.toLocaleDateString(undefined, { month: 'short' });

      list.push({
        dateString,
        dayOfWeek,
        dayNum: String(d.getDate()),
        month,
        isToday: i === 0,
      });
    }

    return list;
  }, [daysCount]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Appointment Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((item) => {
          const isSelected = selectedDate === item.dateString;

          return (
            <TouchableOpacity
              key={item.dateString}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardSelected,
              ]}
              onPress={() => onSelectDate(item.dateString)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayOfWeekText,
                  isSelected && styles.textSelected,
                ]}
              >
                {item.dayOfWeek}
              </Text>
              <Text
                style={[
                  styles.dayNumText,
                  isSelected && styles.textSelected,
                ]}
              >
                {item.dayNum}
              </Text>
              <Text
                style={[
                  styles.monthText,
                  isSelected && styles.textSelected,
                ]}
              >
                {item.month}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  scrollContent: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  dateCard: {
    width: 68,
    height: 84,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceWhite,
    borderWidth: 1.5,
    borderColor: Colors.light.surface200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    ...Shadows.sm,
  },
  dateCardSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: '#1E40AF',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
  },
  dayNumText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  monthText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink400,
    textTransform: 'uppercase',
  },
  textSelected: {
    color: '#FFFFFF',
  },
});
