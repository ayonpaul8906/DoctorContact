import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientCard } from './GradientCard';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import type { Appointment, AppointmentStatus } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface LiveQueueTrackerProps {
  appointment: Appointment;
  isConnected: boolean;
}

const STEPS: { status: AppointmentStatus; label: string; icon: 'calendar' | 'users' | 'stethoscope' | 'check-circle' }[] = [
  { status: 'CHECKED_IN', label: 'Checked In', icon: 'calendar' },
  { status: 'WAITING', label: 'In Queue', icon: 'users' },
  { status: 'COMPLETED', label: 'Consulted', icon: 'check-circle' },
];

export function LiveQueueTracker({
  appointment,
  isConnected,
}: LiveQueueTrackerProps) {
  const isCancelled = appointment.status === 'CANCELLED';
  const isCompleted = appointment.status === 'COMPLETED';
  const isAbsent = appointment.status === 'ABSENT';
  const isWaiting = appointment.status === 'WAITING';
  const isCheckedIn = appointment.status === 'CHECKED_IN';
  const isPrivate = appointment.queueMode === 'PRIVATE';

  // Determine current active step index (0: Checked In, 1: Waiting in Queue, 2: Completed)
  let activeStep = 0;
  if (isCheckedIn) activeStep = 0;
  if (isWaiting) activeStep = 1;
  if (isCompleted) activeStep = 2;

  return (
    <GradientCard variant="purple" style={styles.card}>
      <View style={styles.cardContent}>
        {/* Top Realtime Status Bar */}
        <View style={styles.topRow}>
          <View style={styles.liveIndicator}>
            <View
              style={[
                styles.pulsingDot,
                { backgroundColor: isConnected ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={styles.liveText}>
              {isConnected ? 'Live Queue Tracking' : 'Offline / Reconnecting'}
            </Text>
          </View>

          <StatusBadge status={appointment.status} />
        </View>

        {/* Hero Token Box */}
        <View style={styles.tokenHeroBox}>
          <View style={styles.tokenIconBadge}>
            <Icon name="award" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.tokenHeroLabel}>Your Token Number</Text>
          <Text style={styles.tokenHeroNumber}>#{appointment.token}</Text>
        </View>

        {/* Live Queue Metrics (Only if Waiting or Checked In) */}
        {!isCancelled && !isCompleted && !isAbsent && (
          <>
            {isPrivate ? (
              <View style={styles.privateBox}>
                <Icon name="shield" size={16} color={Colors.light.ink500} />
                <Text style={styles.privateText}>
                  This clinic is operating in private queue mode. Please check at the reception desk for queue progress.
                </Text>
              </View>
            ) : (
              <View style={styles.metricsGrid}>
                {/* Patients Ahead */}
                <View style={styles.metricCard}>
                  <View style={styles.metricIconBox}>
                    <Icon name="users" size={16} color={Colors.light.primary} />
                  </View>
                  <Text style={styles.metricValue}>
                    {appointment.patientsAhead ?? 0}
                  </Text>
                  <Text style={styles.metricLabel}>Patients Ahead</Text>
                </View>

                {/* Estimated Wait */}
                <View style={styles.metricCard}>
                  <View style={[styles.metricIconBox, styles.waitIconBox]}>
                    <Icon name="clock" size={16} color="#D97706" />
                  </View>
                  <Text style={styles.metricValue}>
                    {appointment.estimatedWaitMinutes != null
                      ? `~${appointment.estimatedWaitMinutes}m`
                      : 'Immediate'}
                  </Text>
                  <Text style={styles.metricLabel}>Est. Waiting Time</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Timeline Steps */}
        {!isCancelled && (
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>Queue Progress</Text>
            <View style={styles.stepsRow}>
              {STEPS.map((step, idx) => {
                const isPassed = activeStep >= idx;
                const isCurrent = activeStep === idx;

                return (
                  <React.Fragment key={step.label}>
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepIconCircle,
                          isPassed && styles.stepIconCircleActive,
                          isCurrent && styles.stepIconCircleCurrent,
                        ]}
                      >
                        <Icon
                          name={step.icon}
                          size={14}
                          color={isPassed ? '#FFFFFF' : Colors.light.ink400}
                        />
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          isPassed && styles.stepLabelActive,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                    {idx < STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          activeStep > idx && styles.stepLineActive,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}
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
    gap: Spacing.four,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
    letterSpacing: 0.2,
  },
  tokenHeroBox: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: 4,
  },
  tokenIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    ...Shadows.md,
  },
  tokenHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6B21A8',
  },
  tokenHeroNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.light.ink900,
    letterSpacing: -0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.light.surface50,
    borderColor: Colors.light.surface200,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  waitIconBox: {
    backgroundColor: '#FEF3C7',
  },
  metricValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  privateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  privateText: {
    flex: 1,
    fontSize: 11,
    color: Colors.light.ink500,
    lineHeight: 15,
  },
  timelineContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface200,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: Colors.light.ink500,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    marginTop: 4,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCircleActive: {
    backgroundColor: Colors.light.primary,
  },
  stepIconCircleCurrent: {
    backgroundColor: '#7C3AED',
    ...Shadows.md,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink400,
  },
  stepLabelActive: {
    color: Colors.light.ink900,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.surface200,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.light.primary,
  },
});
