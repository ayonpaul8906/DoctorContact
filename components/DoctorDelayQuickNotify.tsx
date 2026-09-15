import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { useNotifyDoctorDelay } from '../hooks/useDoctor';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface DoctorDelayQuickNotifyProps {
  doctorId: string;
  clinicId: string;
  clinicName?: string;
}

const DELAY_OPTIONS = [10, 15, 30, 45];

export function DoctorDelayQuickNotify({
  doctorId,
  clinicId,
  clinicName = 'this clinic',
}: DoctorDelayQuickNotifyProps) {
  const delayMutation = useNotifyDoctorDelay();

  const handleBroadcast = (minutes: number) => {
    Alert.alert(
      'Broadcast Delay',
      `Notify all waiting patients in queue that consultations are delayed by ~${minutes} minutes at ${clinicName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Broadcast +${minutes}m`,
          onPress: async () => {
            try {
              await delayMutation.mutateAsync({
                doctorId,
                clinicId,
                delayMinutes: minutes,
              });
              Alert.alert(
                'Patients Notified',
                `Broadcast sent: +${minutes} min delay has been sent to waiting patients.`
              );
            } catch (err) {
              Alert.alert(
                'Broadcast Failed',
                err instanceof Error ? err.message : 'Unable to broadcast delay.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Icon name="clock" size={13} color="#D97706" />
        </View>
        <Text style={styles.headerTitle}>Running Behind Schedule?</Text>
        {delayMutation.isPending && (
          <ActivityIndicator size="small" color="#D97706" style={styles.spinner} />
        )}
      </View>

      <Text style={styles.subtitle}>
        1-tap broadcast estimated delay to waiting patients' devices:
      </Text>

      <View style={styles.pillsRow}>
        {DELAY_OPTIONS.map((mins) => (
          <TouchableOpacity
            key={mins}
            style={styles.pillBtn}
            onPress={() => handleBroadcast(mins)}
            disabled={delayMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.pillText}>+{mins} min</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  spinner: {
    marginLeft: 'auto',
  },
  subtitle: {
    fontSize: 11,
    color: '#B45309',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: Radius.md,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
});
