import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '../theme';
import { Icon } from './Icon';

type ReferralStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface ReferralCardProps {
  patientName: string;
  testType: string;
  referredBy?: string;
  status: ReferralStatus;
  referredAt: string;
  completedAt?: string;
  onActionPress?: () => void;
  actionLabel?: string;
}

const STATUS_CONFIG: Record<ReferralStatus, { bg: string; text: string; label: string }> = {
  PENDING:     { bg: '#FEF3C7', text: '#B45309',  label: 'Pending' },
  IN_PROGRESS: { bg: '#EFF6FF', text: '#1D4ED8',  label: 'In Progress' },
  COMPLETED:   { bg: '#DCFCE7', text: '#15803D',  label: 'Completed' },
  CANCELLED:   { bg: '#FEF2F2', text: '#DC2626',  label: 'Cancelled' },
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

export function ReferralCard({
  patientName,
  testType,
  referredBy,
  status,
  referredAt,
  completedAt,
  onActionPress,
  actionLabel,
}: ReferralCardProps) {
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const showAction =
    onActionPress &&
    actionLabel &&
    (status === 'PENDING' || status === 'IN_PROGRESS');

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {patientName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.patientName} numberOfLines={1}>
            {patientName}
          </Text>
          {referredBy && (
            <Text style={styles.referredBy} numberOfLines={1}>
              Referred by Dr. {referredBy}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Test Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Icon name="flask" size={13} color={Colors.light.ink500} />
          <Text style={styles.infoLabel}>Test</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{testType}</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="calendar" size={13} color={Colors.light.ink500} />
          <Text style={styles.infoLabel}>Referred</Text>
          <Text style={styles.infoValue}>{formatDate(referredAt)}</Text>
        </View>
        {completedAt && (
          <View style={styles.infoItem}>
            <Icon name="check-circle" size={13} color="#15803D" />
            <Text style={styles.infoLabel}>Done</Text>
            <Text style={styles.infoValue}>{formatDate(completedAt)}</Text>
          </View>
        )}
      </View>

      {/* Action */}
      {showAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onActionPress}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F766E',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  patientName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  referredBy: {
    fontSize: 11,
    color: Colors.light.ink500,
    marginTop: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.surface200,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 80,
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 11,
    color: Colors.light.ink800,
    fontWeight: '600',
    flex: 1,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
