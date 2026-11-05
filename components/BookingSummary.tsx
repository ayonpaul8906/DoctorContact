import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { Doctor } from '../types';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface BookingSummaryProps {
  doctor: Doctor;
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  sessionName?: string;
}

export function BookingSummary({
  doctor,
  selectedDate,
  selectedTime,
  sessionName,
}: BookingSummaryProps) {
  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Not selected';

  // Format time (e.g. "10:30" -> "10:30 AM" or "10:00 - 13:00" -> "10:00 AM - 01:00 PM")
  const formattedTime = React.useMemo(() => {
    if (!selectedTime) return 'Not selected';
    if (selectedTime.includes('-')) {
      const parts = selectedTime.split('-').map((s) => s.trim());
      const formatSingle = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return t;
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
      };
      return `${formatSingle(parts[0])} - ${formatSingle(parts[1])}`;
    }
    const [hours, minutes] = selectedTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return selectedTime;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  }, [selectedTime]);

  return (
    <GradientCard variant="purple" style={styles.card}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.iconBox}>
            <Icon name="award" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.title}>Booking Summary</Text>
            <Text style={styles.subtitle}>Review your appointment schedule</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Details Grid */}
        <View style={styles.detailsList}>
          {/* Doctor */}
          <View style={styles.detailRow}>
            <View style={styles.labelGroup}>
              <Icon name="stethoscope" size={14} color={Colors.light.primary} />
              <Text style={styles.labelText}>Doctor</Text>
            </View>
            <Text style={styles.valueText} numberOfLines={1}>
              {doctor.user?.name}
            </Text>
          </View>

          {/* Clinic */}
          <View style={styles.detailRow}>
            <View style={styles.labelGroup}>
              <Icon name="building" size={14} color={Colors.light.primary} />
              <Text style={styles.labelText}>Clinic</Text>
            </View>
            <Text style={styles.valueText} numberOfLines={1}>
              {doctor.clinic?.clinicName}
            </Text>
          </View>

          {/* Date */}
          <View style={styles.detailRow}>
            <View style={styles.labelGroup}>
              <Icon name="calendar" size={14} color={Colors.light.primary} />
              <Text style={styles.labelText}>Date</Text>
            </View>
            <Text style={[styles.valueText, styles.highlightValue]}>
              {formattedDate}
            </Text>
          </View>

          {/* Time */}
          <View style={styles.detailRow}>
            <View style={styles.labelGroup}>
              <Icon name="clock" size={14} color={Colors.light.primary} />
              <Text style={styles.labelText}>Time</Text>
            </View>
            <Text style={[styles.valueText, styles.highlightValue]}>
              {formattedTime}
            </Text>
          </View>

          {sessionName ? (
            <View style={styles.detailRow}>
              <View style={styles.labelGroup}>
                <Icon name="activity" size={14} color={Colors.light.primary} />
                <Text style={styles.labelText}>Session</Text>
              </View>
              <Text style={[styles.valueText, styles.highlightValue]}>
                {sessionName}
              </Text>
            </View>
          ) : null}

          {/* Consultation Fee */}
          {doctor.fee != null ? (
            <View style={styles.detailRow}>
              <View style={styles.labelGroup}>
                <Icon name="rupee" size={14} color="#059669" />
                <Text style={styles.labelText}>Consultation Fee</Text>
              </View>
              <Text style={[styles.valueText, styles.feeValue]}>
                {'\u20B9'}{doctor.fee}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Security & Queue Notice */}
        <View style={styles.noticeBox}>
          <Icon name="shield-check" size={14} color={Colors.light.primary} />
          <Text style={styles.noticeText}>
            Instant token generation & live queue tracking enabled upon confirmation.
          </Text>
        </View>
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.surface200,
  },
  detailsList: {
    gap: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
    maxWidth: '55%',
    textAlign: 'right',
  },
  highlightValue: {
    color: Colors.light.primary,
  },
  feeValue: {
    color: '#047857',
    fontSize: 13,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
    lineHeight: 14,
  },
});
