import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { Appointment } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface BookingSuccessModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onViewAppointments: () => void;
  onBookAnother: () => void;
}

export function BookingSuccessModal({
  visible,
  appointment,
  onViewAppointments,
  onBookAnother,
}: BookingSuccessModalProps) {
  if (!visible || !appointment) return null;

  const doctorName = appointment.doctor?.user?.name || 'Healthcare Professional';
  const clinicName = appointment.clinic?.clinicName || 'Dewasi Healthcare Clinic';
  const formattedDate = new Date(appointment.date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <GradientCard variant="green" style={styles.card}>
            <View style={styles.contentInner}>
              {/* Success Badge Icon */}
              <View style={styles.successIconCircle}>
                <Icon name="check-circle" size={36} color="#FFFFFF" />
              </View>

              <Text style={styles.successTitle}>Booking Confirmed!</Text>
              <Text style={styles.successSubtitle}>
                Your appointment has been successfully scheduled.
              </Text>

              {/* Token Pill */}
              <View style={styles.tokenPill}>
                <Icon name="award" size={16} color="#FFFFFF" />
                <Text style={styles.tokenPillText}>
                  TOKEN #{appointment.token}
                </Text>
              </View>

              {/* Appointment Details Box */}
              <View style={styles.detailsBox}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Doctor</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {doctorName}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Clinic</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {clinicName}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {formattedDate}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, styles.statusValue]}>
                    {appointment.status}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onViewAppointments}
                activeOpacity={0.85}
              >
                <Icon name="calendar" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>View My Appointments</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onBookAnother}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Book Another Appointment</Text>
              </TouchableOpacity>
            </View>
          </GradientCard>
        </View>
      </View>
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
  modalContent: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    margin: 0,
  },
  contentInner: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingVertical: 6,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    ...Shadows.md,
  },
  tokenPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
    gap: Spacing.two,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
    maxWidth: '65%',
    textAlign: 'right',
  },
  statusValue: {
    color: '#059669',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    ...Shadows.md,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.ink600,
  },
});
