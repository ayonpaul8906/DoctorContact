import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Icon } from './Icon';
import type { Appointment } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface CancelAppointmentModalProps {
  visible: boolean;
  appointment: Appointment | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void> | void;
}

export function CancelAppointmentModal({
  visible,
  appointment,
  isLoading = false,
  onClose,
  onConfirm,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState('');

  if (!visible || !appointment) return null;

  const doctorName = appointment.doctor?.user?.name || 'Assigned Doctor';
  const clinicName = appointment.clinic?.clinicName || 'Clinic';
  const formattedDate = new Date(appointment.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleConfirm = async () => {
    await onConfirm(reason.trim() || undefined);
    setReason('');
  };

  const handleClose = () => {
    if (isLoading) return;
    setReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          {/* Header Icon */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Icon name="x-circle" size={26} color="#DC2626" />
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              style={styles.closeBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Icon name="x" size={18} color={Colors.light.ink400} />
            </TouchableOpacity>
          </View>

          {/* Title & Warning */}
          <Text style={styles.title}>Cancel Appointment?</Text>
          <Text style={styles.description}>
            Are you sure you want to cancel this appointment? Your queue token
            will be released and this action cannot be undone.
          </Text>

          {/* Appointment Preview Box */}
          <View style={styles.previewBox}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Doctor</Text>
              <Text style={styles.previewValue} numberOfLines={1}>
                {doctorName}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Clinic</Text>
              <Text style={styles.previewValue} numberOfLines={1}>
                {clinicName}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Date</Text>
              <Text style={styles.previewValue}>{formattedDate}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Token</Text>
              <View style={styles.tokenPill}>
                <Text style={styles.tokenPillText}>#{appointment.token}</Text>
              </View>
            </View>
          </View>

          {/* Reason Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Reason (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g., Schedule conflict, feeling better..."
              placeholderTextColor={Colors.light.ink400}
              multiline
              numberOfLines={2}
              maxLength={200}
              editable={!isLoading}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.keepBtn}
              onPress={handleClose}
              disabled={isLoading}
              activeOpacity={0.75}
            >
              <Text style={styles.keepBtnText}>Keep Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, isLoading && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.cancelBtnText}>Confirm Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.light.ink600,
    marginBottom: Spacing.four,
  },
  previewBox: {
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    padding: Spacing.three,
    gap: 8,
    marginBottom: Spacing.four,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink900,
    maxWidth: '65%',
    textAlign: 'right',
  },
  tokenPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 1,
    paddingHorizontal: 7,
    borderRadius: Radius.sm,
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  inputContainer: {
    marginBottom: Spacing.five,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink600,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.light.ink900,
    backgroundColor: Colors.light.surfaceWhite,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  keepBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    backgroundColor: Colors.light.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink700,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
