import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { QueueToken } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DoctorQueueListProps {
  tokens?: QueueToken[];
  currentTokenNumber?: number;
}

export function DoctorQueueList({
  tokens = [],
  currentTokenNumber = 0,
}: DoctorQueueListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return {
          bg: '#FEF3C7',
          color: '#B45309',
          label: 'Waiting',
          icon: 'clock' as const,
        };
      case 'CHECKED_IN':
        return {
          bg: '#EFF6FF',
          color: '#1D4ED8',
          label: 'Checked In',
          icon: 'check-circle' as const,
        };
      case 'COMPLETED':
        return {
          bg: '#ECFDF5',
          color: '#047857',
          label: 'Completed',
          icon: 'check' as const,
        };
      case 'ABSENT':
        return {
          bg: '#F3F4F6',
          color: '#4B5563',
          label: 'Absent',
          icon: 'alert-circle' as const,
        };
      case 'CANCELLED':
        return {
          bg: '#FFE4E6',
          color: '#BE123C',
          label: 'Cancelled',
          icon: 'x' as const,
        };
      case 'PAUSED':
        return {
          bg: '#FFEDD5',
          color: '#C2410C',
          label: 'Paused',
          icon: 'pause' as const,
        };
      default:
        return {
          bg: '#F3F4F6',
          color: '#4B5563',
          label: status,
          icon: 'user' as const,
        };
    }
  };

  const formatTokenDisplay = (val: number) => {
    if (!val || val <= 0) return '--';
    return `#${val < 10 ? `0${val}` : val}`;
  };

  return (
    <GradientCard variant="blue" style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={styles.iconBox}>
              <Icon name="users" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.titleText}>Today's Queue Sequence</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{tokens.length} Tokens</Text>
          </View>
        </View>

        {tokens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Icon name="users" size={24} color={Colors.light.ink400} />
            </View>
            <Text style={styles.emptyTitle}>No patients currently in queue</Text>
            <Text style={styles.emptySubtitle}>
              New appointments booked for this clinic date will automatically appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {tokens.map((token, index) => {
              const isCurrent = token.token === currentTokenNumber;
              const badge = getStatusBadge(token.status);
              const formattedTime = token.bookedAt
                ? new Date(token.bookedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;

              return (
                <View
                  key={token.id || `token-${token.token}-${index}`}
                  style={[
                    styles.tokenRow,
                    isCurrent && styles.tokenRowCurrent,
                    index === tokens.length - 1 && styles.tokenRowLast,
                  ]}
                >
                  {/* Token Number Pill */}
                  <View
                    style={[
                      styles.tokenNumberBox,
                      isCurrent && styles.tokenNumberBoxCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tokenNumberText,
                        isCurrent && styles.tokenNumberTextCurrent,
                      ]}
                    >
                      {formatTokenDisplay(token.token)}
                    </Text>
                  </View>

                  {/* Patient Info */}
                  <View style={styles.patientInfoCol}>
                    <View style={styles.patientNameRow}>
                      <Text
                        style={[
                          styles.patientNameText,
                          isCurrent && styles.patientNameTextCurrent,
                        ]}
                        numberOfLines={1}
                      >
                        {token.patientName || `Patient #${token.token}`}
                      </Text>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.demographicsText}>
                      {[
                        token.patientAge != null ? `${token.patientAge} yrs` : null,
                        token.patientGender,
                        formattedTime,
                      ]
                        .filter(Boolean)
                        .join(' • ') || 'Standard Booking'}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: badge.bg },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.four,
  },
  content: {
    padding: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface200,
    paddingBottom: Spacing.three,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.one,
  },
  emptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surface100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink800,
  },
  emptySubtitle: {
    fontSize: 11,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  listContainer: {
    marginTop: Spacing.two,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
    gap: Spacing.three,
  },
  tokenRowCurrent: {
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.md,
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  tokenRowLast: {
    borderBottomWidth: 0,
  },
  tokenNumberBox: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface100,
    minWidth: 44,
    alignItems: 'center',
  },
  tokenNumberBoxCurrent: {
    backgroundColor: Colors.light.primary,
  },
  tokenNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.ink900,
  },
  tokenNumberTextCurrent: {
    color: '#FFFFFF',
  },
  patientInfoCol: {
    flex: 1,
    gap: 2,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.ink900,
    flexShrink: 1,
  },
  patientNameTextCurrent: {
    color: '#1E40AF',
  },
  currentBadge: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  demographicsText: {
    fontSize: 11,
    color: Colors.light.ink500,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
