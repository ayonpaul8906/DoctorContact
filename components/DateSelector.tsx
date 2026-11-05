import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

export interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  availableDates?: { date: string; sessions?: any[] }[];
  isLoading?: boolean;
  daysCount?: number;
}

function DateSkeletonCard() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.dateCard, { opacity: pulseAnim, backgroundColor: '#F8FAFC' }]}>
      <View style={{ width: 32, height: 10, borderRadius: 4, backgroundColor: '#E2E8F0', marginBottom: 6 }} />
      <View style={{ width: 24, height: 18, borderRadius: 4, backgroundColor: '#CBD5E1', marginBottom: 6 }} />
      <View style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
    </Animated.View>
  );
}

export function DateSelector({
  selectedDate,
  onSelectDate,
  availableDates,
  isLoading = false,
  daysCount = 14,
}: DateSelectorProps) {
  // Generate date items for the next N days (or use backend-provided available dates)
  const dates = React.useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (Array.isArray(availableDates)) {
      return availableDates.map((item) => {
        const parts = item.date.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const isToday = item.date === todayStr;
        const dayOfWeek = isToday ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' });
        const month = d.toLocaleDateString(undefined, { month: 'short' });

        return {
          dateString: item.date,
          dayOfWeek,
          dayNum: String(parts[2]),
          month,
          isToday,
          sessionsCount: item.sessions?.length,
        };
      });
    }

    const list: {
      dateString: string; // YYYY-MM-DD
      dayOfWeek: string;
      dayNum: string;
      month: string;
      isToday: boolean;
      sessionsCount?: number;
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
  }, [availableDates, daysCount]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Select Appointment Date</Text>
        {Array.isArray(availableDates) && availableDates.length > 0 && (
          <View style={styles.badgeAvailable}>
            <Text style={styles.badgeAvailableText}>{availableDates.length} Dates Available</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <DateSkeletonCard key={k} />
          ))}
        </ScrollView>
      ) : Array.isArray(availableDates) && availableDates.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="calendar-x" size={20} color={Colors.light.ink400} />
          <Text style={styles.emptyText}>
            No upcoming available dates found for this chamber.
          </Text>
          <Text style={styles.emptySub}>
            Please select another practicing chamber or check back soon.
          </Text>
        </View>
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  badgeAvailable: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeAvailableText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: 12,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
