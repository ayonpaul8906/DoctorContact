import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { useQueueNext, useQueuePrevious } from '../hooks/useDoctor';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DoctorQuickQueueControlProps {
  doctorId: string;
  clinicId: string;
  date: string;
  scheduleId?: string;
  currentToken?: number;
  lastTokenIssued?: number;
  queueStatus?: string;
}

export function DoctorQuickQueueControl({
  doctorId,
  clinicId,
  date,
  scheduleId,
  currentToken = 0,
  lastTokenIssued = 0,
  queueStatus = 'OPEN',
}: DoctorQuickQueueControlProps) {
  const nextMutation = useQueueNext();
  const prevMutation = useQueuePrevious();

  const isBusy = nextMutation.isPending || prevMutation.isPending;
  const isClosed = queueStatus === 'CLOSED';
  const hasWaiting = lastTokenIssued > currentToken;

  const handleNext = async () => {
    try {
      await nextMutation.mutateAsync({
        doctorId,
        clinicId,
        date,
        scheduleId,
      });
    } catch {
      // Handled
    }
  };

  const handlePrev = async () => {
    try {
      await prevMutation.mutateAsync({
        doctorId,
        clinicId,
        date,
        scheduleId,
      });
    } catch {
      // Handled
    }
  };

  return (
    <LinearGradient
      colors={['#252a67', '#1e3a8a', '#14B8A6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientWrapper}
    >
      <View style={styles.cardInner}>
        {/* Token Indicators Row */}
        <View style={styles.tokenStatsRow}>
          <View style={styles.tokenStatBox}>
            <Text style={styles.tokenStatLabel}>Currently Serving</Text>
            <Text style={styles.tokenStatValue}>
              {currentToken > 0 ? `#${currentToken}` : '--'}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.tokenStatBox}>
            <Text style={styles.tokenStatLabel}>Last Issued</Text>
            <Text style={styles.tokenStatValue}>
              {lastTokenIssued > 0 ? `#${lastTokenIssued}` : '--'}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.tokenStatBox}>
            <Text style={styles.tokenStatLabel}>Waiting Ahead</Text>
            <Text
              style={[
                styles.tokenStatValue,
                { color: hasWaiting ? '#F59E0B' : Colors.light.ink600 },
              ]}
            >
              {Math.max(0, lastTokenIssued - currentToken)}
            </Text>
          </View>
        </View>

        {/* Big Tactile Action Buttons Row */}
        <View style={styles.buttonsRow}>
          {/* Previous Patient Button */}
          <TouchableOpacity
            style={[
              styles.prevButton,
              (isBusy || isClosed || currentToken <= 1) && styles.btnDisabled,
            ]}
            onPress={handlePrev}
            disabled={isBusy || isClosed || currentToken <= 1}
            activeOpacity={0.8}
          >
            {prevMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.light.ink700} />
            ) : (
              <>
                <Icon name="chevron-left" size={20} color={Colors.light.ink700} />
                <Text style={styles.prevButtonText}>Previous</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Next Patient Button (Hero Action) */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              (isBusy || isClosed || !hasWaiting) && styles.nextBtnDisabled,
            ]}
            onPress={handleNext}
            disabled={isBusy || isClosed || !hasWaiting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isBusy || isClosed || !hasWaiting
                  ? ['#64748B', '#475569']
                  : ['#1e3a8a', '#3b82f6']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradientFill}
            >
              {nextMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Next Patient</Text>
                  <Icon name="chevron-right" size={22} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Operational Status Notices */}
        {isClosed && (
          <View style={styles.statusNoticeBoxDanger}>
            <Icon name="alert-circle" size={14} color={Colors.light.danger} />
            <Text style={styles.statusNoticeTextDanger}>
              Queue is closed — reopen it in Queue Actions to call patients.
            </Text>
          </View>
        )}

        {!isClosed && !hasWaiting && (
          <View style={styles.statusNoticeBoxMuted}>
            <Icon name="check-circle" size={14} color="#10B981" />
            <Text style={styles.statusNoticeTextMuted}>
              No more waiting patients in this session.
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientWrapper: {
    borderRadius: Radius.xl,
    padding: 2,
    marginBottom: Spacing.two,
    ...Shadows.md,
  },
  cardInner: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl - 2,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  tokenStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  tokenStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tokenStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tokenStatValue: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.extrabold,
    color: Colors.light.ink900,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.surface200,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  prevButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface100,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  prevButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  nextButton: {
    flex: 2,
    height: 52,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  nextGradientFill: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  statusNoticeBoxDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusNoticeTextDanger: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  statusNoticeBoxMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusNoticeTextMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
});
