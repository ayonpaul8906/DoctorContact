import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { DoctorConfirmModal, DoctorModalType } from './DoctorConfirmModal';
import {
  useQueueNext,
  useQueuePrevious,
  useQueueSkip,
  useQueueRecall,
  useQueuePause,
  useQueueResume,
  useQueueClose,
  useQueueReopen,
  useQueueEmergency,
  useNotifyDoctorDelay,
} from '../hooks/useDoctor';
import type { QueueToken } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DoctorQueueActionsProps {
  doctorId: string;
  clinicId: string;
  date: string;
  scheduleId?: string;
  queueStatus?: string;
  waitingTokens?: QueueToken[];
}

export function DoctorQueueActions({
  doctorId,
  clinicId,
  date,
  scheduleId,
  queueStatus = 'ACTIVE',
  waitingTokens = [],
}: DoctorQueueActionsProps) {
  // Mutation hooks
  const nextMutation = useQueueNext();
  const prevMutation = useQueuePrevious();
  const skipMutation = useQueueSkip();
  const recallMutation = useQueueRecall();
  const pauseMutation = useQueuePause();
  const resumeMutation = useQueueResume();
  const closeMutation = useQueueClose();
  const reopenMutation = useQueueReopen();
  const emergencyMutation = useQueueEmergency();
  const delayMutation = useNotifyDoctorDelay();

  const [activeModal, setActiveModal] = useState<DoctorModalType | null>(null);

  const isMutating =
    nextMutation.isPending ||
    prevMutation.isPending ||
    skipMutation.isPending ||
    recallMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    closeMutation.isPending ||
    reopenMutation.isPending ||
    emergencyMutation.isPending ||
    delayMutation.isPending;

  const isPaused = queueStatus === 'PAUSED';
  const isClosed = queueStatus === 'CLOSED';

  const handleNext = async () => {
    try {
      await nextMutation.mutateAsync({ doctorId, clinicId, date, scheduleId });
    } catch {
      // Handled via React Query / toast
    }
  };

  const handlePrev = async () => {
    try {
      await prevMutation.mutateAsync({ doctorId, clinicId, date, scheduleId });
    } catch {
      // Handled
    }
  };

  const handleRecall = async () => {
    try {
      await recallMutation.mutateAsync({ doctorId, clinicId, date, scheduleId });
    } catch {
      // Handled
    }
  };

  const handleResume = async () => {
    try {
      await resumeMutation.mutateAsync({ doctorId, clinicId, date, scheduleId });
    } catch {
      // Handled
    }
  };

  const handleModalConfirm = async (payload?: {
    reason?: string;
    delayMinutes?: number;
    patientId?: string;
  }) => {
    try {
      if (activeModal === 'skip') {
        await skipMutation.mutateAsync({
          doctorId,
          clinicId,
          date,
          scheduleId,
          body: payload?.reason ? { reason: payload.reason } : undefined,
        });
      } else if (activeModal === 'pause') {
        await pauseMutation.mutateAsync({
          doctorId,
          clinicId,
          date,
          scheduleId,
          body: payload?.reason ? { reason: payload.reason } : undefined,
        });
      } else if (activeModal === 'close') {
        await closeMutation.mutateAsync({ doctorId, clinicId, date, scheduleId });
      } else if (activeModal === 'reopen') {
        await reopenMutation.mutateAsync({ doctorId, clinicId, date, scheduleId });
      } else if (activeModal === 'emergency') {
        await emergencyMutation.mutateAsync({
          doctorId,
          clinicId,
          date,
          scheduleId,
          body: { patientId: payload?.patientId },
        });
      } else if (activeModal === 'delay' && payload?.delayMinutes) {
        await delayMutation.mutateAsync({
          doctorId,
          clinicId,
          delayMinutes: payload.delayMinutes,
        });
      }
      setActiveModal(null);
    } catch {
      // Handled
    }
  };

  return (
    <>
      <GradientCard variant="purple" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.iconBox}>
              <Icon name="sliders" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.titleText}>Queue Control Actions</Text>
          </View>

          {/* Primary Action Button (Call Next) */}
          <TouchableOpacity
            style={[styles.primaryActionBtn, (isMutating || isClosed) && styles.btnDisabled]}
            onPress={handleNext}
            disabled={isMutating || isClosed}
            activeOpacity={0.85}
          >
            {nextMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="skip-forward" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Call Next Patient</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 2x2 Quick Actions Grid */}
          <View style={styles.actionsGrid}>
            {/* Skip Token */}
            <TouchableOpacity
              style={[styles.actionGridBtn, isMutating && styles.btnDisabled]}
              onPress={() => setActiveModal('skip')}
              disabled={isMutating || isClosed}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Icon name="alert-triangle" size={15} color="#DC2626" />
              </View>
              <Text style={styles.gridActionText}>Skip Token</Text>
            </TouchableOpacity>

            {/* Previous Token */}
            <TouchableOpacity
              style={[styles.actionGridBtn, isMutating && styles.btnDisabled]}
              onPress={handlePrev}
              disabled={isMutating || isClosed}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="skip-back" size={15} color={Colors.light.primary} />
              </View>
              <Text style={styles.gridActionText}>Previous</Text>
            </TouchableOpacity>

            {/* Recall Token */}
            <TouchableOpacity
              style={[styles.actionGridBtn, isMutating && styles.btnDisabled]}
              onPress={handleRecall}
              disabled={isMutating || isClosed}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="refresh-cw" size={15} color="#16A34A" />
              </View>
              <Text style={styles.gridActionText}>Recall Token</Text>
            </TouchableOpacity>

            {/* Broadcast Delay */}
            <TouchableOpacity
              style={[styles.actionGridBtn, isMutating && styles.btnDisabled]}
              onPress={() => setActiveModal('delay')}
              disabled={isMutating || isClosed}
              activeOpacity={0.8}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="clock" size={15} color="#D97706" />
              </View>
              <Text style={styles.gridActionText}>Notify Delay</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Row: State Toggles (Pause / Resume, Close / Reopen, Emergency) */}
          <View style={styles.toggleRow}>
            {/* Pause / Resume */}
            {isPaused ? (
              <TouchableOpacity
                style={[styles.toggleBtn, styles.resumeBtn]}
                onPress={handleResume}
                disabled={isMutating}
                activeOpacity={0.85}
              >
                <Icon name="play" size={14} color="#FFFFFF" />
                <Text style={styles.toggleBtnText}>Resume Queue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.toggleBtn, styles.pauseBtn]}
                onPress={() => setActiveModal('pause')}
                disabled={isMutating || isClosed}
                activeOpacity={0.85}
              >
                <Icon name="pause" size={14} color="#FFFFFF" />
                <Text style={styles.toggleBtnText}>Pause Queue</Text>
              </TouchableOpacity>
            )}

            {/* Close / Reopen */}
            {isClosed ? (
              <TouchableOpacity
                style={[styles.toggleBtn, styles.reopenBtn]}
                onPress={() => setActiveModal('reopen')}
                disabled={isMutating}
                activeOpacity={0.85}
              >
                <Icon name="lock-open" size={14} color="#FFFFFF" />
                <Text style={styles.toggleBtnText}>Reopen Queue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.toggleBtn, styles.closeBtn]}
                onPress={() => setActiveModal('close')}
                disabled={isMutating}
                activeOpacity={0.85}
              >
                <Icon name="lock-closed" size={14} color="#FFFFFF" />
                <Text style={styles.toggleBtnText}>Close Queue</Text>
              </TouchableOpacity>
            )}

            {/* Emergency Jump */}
            <TouchableOpacity
              style={[styles.toggleBtn, styles.emergencyBtn]}
              onPress={() => setActiveModal('emergency')}
              disabled={isMutating || isClosed}
              activeOpacity={0.85}
            >
              <Icon name="alert-triangle" size={14} color="#DC2626" />
              <Text style={[styles.toggleBtnText, { color: '#DC2626' }]}>
                Emergency
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientCard>

      {/* Safety Confirmation Modal */}
      <DoctorConfirmModal
        visible={activeModal !== null}
        type={activeModal}
        isLoading={isMutating}
        onClose={() => setActiveModal(null)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.two,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    ...Shadows.md,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionGridBtn: {
    flex: 1,
    backgroundColor: Colors.light.surface50,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 4,
  },
  gridIconCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink800,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 2,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  resumeBtn: {
    backgroundColor: '#10B981',
  },
  closeBtn: {
    backgroundColor: '#4B5563',
  },
  reopenBtn: {
    backgroundColor: '#10B981',
  },
  emergencyBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
