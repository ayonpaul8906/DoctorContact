import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Role } from '../types';
import { Radius } from '../theme';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
}

const ROLE_CONFIG: Record<
  Role,
  { label: string; bg: string; border: string; text: string }
> = {
  PATIENT: {
    label: 'Patient',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1D4ED8',
  },
  DOCTOR: {
    label: 'Doctor',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#047857',
  },
  CLINIC: {
    label: 'Clinic',
    bg: '#EEF2FF',
    border: '#C7D2FE',
    text: '#4338CA',
  },
  DIAGNOSTIC_CENTER: {
    label: 'Diagnostic Center',
    bg: '#FAF5FF',
    border: '#E9D5FF',
    text: '#7E22CE',
  },
  DIAGNOSTIC_STAFF: {
    label: 'Diagnostic Staff',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    text: '#6D28D9',
  },
  ADMIN: {
    label: 'Admin',
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: '#B45309',
  },
  SUPER_ADMIN: {
    label: 'Super Admin',
    bg: '#FFF1F2',
    border: '#FECDD3',
    text: '#BE123C',
  },
  RECEPTIONIST: {
    label: 'Receptionist',
    bg: '#F0FDFA',
    border: '#99F6E4',
    text: '#0F766E',
  },
};

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] || {
    label: role,
    bg: '#F3F4F6',
    border: '#E5E7EB',
    text: '#374151',
  };

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
