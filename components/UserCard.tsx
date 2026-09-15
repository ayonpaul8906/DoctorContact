import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { RoleBadge } from './RoleBadge';
import type { Role } from '../types';

interface UserCardProps {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  phone?: string;
  createdAt?: string;
  onPress?: () => void;
  onActionPress?: () => void;
  actionLabel?: string;
  actionVariant?: 'primary' | 'danger';
}

const ROLE_AVATAR_COLORS: Record<string, string> = {
  PATIENT:          '#1B3A8C',
  DOCTOR:           '#059669',
  CLINIC:           '#7C3AED',
  ADMIN:            '#DC2626',
  SUPER_ADMIN:      '#D97706',
  DIAGNOSTIC_CENTER:'#0F766E',
  DIAGNOSTIC_STAFF: '#0284C7',
  RECEPTIONIST:     '#DB2777',
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function UserCard({
  name,
  email,
  role,
  phone,
  createdAt,
  onPress,
  onActionPress,
  actionLabel,
  actionVariant = 'primary',
}: UserCardProps) {
  const avatarColor = ROLE_AVATAR_COLORS[role] ?? Colors.light.primary;
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  const cardContent = (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.email} numberOfLines={1}>{email}</Text>
          <View style={styles.metaRow}>
            {phone && (
              <Text style={styles.meta}>{phone}</Text>
            )}
            {createdAt && (
              <Text style={styles.meta}>Joined {formatDate(createdAt)}</Text>
            )}
          </View>
        </View>

        {/* Role Badge */}
        <RoleBadge role={role as Role} size="sm" />
      </View>

      {/* Action Button */}
      {onActionPress && actionLabel && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            actionVariant === 'danger' && styles.actionButtonDanger,
          ]}
          onPress={onActionPress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionButtonText,
              actionVariant === 'danger' && styles.actionButtonTextDanger,
            ]}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  infoSection: {
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  email: {
    fontSize: 12,
    color: Colors.light.ink600,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: Colors.light.ink400,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1,
  },
  actionButtonDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: 'transparent',
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonTextDanger: {
    color: '#DC2626',
  },
});
