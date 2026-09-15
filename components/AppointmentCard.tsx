import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientCard } from './GradientCard';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import type { Appointment } from '../types';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const router = useRouter();
  const doctorName = appointment.doctor?.user?.name || 'Assigned Doctor';
  const clinicName = appointment.clinic?.clinicName || 'Dewasi Healthcare Clinic';
  const formattedDate = new Date(appointment.date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(patient)/appointment/[id]',
        params: { id: appointment.id },
      });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleCardPress}
      style={styles.touchableWrapper}
    >
      <GradientCard variant="purple" style={styles.card}>
        <View style={styles.cardContent}>
          {/* Top Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.doctorInfoRow}>
              <View style={styles.doctorIconBox}>
                <Icon name="stethoscope" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorNameText} numberOfLines={1}>
                  {doctorName}
                </Text>
                <View style={styles.metaRow}>
                  <Icon name="building" size={13} color={Colors.light.primary} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {clinicName}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Icon name="calendar" size={13} color={Colors.light.primary} />
                  <Text style={styles.metaText}>{formattedDate}</Text>
                </View>
              </View>
            </View>
            <StatusBadge status={appointment.status} />
          </View>

          {/* Bottom Queue & Token Row */}
          <View style={styles.footerRow}>
            <View style={styles.tokenBadge}>
              <Icon name="award" size={13} color="#FFFFFF" />
              <Text style={styles.tokenText}>Token #{appointment.token}</Text>
            </View>

            {appointment.queueMode === 'PRIVATE' ? (
              <Text style={styles.privateQueueText}>Private Queue Mode</Text>
            ) : (
              appointment.status === 'WAITING' && (
                <View style={styles.queueStatsRow}>
                  <View style={styles.statInline}>
                    <Icon name="users" size={13} color={Colors.light.primary} />
                    <Text style={styles.queueText}>
                      {appointment.patientsAhead ?? 0} ahead
                    </Text>
                  </View>
                  {appointment.estimatedWaitMinutes != null && (
                    <View style={styles.statInline}>
                      <Icon name="clock" size={13} color="#D97706" />
                      <Text style={styles.queueText}>
                        ~{appointment.estimatedWaitMinutes} mins
                      </Text>
                    </View>
                  )}
                </View>
              )
            )}

            <View style={styles.arrowIcon}>
              <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
            </View>
          </View>
        </View>
      </GradientCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchableWrapper: {
    marginBottom: Spacing.three,
  },
  card: {
    margin: 0,
  },
  cardContent: {
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    flex: 1,
  },
  doctorIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  doctorDetails: {
    flex: 1,
    gap: 3,
  },
  doctorNameText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.three,
    marginTop: Spacing.three,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.light.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  privateQueueText: {
    fontSize: 12,
    color: Colors.light.ink400,
    fontStyle: 'italic',
  },
  queueStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  queueText: {
    fontSize: 12,
    color: Colors.light.ink600,
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
});
