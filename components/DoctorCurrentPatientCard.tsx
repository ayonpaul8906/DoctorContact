import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientCard } from './GradientCard';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import type { QueueToken } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';

interface DoctorCurrentPatientCardProps {
  currentPatientToken?: QueueToken;
  currentTokenNumber?: number;
  queueStatus?: string;
}

export function DoctorCurrentPatientCard({
  currentPatientToken,
  currentTokenNumber = 0,
  queueStatus = 'ACTIVE',
}: DoctorCurrentPatientCardProps) {
  const hasCurrentPatient =
    Boolean(currentPatientToken) || currentTokenNumber > 0;

  const formatTokenDisplay = (val: number) => {
    if (!val || val <= 0) return '--';
    return `#${val < 10 ? `0${val}` : val}`;
  };

  const formattedBookingTime = currentPatientToken?.bookedAt
    ? new Date(currentPatientToken.bookedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <GradientCard variant="blue" style={styles.card}>
      <View style={styles.content}>
        {/* Card Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={styles.iconBox}>
              <Icon name="stethoscope" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.titleText}>Current Patient In Consultation</Text>
          </View>
          {hasCurrentPatient && (
            <View style={styles.activeCallBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeCallText}>Serving Now</Text>
            </View>
          )}
        </View>

        {!hasCurrentPatient ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Icon name="user" size={24} color={Colors.light.ink400} />
            </View>
            <Text style={styles.emptyTitle}>No Patient Currently Called</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Call Next" in the queue actions below to advance and call the next waiting patient.
            </Text>
          </View>
        ) : (
          <View style={styles.patientDetailsContainer}>
            {/* Token Hero Banner */}
            <View style={styles.tokenHeroRow}>
              <View>
                <Text style={styles.tokenHeroLabel}>Serving Token</Text>
                <Text style={styles.tokenHeroNumber}>
                  {formatTokenDisplay(
                    currentPatientToken?.token ?? currentTokenNumber
                  )}
                </Text>
              </View>
              <View style={styles.tokenStatusBadge}>
                <Text style={styles.tokenStatusText}>
                  {currentPatientToken?.status || queueStatus || 'IN PROGRESS'}
                </Text>
              </View>
            </View>

            {/* Demographics & Metadata */}
            <View style={styles.metaList}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Patient Name</Text>
                <Text style={styles.metaValue}>
                  {currentPatientToken?.patientName ||
                    `Patient #${currentPatientToken?.token ?? currentTokenNumber}`}
                </Text>
              </View>

              {(currentPatientToken?.patientAge != null ||
                currentPatientToken?.patientGender) && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Demographics</Text>
                  <Text style={styles.metaValue}>
                    {[
                      currentPatientToken.patientAge != null
                        ? `${currentPatientToken.patientAge} yrs`
                        : null,
                      currentPatientToken.patientGender,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
              )}

              {formattedBookingTime && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Booked At</Text>
                  <Text style={styles.metaValueMono}>{formattedBookingTime}</Text>
                </View>
              )}
            </View>
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
    flex: 1,
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
  activeCallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  activeCallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
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
  patientDetailsContainer: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  tokenHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tokenHeroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  tokenHeroNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.light.ink900,
    marginTop: 1,
  },
  tokenStatusBadge: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
  },
  tokenStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metaList: {
    gap: Spacing.two,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface100,
    paddingBottom: Spacing.one,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.light.ink500,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  metaValueMono: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.ink800,
  },
});
