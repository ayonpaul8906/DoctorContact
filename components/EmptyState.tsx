import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GradientCard } from './GradientCard';
import { Icon } from './Icon';
import { Colors, Spacing, Radius, Typography } from '../theme';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onActionPress?: () => void;
  actionLabel?: string;
}

export function EmptyState({
  title = 'No Appointments Yet',
  description = 'You do not have any upcoming appointments. Book your first appointment to track your live queue.',
  onActionPress,
  actionLabel = 'Find a Doctor',
}: EmptyStateProps) {
  return (
    <GradientCard variant="purple" style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name="calendar" size={28} color="#FFFFFF" />
        </View>

        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.descriptionText}>{description}</Text>

        {onActionPress && actionLabel ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onActionPress}
            activeOpacity={0.85}
          >
            <Icon name="stethoscope" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
            <Icon name="chevron-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Spacing.two,
  },
  content: {
    padding: Spacing.five,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.xl,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  titleText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.light.ink900,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  descriptionText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.light.ink500,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.sm,
    maxWidth: 280,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    marginTop: Spacing.four,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
