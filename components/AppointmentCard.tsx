import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { GradientCard } from './GradientCard';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import type { Appointment } from '../types';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onCancelPress?: (appointment: Appointment) => void;
}

function formatDoctorName(name?: string) {
  if (!name?.trim()) return 'Dr. Assigned Doctor';
  const cleanName = name
    .trim()
    .replace(/^(dr\.?\s*)+/i, '')
    .trim();
  return cleanName ? `Dr. ${cleanName}` : 'Dr. Assigned Doctor';
}

export function AppointmentCard({
  appointment,
  onPress,
  onCancelPress,
}: AppointmentCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const doctorName = formatDoctorName(appointment.doctor?.user?.name);
  const clinicName = appointment.clinic?.clinicName || 'Clinic';
  const formattedDate = new Date(appointment.date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const isActive =
    appointment.status === 'WAITING' || appointment.status === 'CHECKED_IN';
  const canCancel = appointment.status === 'WAITING' && !!onCancelPress;
  const isYourTurn = !!appointment.isYourTurn;

  const cardGradientColors: readonly [string, string, ...string[]] = isYourTurn
    ? ['#059669', '#10B981', '#34D399']
    : ['#252A67', '#3B4A8F', '#14B8A6'];

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      // Pre-seed individual appointment query cache for instant 0ms ticket rendering
      if (appointment?.id) {
        queryClient.setQueryData(
          ['appointment', String(appointment.id).trim()],
          appointment
        );
      }
      router.push({
        pathname: '/(patient)/appointment/[id]',
        params: { id: appointment.id },
      });
    }
  };

  const handleCancelPress = (e: any) => {
    if (onCancelPress) {
      onCancelPress(appointment);
    }
  };

  const currentToken = appointment.queue?.currentToken;
  const waitLabel =
    appointment.estimatedWaitLabel ||
    (appointment.estimatedWaitMinutes != null
      ? `~${appointment.estimatedWaitMinutes} mins`
      : null);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleCardPress}
      style={styles.touchableWrapper}
    >
      <GradientCard
        gradientColors={cardGradientColors}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          {/* Top Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.doctorInfoRow}>
              <View
                style={[
                  styles.doctorIconBox,
                  isYourTurn && { backgroundColor: '#059669' },
                ]}
              >
                <Icon name="stethoscope" size={20} color="#FFFFFF" />
              </View>

              <View style={styles.doctorDetails}>
                <Text style={styles.doctorNameText} numberOfLines={1}>
                  {doctorName}
                </Text>

                <View style={styles.metaRow}>
                  <Icon name="building" size={12} color="#14B8A6" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {clinicName}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Icon name="calendar" size={12} color="#14B8A6" />
                  <Text style={styles.metaText}>{formattedDate}</Text>
                </View>
              </View>
            </View>

            <StatusBadge status={appointment.status} />
          </View>

          {/* Middle / Bottom Queue & Actions Row */}
          <View style={styles.footerRow}>
            <View style={styles.leftMetrics}>
              {/* Token Pill */}
              <View style={styles.tokenBadge}>
                <Icon name="award" size={12} color="#FFFFFF" />
                <Text style={styles.tokenText}>Token #{appointment.token}</Text>
              </View>

              {/* Live Queue Status / Turn Notification */}
              {appointment.queueMode === 'PRIVATE' ? (
                <Text style={styles.privateQueueText}>Private Queue</Text>
              ) : (
                isActive && (
                  isYourTurn ? (
                    <View style={styles.yourTurnBadge}>
                      <Icon name="radio" size={12} color="#FFFFFF" />
                      <Text style={styles.yourTurnText}>Your Turn!</Text>
                    </View>
                  ) : currentToken != null ? (
                    <View style={styles.queueStatsRow}>
                      <View style={styles.statInline}>
                        <Icon name="activity" size={12} color="#252A67" />
                        <Text style={styles.queueText}>Serving #{currentToken}</Text>
                      </View>

                      {appointment.patientsAhead != null && (
                        <View style={styles.statInline}>
                          <Icon name="users" size={12} color="#14B8A6" />
                          <Text style={styles.queueText}>
                            {appointment.patientsAhead} ahead
                          </Text>
                        </View>
                      )}

                      {waitLabel && (
                        <View style={styles.statInline}>
                          <Icon name="clock" size={12} color="#D97706" />
                          <Text style={styles.queueText}>{waitLabel}</Text>
                        </View>
                      )}
                    </View>
                  ) : null
                )
              )}
            </View>

            {/* Cancel Button or Chevron */}
            <View style={styles.rightActions}>
              {canCancel && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancelPress}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Icon name="x-circle" size={13} color="#DC2626" />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}

              <View style={styles.arrowIcon}>
                <Icon name="chevron-right" size={16} color={Colors.light.ink400} />
              </View>
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
    backgroundColor: '#252A67',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#252A67',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  leftMetrics: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#252A67',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  yourTurnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  yourTurnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  privateQueueText: {
    fontSize: 11,
    color: Colors.light.ink400,
    fontStyle: 'italic',
  },
  queueStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  queueText: {
    fontSize: 11,
    color: Colors.light.ink600,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  arrowIcon: {
    marginLeft: 2,
  },
});
