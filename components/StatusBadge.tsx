import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import type { AppointmentStatus } from '../types';
import { Radius, Shadows } from '../theme';

interface StatusBadgeProps {
  status: AppointmentStatus;
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; shadow: string }
> = {
  WAITING: {
    label: 'Waiting',
    bg: '#F59E0B',
    shadow: '#D97706',
  },
  CHECKED_IN: {
    label: 'Checked In',
    bg: '#1E3A8A',
    shadow: '#1E40AF',
  },
  ABSENT: {
    label: 'Absent',
    bg: '#6B7280',
    shadow: '#4B5563',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#059669',
    shadow: '#047857',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#F43F5E',
    shadow: '#E11D48',
  },
  IN_CONSULTATION: {
    label: 'In Room',
    bg: '#7C3AED',
    shadow: '#6D28D9',
  },
  PAUSED: {
    label: 'Paused',
    bg: '#D97706',
    shadow: '#B45309',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: '#6B7280',
    shadow: '#4B5563',
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          shadowColor: config.shadow,
        },
      ]}
    >
      <Icon name="sparkles" size={11} color="#FFFFFF" />
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
