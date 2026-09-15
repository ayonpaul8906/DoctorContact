import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { Icon } from './Icon';

export type DoctorModalType =
  | 'skip'
  | 'pause'
  | 'close'
  | 'reopen'
  | 'emergency'
  | 'delay';

interface DoctorConfirmModalProps {
  visible: boolean;
  type: DoctorModalType | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (payload?: { reason?: string; delayMinutes?: number; patientId?: string }) => void;
}

const MODAL_CONFIG: Record<
  DoctorModalType,
  {
    title: string;
    description: string;
    confirmText: string;
    confirmColor: string;
    icon: 'alert-triangle' | 'pause' | 'lock-closed' | 'lock-open' | 'clock';
    requiresInput?: boolean;
    inputPlaceholder?: string;
  }
> = {
  skip: {
    title: 'Skip Patient Token',
    description: 'Mark the current patient as absent or skipped and advance to the next token in queue.',
    confirmText: 'Confirm Skip',
    confirmColor: '#DC2626',
    icon: 'alert-triangle',
    requiresInput: true,
    inputPlaceholder: 'Reason for skipping (e.g. Patient not present)',
  },
  pause: {
    title: 'Pause Queue',
    description: 'Temporarily suspend patient queue processing. Patients will see a paused status.',
    confirmText: 'Pause Queue',
    confirmColor: '#D97706',
    icon: 'pause',
    requiresInput: true,
    inputPlaceholder: 'Reason (e.g. Doctor in emergency consultation)',
  },
  close: {
    title: 'Close Queue Session',
    description: 'Close the queue for today at this clinic. No more patients will be admitted.',
    confirmText: 'Close Queue',
    confirmColor: '#DC2626',
    icon: 'lock-closed',
    requiresInput: false,
  },
  reopen: {
    title: 'Reopen Queue',
    description: 'Reopen this clinic queue and resume accepting and consulting patients.',
    confirmText: 'Reopen Queue',
    confirmColor: '#10B981',
    icon: 'lock-open',
    requiresInput: false,
  },
  emergency: {
    title: 'Emergency Token Jump',
    description: 'Prioritize a critical patient immediately ahead of the current queue line.',
    confirmText: 'Prioritize Emergency',
    confirmColor: '#DC2626',
    icon: 'alert-triangle',
    requiresInput: true,
    inputPlaceholder: 'Patient ID or Name',
  },
  delay: {
    title: 'Broadcast Consultation Delay',
    description: 'Notify patients in queue of expected schedule delay. Waiting times will be recalculated.',
    confirmText: 'Broadcast Delay',
    confirmColor: '#2563EB',
    icon: 'clock',
    requiresInput: false,
  },
};

const DELAY_OPTIONS = [5, 10, 15, 20, 30, 45];

export function DoctorConfirmModal({
  visible,
  type,
  isLoading,
  onClose,
  onConfirm,
}: DoctorConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [selectedDelay, setSelectedDelay] = useState<number>(15);

  if (!type) return null;
  const config = MODAL_CONFIG[type];

  const handleConfirm = () => {
    if (type === 'delay') {
      onConfirm({ delayMinutes: selectedDelay });
    } else if (type === 'skip' || type === 'pause') {
      onConfirm({ reason: reason.trim() || undefined });
    } else if (type === 'emergency') {
      onConfirm({ patientId: reason.trim() || undefined });
    } else {
      onConfirm();
    }
    setReason('');
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View style={styles.dialogCard}>
                {/* Modal Header */}
                <View style={styles.headerRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: config.confirmColor + '15' },
                    ]}
                  >
                    <Icon name={config.icon} size={22} color={config.confirmColor} />
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isLoading}
                    style={styles.closeBtn}
                  >
                    <Icon name="x" size={18} color={Colors.light.ink400} />
                  </TouchableOpacity>
                </View>

                {/* Title & Description */}
                <Text style={styles.title}>{config.title}</Text>
                <Text style={styles.description}>{config.description}</Text>

                {/* Delay Minutes Selector (Only for Delay modal) */}
                {type === 'delay' && (
                  <View style={styles.delayPickerContainer}>
                    <Text style={styles.inputLabel}>Select Estimated Delay</Text>
                    <View style={styles.delayChipsRow}>
                      {DELAY_OPTIONS.map((mins) => {
                        const isSelected = selectedDelay === mins;
                        return (
                          <TouchableOpacity
                            key={mins}
                            style={[
                              styles.delayChip,
                              isSelected && styles.delayChipSelected,
                            ]}
                            onPress={() => setSelectedDelay(mins)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.delayChipText,
                                isSelected && styles.delayChipTextSelected,
                              ]}
                            >
                              +{mins}m
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Optional Reason / Input Field */}
                {config.requiresInput && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      {type === 'emergency' ? 'Patient Identifier' : 'Note / Reason'}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={reason}
                      onChangeText={setReason}
                      placeholder={config.inputPlaceholder}
                      placeholderTextColor={Colors.light.ink400}
                      editable={!isLoading}
                      autoFocus
                    />
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleClose}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: config.confirmColor },
                    ]}
                    onPress={handleConfirm}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmBtnText}>{config.confirmText}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 380,
  },
  dialogCard: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    width: '100%',
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: Spacing.one,
  },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    marginBottom: Spacing.one,
  },
  description: {
    fontSize: 13,
    color: Colors.light.ink600,
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  inputContainer: {
    marginBottom: Spacing.four,
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: Colors.light.surface50,
    borderColor: Colors.light.surface200,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.light.ink900,
  },
  delayPickerContainer: {
    marginBottom: Spacing.four,
    gap: 8,
  },
  delayChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  delayChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  delayChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.light.primary,
  },
  delayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  delayChipTextSelected: {
    color: Colors.light.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  confirmBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
