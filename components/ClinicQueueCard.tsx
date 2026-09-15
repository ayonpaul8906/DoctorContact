import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import type { DailyDashboardQueueItem } from '../types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../theme';
import { getImageUrl } from '../utils/image';

interface ClinicQueueCardProps {
  queueItem: DailyDashboardQueueItem;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ClinicQueueCard({ queueItem }: ClinicQueueCardProps) {
  const currentToken = queueItem.currentToken || 0;
  const lastIssued = queueItem.lastTokenIssued || 0;
  const waitingCount = Math.max(0, lastIssued - currentToken);
  const rawName = queueItem.doctorName || 'Doctor';
  const docName = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`;
  const initials = getInitials(rawName);
  const doctorAvatar =
    (queueItem as any).doctorAvatar ||
    (queueItem as any).avatar ||
    (queueItem as any).profilePhoto ||
    null;
  const resolvedAvatar = getImageUrl(doctorAvatar);

  const isActive = queueItem.status?.toUpperCase() === 'ACTIVE';
  const isPaused = queueItem.status?.toUpperCase() === 'PAUSED';

  const progress = lastIssued > 0 ? Math.min(100, Math.round((currentToken / lastIssued) * 100)) : 0;

  return (
    <GradientCard variant={isActive ? 'blue' : 'purple'} style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.doctorInfoRow}>
            <View style={[styles.avatarBox, { backgroundColor: isActive ? Colors.light.primary : '#7C3AED' }]}>
              {resolvedAvatar ? (
                <Image source={{ uri: resolvedAvatar }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={styles.docCol}>
              <Text style={styles.doctorNameText} numberOfLines={1}>
                {docName}
              </Text>
              <Text style={styles.docSubText}>Consultation Queue</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isActive ? '#ECFDF5' : isPaused ? '#FEF3C7' : '#F3F4F6',
              },
            ]}
          >
            {isActive && <View style={styles.pulseDot} />}
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isActive ? '#047857' : isPaused ? '#B45309' : '#4B5563',
                },
              ]}
            >
              {isActive ? 'LIVE QUEUE' : isPaused ? 'PAUSED' : queueItem.status || 'CLOSED'}
            </Text>
          </View>
        </View>

        {/* 3 Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Serving Now</Text>
            <Text style={[styles.metricValue, { color: Colors.light.primary }]}>
              {currentToken > 0 ? `#${currentToken}` : '--'}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Last Issued</Text>
            <Text style={styles.metricValue}>
              {lastIssued > 0 ? `#${lastIssued}` : '--'}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Waiting</Text>
            <Text style={[styles.metricValue, { color: waitingCount > 0 ? '#D97706' : '#047857' }]}>
              {waitingCount}
            </Text>
          </View>
        </View>

        {/* Queue Progress Bar */}
        {lastIssued > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Queue Completion</Text>
              <Text style={styles.progressPercent}>{progress}% ({currentToken}/{lastIssued})</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.three,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  docCol: {
    flex: 1,
    gap: 1,
  },
  doctorNameText: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  docSubText: {
    fontSize: 10,
    color: Colors.light.ink500,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#047857',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface50,
    borderRadius: Radius.md,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.ink500,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: Colors.light.surface200,
  },
  progressContainer: {
    gap: 4,
    backgroundColor: Colors.light.surface50,
    padding: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.surface200,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink600,
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: Colors.light.surface200,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.full,
  },
});
